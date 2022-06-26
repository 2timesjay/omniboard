import { AbstractEffect, EffectKernel } from "../model/effect";
import { ILocation } from "../model/space";
import { IState } from "../model/state";
import { DURATION_FRAMES } from "../model/unit";
import { Move } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { Entity } from "./playground_entity";

class PlaygroundMoveKernel implements EffectKernel {
    source: Entity;
    loc: ILocation;

    _prev_loc: ILocation;

    constructor(source: Entity, loc: ILocation) {
        this.source = source;
        this.loc = loc;
    }

    execute(state: IState): IState {
        console.log("Executing Move: ", this.loc);
        this._prev_loc = this.source.loc;
        this.source.setLoc(this.loc);
        return state;
    };

    reverse(state: IState): IState {
        // @ts-ignore
        this.source.setLoc(this._prev_loc);
        return state;
    }
}

export class PlaygroundMoveEffect extends AbstractEffect {
    source: Entity;
    loc: ILocation;

    kernel: EffectKernel;
    description: string;

    constructor(source: Entity, loc: ILocation) {
        super();
        this.source = source;
        this.loc = loc;
        this.kernel = new PlaygroundMoveKernel(source, loc);
        this.description = "Move Entity to new Location";
    }

    execute(state: IState): IState {
        return this.kernel.execute(state);
    }

    animate(state: IState, display_handler: DisplayHandler) {   
        var source = this.source;
        var loc = this.loc;
        // @ts-ignore
        var vector: Vector = state.space.getVector(source.loc, loc);
        console.log("Vector: ", vector)
        var source_display = display_handler.display_map.get(source);
        // @ts-ignore Doesn't know Entity_display is a EntityDisplay
        var animation = new Move(vector.x, vector.y, DURATION_FRAMES, source_display);
        // @ts-ignore Can't even use EntityDisplay as a normal type.
        source_display.interrupt_animation(animation)
    }
}