import { Glement, Entity } from "../../common/entity";
import { BaseState } from "../../model/state";
import { VolumeSpace } from "../../common/space";
import { GridLocation } from "../../model/space";

export class EditorState extends BaseState {
    glements: Array<Glement>;
    space: VolumeSpace;

    constructor() {
        super();
    }

    add(glement: Glement, loc: GridLocation) {
        glement.setLoc(loc);
        this.glements.push(glement);
    }

    remove(glement: Glement) {
        this.glements = this.glements.filter(e => e != glement);
    }
}