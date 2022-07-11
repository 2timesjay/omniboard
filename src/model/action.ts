import { BoardAction, TacticsInputs } from "../tactics/tactics_controller";
import { Flinch, Bump } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { ISelectable, OptionFn, Stack } from "./core";
import { AlterStatusEffect, AlterTerrainEffect, AlterType, DamageEffect, Effect, ExhaustEffect, MoveEffect, ShoveEffect } from "./effect";
import { Entity } from "./entity";
import { IInputAcquirer, InputResponse, InputOptions, SimpleInputAcquirer, Confirmation, AutoInputAcquirer, SequentialInputAcquirer, ChainedInputAcquirer } from "./input";
import { Inputs } from "./phase";
import { GridLocation, Vector } from "./space";
import { IState, BoardState} from "./state";
import { CounterReadyStatus } from "./status";
import { Unit, DURATION_FRAMES } from "./unit";


// Actions constants
export const MOVE = "Move";
export const ATTACK = "Attack";
export const CHAIN = "Chain Lightning";
export const END = "End Turn";
export const CHANNELED_ATTACK = "Channeled Attack";
export const COUNTER = "Counter";
export const TERRAIN = "Alter Terrain";
export const SHOVE = "Shove";

export type DigestFn<T extends ISelectable> = (selection: InputResponse<T>) => Array<Effect>;

// TODO: U extends IState not _actually_ used. Remove it.
// T is the type of input expected
export class Action<T extends ISelectable, U extends IState> implements ISelectable {
    // Class managing combination of input acquisition and effect generation.
    text: string;
    index: number; // TODO: index should not be part of base Action; only used for UI.
    acquirer: IInputAcquirer<T>;
    enabled: boolean;
    source: Unit;
   
    constructor(text: string, index: number) {
        this.text = text;
        this.index = index;
        this.enabled = true;   
    }

    peek_action_input(): InputResponse<T> {
        return this.acquirer.current_input;
    }

    * get_action_input(
        base: InputResponse<T>
    ): Generator<InputOptions<T>, InputResponse<T>, InputResponse<T>> {
        // @ts-ignore expects 'Stack<T> & T', but the containing gen sends 'InputResponse<T>'
        var input = yield *this.acquirer.input_option_generator(base);
        // TODO: More elegant propagation? Probably solved by separating digest.
        return input;
    }

    digest_fn(selection: InputResponse<T>): Array<Effect> {
        throw new Error('Method not implemented.');
    }

    get_root(inputs: Inputs): InputResponse<T> {
        throw new Error('Method not implemented.');
    }

    has_options(inputs: Inputs): boolean {
        var options = this.acquirer.get_options(this.get_root(inputs));
        if (options instanceof Array) {
            return options.length > 0;
        } else { // PreviewMap; can't check with instanceof because it is a type.
            return options.size > 0;
        }
    }
                
};

// T is the type of input expected
export class SingleTargetAction<T extends ISelectable> extends Action<T, BoardState> {
    
    effect_constructor: new (source: Unit, target: T) => Effect;
    source: Unit;
    state: BoardState;

    constructor(
        text: string, 
        index: number,
        source: Unit,
        state: BoardState, 
        option_fn: OptionFn<T>, 
        effect_constructor: new (source: Unit, target: T) => Effect,
    ) {
        super(text, index);
        this.source = source;
        this.state = state;
        this.effect_constructor = effect_constructor;
        var acquirer = this._build_acquirer(option_fn);
        this.acquirer = acquirer;
    }
    
    _build_acquirer(option_fn: OptionFn<T>): SimpleInputAcquirer<T> {
        return new SimpleInputAcquirer<T>(
            option_fn
        );
    }

    _build_effect(target: T) : Effect {
        return new this.effect_constructor(this.source, target);
    }

    digest_fn(selection: T): Array<Effect> {
        // TODO: InputResponse wrap/unwrap
        var target = selection;
        var effects = [
            this._build_effect(target),
            new ExhaustEffect(this.source, this)
        ];
        return effects;
    }

    get_root(tactics_inputs: TacticsInputs): T {
        return null
    }       
};

/**
 * Move
 */
export class MoveAction extends Action<GridLocation, BoardState> {

    constructor(source: Unit, state: BoardState) {
        super(MOVE, 1);
        this.source = source;

        var increment_fn = (stack: Stack<GridLocation>): Array<GridLocation> => {
            var units = state.units;
            var grid_space = state.grid;
            var neighborhood = grid_space.getGridNeighborhood(stack.value);
            var occupied = new Set(units.map((u) => u.loc));
            var options = neighborhood
                .filter(l => !occupied.has(l))
                .filter(l => l.traversable);
            return options;
        };
        var termination_fn = (stack: Stack<GridLocation>): boolean => {
            return stack.depth >= this.source.speed + 1; // + 1 because stack starts at root.
        }
        var acquirer = new SequentialInputAcquirer<GridLocation>(
            increment_fn,
            termination_fn,
        )
        this.acquirer = acquirer;
    }

    digest_fn(selection: Stack<GridLocation>): Array<Effect> {
        var locs_arr = selection.to_array();
        // TODO: don't include initial "current" loc as part of locs.
        locs_arr.shift();
        var effects: Array<Effect> = locs_arr.map((loc) => new MoveEffect(this.source, loc));
        effects.push(new ExhaustEffect(this.source, this));
        return effects;
    }

    get_root(tactics_inputs: TacticsInputs): Stack<GridLocation> {
        return new Stack(tactics_inputs.unit.loc);
    }
}

// T is the type of input expected
export class ShoveAction extends SingleTargetAction<Unit> {
    constructor(source: Unit, state: BoardState) {
        // TODO: Handle case of shove onto overlap. Currently same as attack.
        var option_fn = (): Array<Unit> => {
            var units = state.units
                .filter((u) => (u.team != this.source.team))
                .filter((u) => (u.is_alive()));
            var attack_range = this.source.attack_range;
            var attacker_loc = this.source.loc
            var options = units.filter(
                (u) => state.grid.getDistance(attacker_loc, u.loc) <= attack_range
            )
            return options;
        };
        super(SHOVE, 5, source, state, option_fn, ShoveEffect);
        var acquirer = this._build_acquirer(option_fn);
        this.acquirer = acquirer;
    }  
};

/**
 * Attack
 */
export class AttackAction extends Action<Unit, BoardState> {

    constructor(source: Unit, state: BoardState) {
        super(ATTACK, 2);
        this.source = source;

        var option_fn = (): Array<Unit> => {
            var units = state.units
                .filter((u) => (u.team != this.source.team))
                .filter((u) => (u.is_alive()));
            var attack_range = this.source.attack_range;
            var attacker_loc = this.source.loc
            var options = units.filter(
                (u) => state.grid.getDistance(attacker_loc, u.loc) <= attack_range
            )
            return options;
        };
        var acquirer = new SimpleInputAcquirer<Unit>(
            option_fn
        );
        this.acquirer = acquirer;
    }

    digest_fn(selection: Unit): Array<Effect> {
        // TODO: InputResponse wrap/unwrap
        var target = selection;
        var effects = [
            new DamageEffect(this.source, target),
            new ExhaustEffect(this.source, this)
        ];
        return effects;
    }

    get_root(tactics_inputs: TacticsInputs): Unit {
        return tactics_inputs.unit;
    }
}


// TODO: Somehow allowed to click self. Worse, this autoconfirms (input gen bug)
// TODO: Doesn't damage self.
export class ChainLightningAction extends Action<Unit, BoardState> {

    constructor(source: Unit, state: BoardState) {
        super(CHAIN, 3);
        this.source = source;

        var increment_fn = (stack: Stack<Unit>): Array<Unit> => {
            var grid = state.grid;
            var units = state.units;
            var origin_loc = stack.value.loc;
            // NOTE: Can target own team.
            var options = units
                .filter((u) => {
                    var dist = grid.getDistance(origin_loc, u.loc);
                    return 0 < dist && dist <= 3;
                })
                .filter((u) => (u.is_alive()));
            return options;
        };
        var termination_fn = (stack: Stack<Unit>): boolean => {
            return stack.depth >= 4; // + 1 because stack starts at root.
        }
        var acquirer = new SequentialInputAcquirer<Unit>(
            increment_fn,
            termination_fn,
        )
        this.acquirer = acquirer;
    }

    digest_fn(selection: Stack<Unit>): Array<Effect> {
        var damage_amount = 1;

        // TODO: InputResponse wrap/unwrap
        var target_arr = selection.to_array();
        target_arr.shift();
        var effects: Array<Effect> = target_arr.map(
            target => new DamageEffect(this.source, target, damage_amount)
        );
        effects.push(
            new ExhaustEffect(this.source, this)
        );
        return effects;
    }    

    get_root(tactics_inputs: TacticsInputs): Stack<Unit> {
        return new Stack(tactics_inputs.unit);
    }
}

export class ChanneledAttackAction extends Action<Unit, BoardState> {

    constructor(source: Unit, state: BoardState) {
        super(CHANNELED_ATTACK, 3);
        this.source = source;

        var option_fn_list = [
            (stack: Stack<Unit>) => { // Proxy options
                var source = stack.value; 
                return state.units.filter((u) => (u.team == source.team));
            }, 
            (stack: Stack<Unit>) => { // Unit options
                var proxy = stack.value;
                var units = state.units.filter((u) => (u.team != source.team));
                var attack_range = proxy.attack_range;
                var attacker_loc = proxy.loc;
                // TODO: Replace with more sophisticated "valid target" fn.
                return units.filter(
                    (u) => state.grid.getDistance(attacker_loc, u.loc) <= attack_range
                );
            }
        ];
        this.acquirer = new ChainedInputAcquirer<Unit>(option_fn_list);
    }

    digest_fn(selection: Stack<Unit>): Array<Effect> {
        // TODO: InputResponse wrap/unwrap
        var units_arr = selection.to_array(); // Length 3 array
        // TODO: Less hacky way to prevent bug from double-clicking source.
        if (units_arr.length != 3) {
            return [];
        }
        // TODO: Don't populate first element of array with source
        var source = this.source;
        var proxy = units_arr[1];
        var target = units_arr[2];
        var effects = [
            new DamageEffect(proxy, target), 
            new ExhaustEffect(this.source, this),
        ];
        return effects;
    }
    
    get_root(tactics_inputs: TacticsInputs): Stack<Unit> {
        return new Stack(tactics_inputs.unit);
    }
}

/**
 * End Turn
 */

export class EndTurnAction extends Action<Confirmation, BoardState> {
    confirmation: Confirmation;

    constructor(confirmation: Confirmation, source: Unit, state: BoardState) {
        super(END, 4);
        this.confirmation = confirmation;
        this.source = source;
        var acquirer = new AutoInputAcquirer<Confirmation>(confirmation);
        this.acquirer = acquirer;
    }

    digest_fn(selection: Confirmation): Array<Effect> {
        // TODO: InputResponse wrap/unwrap
        var effects = this.source.actions.map((a) => new ExhaustEffect(this.source, a))
        return effects;
    }

    get_root(tactics_inputs: TacticsInputs): Confirmation {
        return this.confirmation;
    }
}

/**
 * Add Status
 */

export class CounterReadyAction extends Action<Confirmation, BoardState> {
    confirmation: Confirmation;

    constructor(confirmation: Confirmation, source: Unit, state: BoardState) {
        super(COUNTER, 3);
        this.confirmation = confirmation;
        this.source = source;
        var acquirer = new AutoInputAcquirer<Confirmation>(confirmation);
        this.acquirer = acquirer;
    }

    digest_fn(selection: Confirmation): Array<Effect> {
        // TODO: InputResponse wrap/unwrap
        var status = new CounterReadyStatus(this.source);
        var effects = [
            new AlterStatusEffect(this.source, this.source, status, AlterType.Add),
            new ExhaustEffect(this.source, this),
        ];
        return effects;
    }

    get_root(tactics_inputs: TacticsInputs): Confirmation {
        return this.confirmation;
    }
}

/**
 * Alter Terrain
 */
export class AlterTerrainAction extends Action<GridLocation, BoardState> {

    constructor(source: Unit, state: BoardState) {
        super(TERRAIN, 5);
        this.source = source;

        var option_fn = (): Array<GridLocation> => {
            // All locations within distance 4 if not occupied.
            var range = 4;
            var grid = state.grid;
            var units = state.units;
            var occupied = new Set(units.map((u) => u.loc));
            var options = grid.to_array()
                .filter(l => grid.getDistance(l, source.loc) <= range)
                .filter(l => !occupied.has(l));
            return options;
        };
        var acquirer = new SimpleInputAcquirer<GridLocation>(
            option_fn
        );
        this.acquirer = acquirer;
    }

    digest_fn(selection: GridLocation): Array<Effect> {
        // TODO: InputResponse wrap/unwrap
        var target = selection;
        var effects = [
            new AlterTerrainEffect(this.source, target),
            new ExhaustEffect(this.source, this),
        ];
        return effects;
    }

    // TODO: Tactics_input overlaps with source almost always. Fix Redundancy.
    get_root(tactics_inputs: TacticsInputs): GridLocation {
        return tactics_inputs.unit.loc;
    }
}