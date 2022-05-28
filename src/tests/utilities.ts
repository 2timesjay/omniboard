import {ISelectable} from "../model/core";
import {IState} from "../model/state";

export class SelectableNumber implements ISelectable {
    value: number;

    constructor(value: number) {
        this.value = value;
    }

    add(other: SelectableNumber) {
        this.value += other.value;
    }

    equals(other: SelectableNumber): boolean {
        return this.value == other.value;
    }
}

// TODO: Try immutable version
export class NumberState implements IState {
    num: SelectableNumber;
    
    constructor(value: number){
        this.num = new SelectableNumber(value);
    }

    get_selectables(): Array<ISelectable> {
        return [this.num]
    }

    add(other: SelectableNumber) {
        this.num.add(other);
    }
}