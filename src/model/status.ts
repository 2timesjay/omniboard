import { ISelectable } from "./core";

export enum StatusType {
    Frozen = 0;
}
class Status {
    parent: ISelectable;
    status_type: StatusType;

    constructor(parent: ISelectable, status_type: StatusType) {
        this.parent = parent;
        this.status_type = status_type;
    }   
}