import { ISelectable } from "./core";

export class Unit implements ISelectable {
    team: number;

    // TODO: should these just be locs?
    x: number;
    y: number;
    z: number;
}