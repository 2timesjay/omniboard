import { Entity } from "../../model/entity";
import { GridLocation, GridSpace } from "../../model/space";
import { BaseState } from "../../model/state";

export class Piece extends Entity {
    loc: GridLocation;
}

export class SlidingPuzzleState extends BaseState {
    entities: Array<Piece>;
    space: GridSpace;
}