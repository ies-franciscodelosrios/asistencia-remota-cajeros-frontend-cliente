import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Call } from '../model/call/Call';

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
      CajeroId:call.CajeroId,
      UserId:call.UserId
      
    }
    return this.http.post<Call>(`${environment.serverURL}/api/Call`,data);
  }

  public getAllCalls():Observable<Call[]>{
    return this.http.get<Call[]>(`${environment.serverURL}/api/Call/GetAll`);
  }

  public getCall(id:number):Observable<Call>{
    const url = `${environment.serverURL}/api/Call/get/${id}`;
    return this.http.get<Call>(url);
  }

  public deleteCall(id:number): Observable<Call> {
    console.log("BORRANO ID "+id)
    return this.http.delete<Call>(`${environment.serverURL}/api/Call/Delete/${id}`);
  }
}
