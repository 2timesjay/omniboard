import { Glement, Entity, GlementFactory, EntityFactory, EntityType } from "../../common/entity";
import { BaseState } from "../../model/state";
import { VolumeSpace } from "../../common/space";
import { GridLocation } from "../../model/space";
import { ISelectable, ISerializable } from "../../model/core";

const UNIT_TYPE = new EntityType("UNIT");
const BOX_TYPE = new EntityType("BOX");


export class EditorState extends BaseState implements ISerializable {
    glements: Array<Glement>;
    space: VolumeSpace;
    extras: Array<ISelectable>;

    constructor() {
        super();
        var unit_factory = new EntityFactory(Entity, UNIT_TYPE);
        var box_factory = new EntityFactory(Entity, BOX_TYPE);
        this.extras = [unit_factory, box_factory];
    }

    add(glement: Glement, loc: GridLocation) {
        glement.setLoc(loc);
        this.glements.push(glement);
        console.log("Added Glement: " + glement.toString());
    }

    remove(glement: Glement) {
        this.glements = this.glements.filter(e => e != glement);
    }

    get_extras(): Array<ISelectable> {
        return this.extras;
    }

    get_entities(): Array<Entity> {
        return this.glements.filter(e => e instanceof Entity) as Array<Entity>;
    }

    serialize(): string {
        return JSON.stringify({
            "class": "EditorState",
            "space": this.space.serialize(),
            "glements": this.glements.map((glement) => glement.serialize()),
        });
    }

    static deserialize(serialized: string): EditorState {
        var obj = JSON.parse(serialized);
        var state = new EditorState();
        state.space = VolumeSpace.deserialize(obj.space);
        // @ts-ignore Need to specify that EditorState contains entities instead of Glements.
        state.glements = obj.glements.map((glement) => Entity.deserialize(glement));
        return state;
    }
}