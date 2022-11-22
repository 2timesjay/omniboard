import { ISelectable } from "./core";
import { CounterAttackObserver, Observer } from "./observer";
import { Unit } from "../examples/tactics/unit";

export interface StatusContainer {
    statuses: Set<Status>;
}

// https://stackoverflow.com/questions/14425568/interface-type-check-with-typescript
export function instanceOfStatusContainer(object: any): object is StatusContainer {
    return "statuses" in object;
}

export enum StatusType {
    CounterReady = 0,
}

export class Status {
    parent: StatusContainer;
    status_type: StatusType;
    description: string;
    observer: Observer;
    duration: number

    constructor(parent: StatusContainer, status_type: StatusType, description: string) {
        this.parent = parent;
        this.status_type = status_type;
        this.description = description;
        this.duration = 1;
    }   

    update() {
        this.duration -= 1;
        if (this.duration <= 0) this.clear();
    }    

    clear() {
        this.observer.disable();
        delete this.observer;
        this.parent.statuses.delete(this);
    }
}

export class CounterReadyStatus extends Status {
    constructor(parent: Unit) {
        var description = "Unit has readied a counterattack to respond to a strike.";
        super(parent, StatusType.CounterReady, description);
        var self = this;
        this.observer = new CounterAttackObserver(parent, self);
    }
}