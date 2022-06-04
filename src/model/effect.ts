import { Flinch, Bump } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { Point } from "./space";
import { IState, EffectKernel, BoardState } from "./state";
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

    animate(state: IState, display_handler: DisplayHandler) {   
        var source = this.source;
        var target = this.target;
        // @ts-ignore
        var vector: Point = state.grid.getVector(source.loc, target.loc);
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

export type Observer = {
    description: string;
    effect: Effect;
};