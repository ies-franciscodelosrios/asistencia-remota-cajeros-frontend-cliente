import { Cajero } from "./Cajero";
import { Estado } from "./Enum_call";
import { User } from "./User";

export interface Call{
    id?:number,
    p2p:string,
    estado:Estado,
    date:Date,
    CajeroId:number,
    UserId?:number|null
    
}