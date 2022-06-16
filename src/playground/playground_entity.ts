import { ISelectable } from "../model/core";
import { ILocation } from "../model/space";

export class Entity implements ISelectable {
    loc: ILocation;

    constructor(loc?: ILocation){
        this.loc = loc;
    }

    setLoc(loc: ILocation){
        this.loc = loc; 
    }
}