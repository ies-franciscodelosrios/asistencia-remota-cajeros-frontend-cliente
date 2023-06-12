import { Component, ElementRef, OnDestroy, OnInit, ViewChild,ChangeDetectorRef } from '@angular/core';
import { filter } from 'rxjs/operators';
import { CallService } from './services/call.service';
import { Call } from './model/call/Call';
import { Estado } from './model/call/Enum_call';
import {  Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Modal } from "bootstrap";
import { CallBD } from './services/CallBD.service';
import { Cajero } from './model/call/Cajero';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


declare var bootstrap:any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  public isCallStarted: Observable<boolean>; //booleano que indica si se ha iniciado una llamada
  private peerId: string; //id que le pasa el cajero a la API para la llamada
  private subscriptionState:Subscription;
  private call:Call;
  private ipAddress:any;
  private CajeroIp:Cajero = null;
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>; //VideoLocal de la webcam
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>; //Video remoto
  @ViewChild('iniciar') iniciar!: ElementRef<HTMLButtonElement>;
  @ViewChild('colgar') colgar!: ElementRef<HTMLButtonElement>;
  @ViewChild('staticBackdrop') modal!: any;
  @ViewChild('qeuePosition') qeuePosition!: ElementRef<HTMLSpanElement>;
  @ViewChild('qeueTime') qeueTime!: ElementRef<HTMLSpanElement>;

  public state = 0;

  constructor(private peticion:HttpClient,public callService: CallService,private callBDService:CallBD, private cdr:ChangeDetectorRef, private route:ActivatedRoute, private router:Router) {
  }
  
  async ngOnInit(): Promise<void> {
    //muestra loading
    try {
      this.peerId = this.callService.initPeer(); 
      await this.peticion.get("http://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.ipAddress = res.ip;
      const queryParams = { ip: this.ipAddress };
      this.router.navigate([], { queryParams,  queryParamsHandling: 'merge' });
      this.getIPAddress();
    });
    } catch (error) {
      const peerToast = document.getElementById('peerToast');
        const toast = new bootstrap.Toast(peerToast);
        toast.show()
        console.log(error)
    }
    
    //Servicio de control de UI
    try{

      this.subscriptionState=this.callService.stateCalling$.subscribe(state=>{
        switch(state){
          case 0:
            this.state=state;
            break;
          case 1:
            this.state=state;
            this.openQeue();
            break;
          case 2:
            this.state=state;
            break;
          default:
            break;
        }
        this.cdr.detectChanges();
      })

    } catch (error) {
      const windowToast = document.getElementById('windowToast');
        const toast = new bootstrap.Toast(windowToast);
        toast.show()
        console.log(error)
    }

    try{
      //Recoge la webcam y el microfono del navegador de manera local
      this.callService.localStream$
        .pipe(filter(res => !!res))
        .subscribe(stream => this.localVideo.nativeElement.srcObject = stream)
      
      //Recoge la webcam y el microfono del equipo remoto
      this.callService.remoteStream$
        .pipe(filter(res => !!res))
        .subscribe(stream => this.remoteVideo.nativeElement.srcObject = stream)

    } catch (error) {
      const streamToast = document.getElementById('streamToast');
        const toast = new bootstrap.Toast(streamToast);
        toast.show()
        console.log(error)
    }
      //oculta animación
  }
  
  ngOnDestroy(): void {
    //desconecta la llamada
    try{
      this.callService.destroyPeer();
      if(this.subscriptionState){
        this.subscriptionState.unsubscribe();
      }
    } catch (error) {
      const endCallToast = document.getElementById('endCallToast');
        const toast = new bootstrap.Toast(endCallToast);
        toast.show()
        console.log(error)
    }

  }

  /**
   * Hace una petición post a la API pasandole el id de la llamada y el propio id del cagero.
   * Después ejecuta la función que inicia la llamada pero lo pone a la espera
   */
  public async startCall(): Promise<void> {

    let DateTime = new Date();
    const call:Call = {
      id:0,
      p2p:this.peerId,
      estado:Estado.Calling,
      date:DateTime,
      cajeroId:+environment.id_cajero,
      userId:null
    }
    this.call=call;
    try{
      this.callService.enableCallAnswer();
    }catch(error){
      const callToast = document.getElementById('callToast');
      const toast = new bootstrap.Toast(callToast);
      toast.show()
      console.log(error)
    }
    try{
      await this.callService.stablishCall(call);
    } catch (error) {
      const postToast = document.getElementById('postToast');
      const toast = new bootstrap.Toast(postToast);
      toast.show()
      console.error(error);
    }
  }

  /**
   * Función para cancelar la llamada y dar una valoración a la experienca de la llamada
   */
  public async cancelCall(){
    try{
      await this.callService.cancelCall();
    } catch (error) {
      const endCallToast = document.getElementById('endCallToast');
        const toast = new bootstrap.Toast(endCallToast);
        toast.show()
        console.log(error)
    }
  }

  /**
   * Metodo para terminar la llamada en la cual se abre primero el modal de rating para que el usuario valore la llamada
   * y actualiza la llamada y por consiguiente cerramos los buffers de entrada y salida y termina la llamada.
   */
  public endCall() {
    try{
      this.openRate();
      this.highlightStars();
      this.callService.closeMediaCall();
    } catch (error) {
      const endCallToast = document.getElementById('endCallToast');
        const toast = new bootstrap.Toast(endCallToast);
        toast.show()
        console.log(error)
    }
  }

/**
 * Función que abre un modal en el que se muestra el tiempo de espera medio y la posición en la cola
 * La función GetDurationEstimated() nos deuelve un la duración estimada de la cola.
 * Despues formateamos ese numero para que parezca un tiempo de minitos y segundos y lo asignamos a al span correspondiente.
 * 
 * Esta función tambíen setea en el span correspondiente el numero que estamos en la cola mediante el metodo GetQeueNumber().
 */
  public openQeue(){
    const element = document.getElementById('queueModal') as HTMLElement;
    const myModal = new Modal(element);
    this.callBDService.GetDurationEstimated().subscribe (
      number => {
            const minutos = Math.floor(number);
            const segundos = Math.round((number - minutos) * 60);
            const tiempoFormateado = `${minutos} minuto${minutos !== 1 ? 's' : ''} y ${segundos} segundo ${segundos !== 1 ? 's' : ''}`;
            this.qeueTime.nativeElement.textContent=tiempoFormateado;
      },
      error => {
        console.log(error);
      }
    )
    this.callBDService.GetQueueNumber(this.call.id).subscribe(
      number => {
        this.qeuePosition.nativeElement.textContent=String(number);
      },
      error => {
        console.log(error);
      }
   )
    myModal.show();
  }

  /**
   * Esta función simplemente abre el modal donde se muestran 5 estrellas para que el usuario valore la experiencia de la llamada
   */
  public openRate(){
    const element = document.getElementById('rateModal') as HTMLElement;
    const myModal = new Modal(element);
    myModal.show()
  }

  /**
   * Esta función asigna un rating del 1 al 5 a la llamada mediante unas estrellas que se muestran en el html.
   * Después setea la llamada para actualizar los datos.
   * @param rate rate es un numero que representa la valoración que le da a la llamada va desde el 1 hasta el 5
   */
  public sendRating(rate:number){
    this.callBDService.getCall(this.call.id).subscribe(tempcall=>{
      tempcall.rating=rate;
      this.callBDService.UpdateRating(tempcall.id,tempcall,tempcall.userId);
    });
    
  }

  /**
   * Función que le da formato a las estrellas que se muestra en el modal de Rating
   * Cuando el raton para por encima de las estrellas lo que hace es darle unos estilos
   * que en nuestro caso es background color, le aumenta la escala y le da un border-radious
   * para destacar que estrellas a seleccionado y cuales no.
   */
  public highlightStars(){
    // Obtener todas las imágenes de estrella
    const stars = document.querySelectorAll('.star');

    // Agregar un controlador de eventos a cada imagen de estrella
    stars.forEach(star => {
      star.addEventListener('mouseover', function() {
        // Obtener el id de la estrella actual
        const currentStarId = this.id;
        
        // Obtener el número de estrella actual (extraer el número del id)
        const currentStarNumber = parseInt(currentStarId.replace('star', ''));
        
        // Hacer las estrellas previas más grandes
        for (let i = 1; i <= currentStarNumber; i++) {
          const star = document.getElementById(`star${i}`);
          star.style.setProperty("background-color", " rgb(202, 202, 202)")
          star.style.setProperty('scale','1.3');
          star.style.setProperty('border-radius','15px');
          star.style.setProperty('cursor','pointer');
           // Hacer la estrella más grande
        }
        
        // Hacer las estrellas siguientes más pequeñas
        for (let i = currentStarNumber + 1; i <= 5; i++) {
          const star = document.getElementById(`star${i}`);
          star.style.setProperty('scale','1');
          star.style.setProperty('background-color','white'); // Restaurar el tamaño original de la estrella
        }
      });
    });
  }

   /**
   * Función que coge la ip del cajero de los parametros de la url cambia hace una peticion
   * para cager el cajero por ip y cambia el id del cajero del enviroment de la aplicación
   */
  public getIPAddress() {
    this.route.queryParams
      .subscribe(params => {
        this.ipAddress = params['ip'];
        this.callBDService.getCashierByIp(this.ipAddress).subscribe(
          data => {
            this.CajeroIp = data;
            environment.id_cajero = this.CajeroIp.id;
          }
        )
      })
  }
}
