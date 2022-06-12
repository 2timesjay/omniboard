import { ISelectable } from "./core";
import { CounterAttackObserver, Observer } from "./observer";
import { Unit } from "./unit";

export interface StatusContainer {
    statuses: Set<Status>;
}

export enum StatusType {
    CounterReady = 0,
}

export class Status {
    parent: StatusContainer;
    status_type: StatusType;
    description: string;
    observer: Observer;

    constructor(parent: StatusContainer, status_type: StatusType, description: string) {
        this.parent = parent;
        this.status_type = status_type;
        this.description = description;
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
        this.observer = new CounterAttackObserver(parent);
    }
}