import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Call } from '../model/call/Call';
import { Cajero } from '../model/call/Cajero';

@Injectable({
  providedIn: 'root'
})
export class CallBD {
call:Call;
  constructor( private readonly http:HttpClient) { 

  }

  public postCall(call:Call):Observable<Call>{
    let data:Call = {
      id:call.id,
      p2p:call.p2p,
      estado:call.estado,
      date:call.date,
      duration:call.duration,
      rating:call.rating,
      cajeroId:call.cajeroId,
      userId:call.userId,
      formatted:call.formatted
    }
    return this.http.post<Call>(`${environment.serverURL}/api/Call`,data,{
      headers: { "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json" }
    });
  }

  public getAllCalls():Observable<Call[]>{
    return this.http.get<Call[]>(`${environment.serverURL}/api/Call/GetAll`);
  }

  public getCall(id:number):Observable<Call>{
    const url = `${environment.serverURL}/api/Call/get/${id}`;
    return this.http.get<Call>(url);
  }

  public deleteCall(id:number): Observable<Call> {
    return this.http.delete<Call>(`${environment.serverURL}/api/Call/Delete/${id}`);
  }

  /**
     * Metodo que devuelve el numero de cola que se encuentra la llamada que se acaba de hacer
     * @param idCall de la llamada en proceso que queremos saber el numero de cola en el que estamos
     * @returns el numero de cola que nos encontramos
     */
  public GetQueueNumber(idCall:Number) : Observable<Number> {
    return this.http.get<Number>(`${environment.serverURL}/api/Call/QueueNumber/${idCall}`);
  }

  /**
     * Metodo que devuelve el tiempo estimado de espera de la llamada para ser atendida
     * @returns el numero estimado de tiempo que tenemos que esperar para que nuestra llamada sea atendida
     */
  public GetDurationEstimated () : Observable<number> {
    return this.http.get<number>(`${environment.serverURL}/api/Call/DurationEstimated`); //En este método number tiene que ser en minúscula porque sino da error al convertirlo
  }

  /**
     * Metodo que actualiza el rating de la llamada que acabamos de terminar
     * @param id de la llamada que vamos a actualizar con el rating que el usuario proporcione
     * @param Call llamada que hemos terminado y vamos a darle un rating
     * @param idUser del usuario del que setearemos el nuevo rating de la llamada y haremos una media
     */
  public UpdateRating(id:Number, Call:Call, idUser:Number) {
    const url = `${environment.serverURL}/api/Call/UpdateRating/${id}`;
    this.http.put(url, Call, { params: { idUser: idUser.toString() } }).subscribe(
      () => {
        console.log('Datos actualizados correctamente');
      },
      (error) => {
        console.error('Error al actualizar los datos', error);
      }
    );
  }

  public getCashierByIp(ip:string):Observable<Cajero> {
    const url = `${environment.serverURL}/api/Cajero/getByIp/${ip}`;
    return this.http.get<Cajero>(url);
  }
}
