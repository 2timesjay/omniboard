import { Entity } from "../../common/entity";
import { GridCoordinate, GridLocation, GridSpace } from "../../model/space";
import { BaseState } from "../../model/state";
import { VolumeSpace } from "../../playground/playground_space";

export class Box extends Entity {
    indicator: string = "BOX";
    loc: GridLocation;

    constructor(loc: GridLocation) {
        super(loc);
    }
}

export class Player extends Entity {
    indicator: string = "PLAYER";
    loc: GridLocation;

    constructor(loc: GridLocation) {
        super(loc);
    }
}

export class ClimberState extends BaseState {
    entities: Array<Entity>;
    space: VolumeSpace;
}