import { Cajero } from "./Cajero";
import { Estado } from "./Enum_call";
import { Rating } from "./Rating";
import { User } from "./User";

export interface Call{
    id?:number,
    p2p:string,
    estado:Estado,
    date:Date,
    duration?:number,
    rating?:Rating,
    cajeroId:number,
    userId?:number,
    formatted?:string
}