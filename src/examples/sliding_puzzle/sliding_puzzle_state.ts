import { Entity } from "../../model/entity";
import { GridSpace } from "../../model/space";
import { BaseState } from "../../model/state";

export class Piece extends Entity {

}

export class SlidingPuzzleState extends BaseState {
    entities: Array<Piece>;
    space: GridSpace;
}