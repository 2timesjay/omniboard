import { Glement, Entity, GlementFactory } from "../../common/entity";
import { BaseState } from "../../model/state";
import { VolumeSpace } from "../../common/space";
import { GridLocation } from "../../model/space";
import { ISelectable } from "../../model/core";

export class EditorState extends BaseState {
    glements: Array<Glement>;
    space: VolumeSpace;
    extras: Array<ISelectable>;

    constructor() {
        super();
        var factory = new GlementFactory(Entity);
        this.extras = [factory];
    }

    add(glement: Glement, loc: GridLocation) {
        glement.setLoc(loc);
        this.glements.push(glement);
    }

    remove(glement: Glement) {
        this.glements = this.glements.filter(e => e != glement);
    }

    get_extras(): Array<ISelectable> {
        return this.extras;
    }
}