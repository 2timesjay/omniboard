import { ISelectable } from "../../model/core";
import { EffectKernel, AbstractEffect } from "../../model/effect";
import { Glement } from "../../common/entity";
import { GridLocation, Vector } from "../../model/space";
import { ChainableMove } from "../../view/animation";
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

export class GlementPlaceEffect extends AbstractEffect {
    glement: Glement
    loc: GridLocation;
    description: string;

    constructor(glement: Glement, loc: GridLocation) {
        super();
        this.loc = loc;
        this.glement = glement;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        state.add(this.glement, this.loc);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}


export class GlementDeleteEffect extends AbstractEffect {
    glement: Glement;
    description: string;

    constructor(glement: Glement) {
        super();
        this.glement = glement;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        // Move the glement
        state.remove(this.glement);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}

export class GlementMoveEffect extends AbstractEffect {
    glement: Glement
    loc: GridLocation;
    description: string;

    constructor(glement: Glement, loc: GridLocation) {
        super();
        this.loc = loc;
        this.glement = glement;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        // Move the glement
        this.glement.setLoc(this.loc);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}