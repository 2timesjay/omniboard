import { ISelectable } from "./core";
import { ILocation } from "./space";

export class Entity implements ISelectable {
    loc: ILocation;

    constructor(loc?: ILocation){
        this.loc = loc;
    }

    setLoc(loc: ILocation){
        this.loc = loc; 
    }
}