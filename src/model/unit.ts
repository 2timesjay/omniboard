import { ISelectable } from "./core";
import { GridLocation } from "./space";
import { Action } from "./state";


export const BASIC_ACTIONS = new Array<Action<ISelectable>>(
    
);

export class Unit implements ISelectable {
    team: number;
    loc: GridLocation;
    actions: Array<Action<ISelectable>>;

    constructor(team: number){
        this.team = team;
    }

    setLoc(loc: GridLocation){
        this.loc = loc; 
    }

    setActions(actions: Array<Action<ISelectable>>) {
        this.actions = actions;
    }
}