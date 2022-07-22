import { Entity } from "../../model/entity";
import { GridCoordinate, GridLocation, GridSpace } from "../../model/space";
import { BaseState } from "../../model/state";

export class Piece extends Entity {
    loc: GridLocation;
    original_loc: GridLocation;

    constructor(loc?: GridLocation){
        super(loc);
        this.original_loc = loc;
    }
}

export class SlidingPuzzleState extends BaseState {
    entities: Array<Piece>;
    space: GridSpace;
}