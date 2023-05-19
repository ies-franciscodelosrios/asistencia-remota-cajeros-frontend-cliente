import { Component, ElementRef, OnDestroy, OnInit, ViewChild,ChangeDetectorRef } from '@angular/core';
import { filter } from 'rxjs/operators';
import { CallService } from './services/call.service';
import { Call } from './model/call/Call';
import { Estado } from './model/call/Enum_call';
import {  Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Modal } from "bootstrap";


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
  
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>; //VideoLocal de la webcam
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>; //Video remoto
  @ViewChild('iniciar') iniciar!: ElementRef<HTMLButtonElement>;
  @ViewChild('colgar') colgar!: ElementRef<HTMLButtonElement>;
  @ViewChild('staticBackdrop') modal!: any;
  

  public state = 0;

  constructor(public callService: CallService,private cdr:ChangeDetectorRef) {
  }
  
  ngOnInit(): void {
    //muestra loading
    try {
      this.peerId = this.callService.initPeer(); 
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
            //document.getElementById("colgar")?.click();
            this.state=state;
            console.log("ESTADO INICIAL");
            //poner el botón rojo gordo
            break;
          case 1:
            this.state=state;
            console.log("ESTADO LLAMANDO");
            this.openQeue();
            //poner la animación verde y cancelar
            break;
          case 2:
            this.state=state;
            console.log("EN LLAMADA")
            //poner la llmada y el colgar
            break;
          default: console.log("ESTADO DESCONOCIDO"); break;
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

  public openQeue(){
    const element = document.getElementById('queueModal') as HTMLElement;
    const myModal = new Modal(element);
    myModal.show();
  }

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

  public openRate(){
    const element = document.getElementById('rateModal') as HTMLElement;
    const myModal = new Modal(element);
    myModal.show();
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
      CajeroId:+environment.id_cajero,
      UserId:null
    }
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

  public async cancelCall(){
    try{
      await this.callService.cancelCall();
      this.openRate();
      this.highlightStars();
    } catch (error) {
      const endCallToast = document.getElementById('endCallToast');
        const toast = new bootstrap.Toast(endCallToast);
        toast.show()
        console.log(error)
    }
  }

  //metodo para terminar la llamada
  public endCall() {
    try{
      this.callService.closeMediaCall();
    } catch (error) {
      const endCallToast = document.getElementById('endCallToast');
        const toast = new bootstrap.Toast(endCallToast);
        toast.show()
        console.log(error)
    }
  }
}
