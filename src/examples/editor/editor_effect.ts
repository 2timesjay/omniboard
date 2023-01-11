import { ISelectable } from "../../model/core";
import { EffectKernel, AbstractEffect } from "../../model/effect";
import { EntityFactory, Entity } from "../../common/entity";
import { GridLocation, Vector } from "../../model/space";
import { ILocatable } from "../../view/display";
import { DisplayHandler } from "../../view/display_handler";
import { EditorState } from "./editor_state";

export class ToggleLocationEffect extends AbstractEffect {
    loc: GridLocation;
    description: string;

    constructor(loc: GridLocation) {
        super();
        this.loc = loc;
        this.description = "Toggle terrain at a location.";
    }

    execute(state: EditorState): EditorState {
        state.space.toggle(this.loc);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {   
    }

    play_sound() {
    }
}

export class EntityPlaceEffect extends AbstractEffect {
    entity_factory: EntityFactory;
    loc: GridLocation;
    description: string;

    constructor(entity_factory: EntityFactory, loc: GridLocation) {
        super();
        this.loc = loc;
        this.entity_factory = entity_factory;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        // TODO: Redundant loc here.
        var entity = this.entity_factory.create_entity(this.loc);
        state.add(entity, this.loc);
        console.log("EntityPlaceEffect Executed")
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}


export class EntityDeleteEffect extends AbstractEffect {
    entity: Entity;
    description: string;

    constructor(entity: Entity) {
        super();
        this.entity = entity;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        // Move the entity
        state.remove(this.entity);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}

export class EntityMoveEffect extends AbstractEffect {
    entity: Entity
    loc: GridLocation;
    description: string;

    constructor(entity: Entity, loc: GridLocation) {
        super();
        this.loc = loc;
        this.entity = entity;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        // Move the entity
        this.entity.setLoc(this.loc);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}