import { Action } from "./action";
import { ISelectable } from "./core";
import { ILocation } from "./space";
import { IState } from "./state";

export class Entity implements ISelectable {
    loc: ILocation;
    actions: Array<Action<ISelectable, IState>>;

    constructor(loc?: ILocation){
        this.loc = loc;
    }

    setLoc(loc: ILocation){
        this.loc = loc; 
    }
    
    setActions(actions: Array<Action<ISelectable, IState>>) {
        this.actions = actions;
    }
}