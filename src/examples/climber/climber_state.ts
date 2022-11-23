import { Entity } from "../../model/entity";
import { GridCoordinate, GridLocation, GridSpace } from "../../model/space";
import { BaseState } from "../../model/state";

export class Box extends Entity {
    constructor(loc: GridLocation) {
        super(loc);
    }
}

export class Player extends Entity {
    constructor(loc: GridLocation) {
        super(loc);
    }
}

export class ClimberState extends BaseState {
    entities: Array<Entity>;
    space: GridSpace;
}