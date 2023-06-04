import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import Peer from 'peerjs';
import * as peerjs from "peerjs";
import { BehaviorSubject, lastValueFrom, Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { CallBD } from './CallBD.service';
import { Call } from '../model/call/Call';

@Injectable({
    providedIn: 'root'
})
export class CallService {
    //El objeto que le va a dar la id de llamada al cagero
    private peer!: Peer;
    private mediaCall!: peerjs.MediaConnection;

    //Stream de datos que se va a convertir en la webcam y el microfono local
    private localStreamBs: BehaviorSubject<MediaStream> = new BehaviorSubject(null);
    public localStream$ = this.localStreamBs.asObservable();

    //Stream de datos remoto que se va a convertir en la webcam y el microfono remoto
    private remoteStreamBs: BehaviorSubject<MediaStream> = new BehaviorSubject(null);
    public remoteStream$ = this.remoteStreamBs.asObservable();
    /**
     *  0 estado inicial
     *  1, llamando
     *  2, en llamada
     */
    private stateCalling: BehaviorSubject<number> = new BehaviorSubject(0);
    public stateCalling$ = this.stateCalling.asObservable();

    private id!: string;
    private _call: Call;

    constructor(private callDBS: CallBD) { }

    public set call(c: Call) {
        this._call = c;
    }
    public get call() {
        return this._call;
    }

    public initPeer(): string {
        /**
         * Mejora v2
         * Crear um sockect con back (signalR) parar controlar el estado de los cajeros. Cuando el socket está UP esque el cajero está OK, si no está el socket el cajero estác caído.
         */
        /**
         * Si el peer es nulo o esta desconectado crea un nuevo peer
         * con los diferentes servidores stun para que podamos crear una id
         * Finalmente creamos una id para la videollamada (parte del codio en el try catch)
         */
        if (!this.peer || this.peer.disconnected) {
            const peerJsOptions: peerjs.PeerJSOption = {
                debug: 3,
                config:  {
                    iceServers: [
                        {
                            urls: [
                                'stun:stun1.l.google.com:19302',
                                'stun:stun2.l.google.com:19302',
                            ],
                        }]
                }
            };
            try {
                if(!this.id) this.id = uuidv4();
                this.peer = new Peer(this.id, peerJsOptions);
                return this.id;
            } catch (error) {
                console.error(error);
                return "";
            }
        } else {
            return this.id;
        }
    }

    public async stablishCall(call: Call): Promise<void> {
        this.stateCalling.next(1);
        this._call = await lastValueFrom(this.callDBS.postCall(call));
    }

    public async cancelCall() {
        this.stateCalling.next(0);
        if (this._call)
            await lastValueFrom(this.callDBS.deleteCall(this._call.id));
    }
    public async enableCallAnswer() {

        try {
            //coge la webcam y el microfono del navegador
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.localStreamBs.next(stream);

            this.peer.on('call', async (call) => {

                //inicia la llamada
                this.mediaCall = call;
                //muestra la camara y el sonido del equipo remoto
                this.mediaCall.answer(stream);
                this.mediaCall.on('stream', (remoteStream) => {
                    this.stateCalling.next(2);  //descolgar
                    this.remoteStreamBs.next(remoteStream);
                });
                //si recibe un mensaje de error nos imprimer el error y lo muestra por pantalla
                this.mediaCall.on('error', err => {
                    console.error(err);
                    this.stateCalling.next(0);
                });
                this.mediaCall.on("iceStateChanged",(e)=>{
                    
                    if(e=="disconnected"){
                        this.closeMediaCall();
                    }
                })
                //si recive un mensaje de close, cierra la llamada
                this.mediaCall.on('close', () => this.onCallClose());
            });
        }
        catch (ex) {
            //nos imprimer el error y lo muestra por pantalla
            console.error(ex);
            this.stateCalling.next(0);
        }
    }

    /**
     * Esta función lo que hace es que cuando termina la llamada para la ejecución de la webcam y el microfono
     * tanto del equipo local como la del remoto
     */
    private onCallClose() {
        this.remoteStreamBs?.value.getTracks().forEach(track => {
            track.stop();
        });
        this.localStreamBs?.value.getTracks().forEach(track => {
            track.stop();
        });
        
    }

    /**
     * esta función cierra la comunicación p2p
     */
    public closeMediaCall() {
        this.destroyPeer();
        this.initPeer();
        this.stateCalling.next(0);
    }

    /**
     * Esta función se ejecuta cuando se cierra la llamada y lo que hace es destruir la conecxión p2p y nuestro peer
     */
    public destroyPeer() {
        this.mediaCall?.close();
        if (!this.mediaCall) {
            this.onCallClose()
        }
        this.peer?.disconnect();
        this.peer?.destroy();
    }
}
