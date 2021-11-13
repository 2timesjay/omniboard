import {ISelectable} from "../model/core";
import {IState} from "../model/state";

export class SelectableNumber implements ISelectable {
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

export class NumberState implements IState {
    value: number;
    
    constructor(value: number){
        this.value = value;
    }

    // Should this mutate or return new State?
    add(add_value: number) {
        this.value = this.value + add_value;
    }
}