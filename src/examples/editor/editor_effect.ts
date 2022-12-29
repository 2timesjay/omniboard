import { ISelectable } from "../../model/core";
import { EffectKernel, AbstractEffect } from "../../model/effect";
import { Element } from "../../common/entity";
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

export class ElementPlaceEffect extends AbstractEffect {
    element: Element
    loc: GridLocation;
    description: string;

    constructor(element: Element, loc: GridLocation) {
        super();
        this.loc = loc;
        this.element = element;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        state.add(this.element, this.loc);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}


export class ElementDeleteEffect extends AbstractEffect {
    element: Element;
    description: string;

    constructor(element: Element) {
        super();
        this.element = element;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        // Move the element
        state.remove(this.element);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}

export class ElementMoveEffect extends AbstractEffect {
    element: Element
    loc: GridLocation;
    description: string;

    constructor(element: Element, loc: GridLocation) {
        super();
        this.loc = loc;
        this.element = element;
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        // Move the element
        this.element.setLoc(this.loc);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {
    }

    play_sound() {
    }
}