import { Component, ElementRef, OnDestroy, OnInit, ViewChild,ChangeDetectorRef } from '@angular/core';
import { filter } from 'rxjs/operators';
import { CallService } from './services/call.service';
import { Call } from './model/call/Call';
import { Estado } from './model/call/Enum_call';
import {  Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';


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

  public state = 0;

  constructor(public callService: CallService,private cdr:ChangeDetectorRef) {
  }
  
  ngOnInit(): void {
    //muestra loading

    this.peerId = this.callService.initPeer(); 
    //Servicio de control de UI
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
          console.log("ESTADO LLAMANDO")
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

    //Recoge la webcam y el microfono del navegador de manera local
    this.callService.localStream$
      .pipe(filter(res => !!res))
      .subscribe(stream => this.localVideo.nativeElement.srcObject = stream)
    
    //Recoge la webcam y el microfono del equipo remoto
    this.callService.remoteStream$
      .pipe(filter(res => !!res))
      .subscribe(stream => this.remoteVideo.nativeElement.srcObject = stream)

      //oculta animación
  }
  
  ngOnDestroy(): void {
    //desconecta la llamada
    this.callService.destroyPeer();
    if(this.subscriptionState){
      this.subscriptionState.unsubscribe();
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
      CajeroId:+environment.id_cajero,
      UserId:null
    }
    try{
      await this.callService.stablishCall(call);
    }catch(err){
      console.error(err);
    }
    this.callService.enableCallAnswer();
  }

  public async cancelCall(){
    await this.callService.cancelCall();
  }

  //metodo para terminar la llamada
  public endCall() {
    this.callService.closeMediaCall();
    
  }
}
