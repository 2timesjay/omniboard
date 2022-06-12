import { ISelectable } from "./core";

export enum StatusType {
    CounterReady = 0,
}

class Status {
    parent: ISelectable;
    status_type: StatusType;
    description: string;

    constructor(parent: ISelectable, status_type: StatusType, description: string) {
        this.parent = parent;
        this.status_type = status_type;
        this.description = description;
    }   
}

class CounterReadyStatus extends Status {
    constructor(parent: ISelectable) {
        var description = "Unit has readied a counterattack to respond to a strike.";
        super(parent, StatusType.CounterReady, description);
    }
}