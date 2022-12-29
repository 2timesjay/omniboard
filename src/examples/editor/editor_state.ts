import { Element, Entity } from "../../common/entity";
import { BaseState } from "../../model/state";
import { VolumeSpace } from "../../common/space";
import { GridLocation } from "../../model/space";

export class EditorState extends BaseState {
    elements: Array<Element>;
    space: VolumeSpace;

    constructor() {
        super();
    }

    add(element: Element, loc: GridLocation) {
        element.setLoc(loc);
        this.elements.push(element);
    }

    remove(element: Element) {
        this.elements = this.elements.filter(e => e != element);
    }
}