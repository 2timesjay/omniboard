import { Flinch, Bump, Move } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { Action } from "./action";
import { ISelectable } from "./core";
import { GridLocation, Vector } from "./space";
import { IState, BoardState } from "./state";
import { Status, StatusContainer } from "./status";
import { DURATION_FRAMES, Unit } from "./unit";

export interface EffectKernel {
    execute: (state: IState) => IState;
    reverse: (state: IState) => IState;
}

export interface Effect {
    execute: (state: IState) => IState;
    pre_execute?: Array<Effect>;
    post_execute?: Array<Effect>;
    description?: string;
    animate?: (state: IState, display_handler: DisplayHandler) => void;
};

export class AbstractEffect implements Effect{
    pre_execute: Array<Effect>;
    post_execute: Array<Effect>;
    
    constructor () {
        this.pre_execute = [];
        this.post_execute = [];
    }

    execute(state: IState): IState {
        throw new Error('Method not implemented.');
    }

}

export class DamageKernel implements EffectKernel {
    source: Unit;
    target: Unit;
    damage_amount: number;
    piercing_damage_amount: number;

    _target_hp: Array<number>;

    constructor(source: Unit, target: Unit, damage_amount: number) {
        this.source = source;
        this.target = target;
        this.damage_amount = damage_amount;
        this.piercing_damage_amount = this.source.piercing_strength;
    }

    execute(state: IState): IState {
        // NOTE: Basically, damage normally when layer is large, or pierce. Piercing = 1 is worthless.
        this._target_hp = this.target._hp;
        if (this.piercing_damage_amount <= 0 || this.target.hp >= this.piercing_damage_amount) {
            this.target.damage(this.damage_amount);
            return state;
        } else {
            var piercing_damage_amount = this.piercing_damage_amount;
            while(this.target.hp > 0 && piercing_damage_amount > 0) {
                var layer_hp = this.target.hp;
                this.target.damage(piercing_damage_amount);
                console.log("DAMAGE: ", piercing_damage_amount)
                piercing_damage_amount -= layer_hp;
                console.log("PIERCING_REMAINING: ", piercing_damage_amount)
            }
            return state;
        }
    }

    reverse(state: IState): IState {
        this.target._hp = this._target_hp;
        return state;
    }
}

export class DamageEffect extends AbstractEffect {
    source: Unit;
    target: Unit;

    kernel: EffectKernel;
    description: string;

    constructor(source: Unit, target: Unit, damage_amount?: number) {
        super();
        this.source = source;
        this.target = target;
        damage_amount = damage_amount == null ? source.strength : damage_amount; 
        this.kernel = new DamageKernel(source, target, damage_amount);
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
        var vector: Vector = state.grid.getVector(source.loc, target.loc);
        var x = vector.x;
        var y = vector.y;
        var vector_norm = Math.sqrt(x*x + y*y);
        if (vector_norm > 0) {
            vector.x = x/vector_norm;
            vector.y = y/vector_norm;
        } else {
            vector.x = 0;
            vector.y = 0;
        }
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
export class ExhaustEffect extends AbstractEffect {
    source: Unit;
    action: Action<ISelectable, BoardState>;

    kernel: EffectKernel;
    description: string;

    constructor(
        source: Unit, 
        action: Action<ISelectable, BoardState>
    ) {
        super();
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

export class MoveEffect extends AbstractEffect {
    source: Unit;
    loc: GridLocation;

    kernel: EffectKernel;
    description: string;

    constructor(source: Unit, loc: GridLocation) {
        super();
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
        var vector: Vector = state.grid.getVector(source.loc, loc);
        console.log("Vector: ", vector)
        var source_display = display_handler.display_map.get(source);
        // @ts-ignore Doesn't know unit_display is a UnitDisplay
        var animation = new Move(vector.x, vector.y, DURATION_FRAMES, source_display);
        // @ts-ignore Can't even use UnitDisplay as a normal type.
        source_display.interrupt_animation(animation)
    }
}

class AddStatusKernel implements EffectKernel {
    source: Unit | null;
    target: StatusContainer;
    status: Status;

    _prev_statuses: Set<Status>;

    constructor(source: Unit, target: StatusContainer, status: Status) {
        this.source = source;
        this.target = target;
        this.status = status;
    }

    execute(state: IState): IState {
        // Shallow clone status set.
        this._prev_statuses = new Set(this.target.statuses);
        this.target.statuses.add(this.status);
        return state;
    };

    reverse(state: IState): IState {
        this.target.statuses = this._prev_statuses
        return state;
    }
}

export enum AlterType {
    Add = 0,
    Remove = 1,
}

export class AlterStatusEffect extends AbstractEffect {
    source: Unit | null;
    target: StatusContainer;
    status: Status;

    kernel: EffectKernel;
    description: string;

    constructor(source: Unit, target: StatusContainer, status: Status, alter_type: AlterType) {
        super();
        this.source = source;
        this.target = target;
        this.status = status;
        if (alter_type == AlterType.Add) {
            this.kernel = new AddStatusKernel(source, target, status);
        } else if (alter_type == AlterType.Remove) {
            throw new Error('Method not implemented.');
        }
        this.description = "alter statuses on a target";
    }

    execute(state: IState): IState {
        return this.kernel.execute(state);
    }

    // TODO: Add 'flash' animation - blink to indicate status.
    // animate(state: IState, display_handler: DisplayHandler) {   
    //     // Add Flash
    // }
}

class AlterTerrainKernel implements EffectKernel {
    source: Unit | null;
    target: GridLocation;

    _prev_traversable: boolean;

    constructor(source: Unit, target: GridLocation) {
        this.source = source;
        this.target = target;
    }

    execute(state: IState): IState {
        // Invert traversability
        this._prev_traversable = this.target.traversable;
        this.target.traversable = !this.target.traversable;
        return state;
    };

    reverse(state: IState): IState {
        this.target.traversable = this._prev_traversable;
        return state;
    }
}

export class AlterTerrainEffect extends AbstractEffect {
    source: Unit | null;
    target: GridLocation;

    kernel: EffectKernel;
    description: string;

    constructor(source: Unit, target: GridLocation) {
        super();
        this.source = source;
        this.target = target;
        this.kernel = new AlterTerrainKernel(source, target);

        this.description = "Invert terrain traversability at a location";
    }

    execute(state: IState): IState {
        return this.kernel.execute(state);
    }

    // TODO: Add terrain shake animation
    // animate(state: IState, display_handler: DisplayHandler) {   
    //     // Add Flash
    // }
}



class ShoveKernel implements EffectKernel {
    source: Unit;
    target: Unit;

    _prev_loc: GridLocation;

    constructor(source: Unit, target: Unit) {
        this.source = source;
        this.target = target;
    }

    execute(state: BoardState): BoardState {
        var source = this.source;
        var target = this.target;
        this._prev_loc = target.loc;
        var vector: Vector = state.grid.getVector(source.loc, target.loc);
        var destination = state.grid.getSimpleRelativeCoordinate(target.loc, vector);
        // TODO: Also check if occupied. Can overlap units now.
        if (destination != null && destination.traversable) {
            target.setLoc(destination);
        }
        // TODO: Else, damage somehow.
        return state;
    };

    reverse(state: BoardState): BoardState {
        this.target.setLoc(this._prev_loc);
        return state;
    }
}

export class ShoveEffect extends AbstractEffect {
    source: Unit;
    target: Unit;

    kernel: ShoveKernel;
    description: string;

    constructor(source: Unit, target: Unit) {
        super();
        this.source = source;
        this.target = target;
        this.kernel = new ShoveKernel(source, target);

        this.description = "Shove Unit";
    }

    execute(state: BoardState): BoardState {
        return this.kernel.execute(state);
    }

    animate(state: BoardState, display_handler: DisplayHandler) {   
        var source = this.source;
        var target = this.target;
        var vector: Vector = state.grid.getVector(source.loc, target.loc);
        console.log("Vector: ", vector)
        var target_display = display_handler.display_map.get(target);
        // @ts-ignore Doesn't know unit_display is a UnitDisplay
        var animation = new Move(vector.x, vector.y, DURATION_FRAMES, target_display);
        // @ts-ignore Can't even use UnitDisplay as a normal type.
        target_display.interrupt_animation(animation);
    }
}