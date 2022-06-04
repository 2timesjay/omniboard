import { Flinch, Bump, Move } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { Action } from "./action";
import { ISelectable } from "./core";
import { GridLocation, Point } from "./space";
import { IState, BoardState } from "./state";
import { DURATION_FRAMES, Unit } from "./unit";

export interface EffectKernel {
    execute: (state: IState) => IState;
    reverse: (state: IState) => IState;
}

export class DamageKernel implements EffectKernel {
    source: Unit;
    target: Unit;

    _target_hp: Array<number>;

    constructor(source: Unit, target: Unit) {
        this.source = source;
        this.target = target;
    }

    execute(state: IState): IState {
        this._target_hp = this.target._hp;
        this.target.damage(this.source.strength);
        return state;
    }

    reverse(state: IState): IState {
        this.target._hp = this._target_hp;
        return state;
    }
}

export interface Effect {
    execute: (state: IState) => IState;
    description?: string;
    animate?: (state: IState, display_handler: DisplayHandler) => void;
};

export class DamageEffect implements Effect {
    source: Unit;
    target: Unit;

    kernel: EffectKernel;
    description: string;

    constructor(source: Unit, target: Unit) {
        this.source = source;
        this.target = target;
        this.kernel = new DamageKernel(source, target);
        this.description = "attack target";
    }

    execute(state: IState): IState {
        return this.kernel.execute(state);
    }

    // TODO: Support different animations (non-directional, no bump for Chain?).
    animate(state: IState, display_handler: DisplayHandler) {   
        var source = this.source;
        var target = this.target;
        // @ts-ignore
        var vector: Point = state.grid.getVector(source.loc, target.loc);
        var x = vector.x;
        var y = vector.y;
        var vector_norm = Math.sqrt(x*x + y*y);
        vector.x = x/vector_norm;
        vector.y = y/vector_norm;
        var target_display = display_handler.display_map.get(target);
        var source_display = display_handler.display_map.get(source);
        // TODO: Relate to graphical size.
        var target_animation = new Flinch(vector.x*20, vector.y*20, DURATION_FRAMES);
        var source_animation = new Bump(vector.x*.4, vector.y*.4, DURATION_FRAMES);
        // @ts-ignore
        target_display.interrupt_animation(target_animation);
        // @ts-ignore
        source_display.interrupt_animation(source_animation);
    }
}

export class ExhaustKernel implements EffectKernel {
    source: Unit;
    action: Action<ISelectable, BoardState>;

    constructor(source: Unit, action: Action<ISelectable, BoardState>) {
        this.source = source;
        this.action = action;
    }

    execute(state: IState): IState {
        console.log("Exhausting AP: ", this.action);
        // @ts-ignore
        this.source.exhaust_action(this.action);
        return state;
    };

    reverse(state: IState): IState {
        // @ts-ignore
        this.source.unexhaust_action(this.action);
        return state;
    }
}

// TODO: Decouple AP exhaustion and Action Disable
export class ExhaustEffect implements Effect {
    source: Unit;
    action: Action<ISelectable, BoardState>;

    kernel: EffectKernel;
    description: string;

    constructor(
        source: Unit, 
        action: Action<ISelectable, BoardState>
    ) {
        this.source = source;
        this.action = action;
        this.kernel = new ExhaustKernel(source, action);
        this.description = "exhaust action";
    }

    execute(state: IState): IState {
        return this.kernel.execute(state);
    }
}

class MoveKernel implements EffectKernel {
    source: Unit;
    loc: GridLocation;

    _prev_loc: GridLocation;

    constructor(source: Unit, loc: GridLocation) {
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

export class MoveEffect implements Effect {
    source: Unit;
    loc: GridLocation;

    kernel: EffectKernel;
    description: string;

    constructor(source: Unit, loc: GridLocation) {
        this.source = source;
        this.loc = loc;
        this.kernel = new MoveKernel(source, loc);
        this.description = "move unit";
    }

    execute(state: IState): IState {
        return this.kernel.execute(state);
    }

    animate(state: IState, display_handler: DisplayHandler) {   
        var source = this.source;
        var loc = this.loc;
        // @ts-ignore
        var vector: Point = state.grid.getVector(source.loc, loc);
        console.log("Vector: ", vector)
        var source_display = display_handler.display_map.get(source);
        // @ts-ignore Doesn't know unit_display is a UnitDisplay
        var animation = new Move(vector.x, vector.y, DURATION_FRAMES, source_display);
        // @ts-ignore Can't even use UnitDisplay as a normal type.
        source_display.interrupt_animation(animation)
    }
}

export type Observer = {
    description: string;
    effect: Effect;
};