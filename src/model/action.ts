import { Flinch, Bump } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { ISelectable, Stack } from "./core";
import { DamageEffect, Effect, ExhaustEffect, MoveEffect } from "./effect";
import { IInputAcquirer, InputSelection, InputOptions, SimpleInputAcquirer, Confirmation, AutoInputAcquirer, SequentialInputAcquirer } from "./input";
import { GridLocation, Point } from "./space";
import { IState, BoardState} from "./state";
import { Unit, DURATION_FRAMES } from "./unit";


// Actions constants
export const MOVE = "Move";
export const ATTACK = "Attack";
export const CHAIN = "Chain Lightning";
export const END = "End Turn";
export const CHANNELED_ATTACK = "Channeled Attack";

export type DigestFn<T extends ISelectable> = (selection: InputSelection<T>) => Array<Effect>;

// T is the type of input expected
export class Action<T extends ISelectable, U extends IState> implements ISelectable {
    // Class managing combination of input acquisition and effect generation.
    text: string;
    index: number; // TODO: index should not be part of base Action; only used for UI.
    acquirer: IInputAcquirer<T>;
    enabled: boolean;
   
    constructor(text: string, index: number) {
        this.text = text;
        this.index = index;
        this.enabled = true;   
    }

    peek_action_input(): InputSelection<T> {
        return this.acquirer.current_input;
    }

    * get_action_input(
        base: InputSelection<T>
    ): Generator<InputOptions<T>, InputSelection<T>, InputSelection<T>> {
        // @ts-ignore expects 'Stack<T> & T', but the containing gen sends 'InputSelection<T>'
        var input = yield *this.acquirer.input_option_generator(base);
        // TODO: More elegant propagation? Probably solved by separating digest.
        return input;
    }

    digest_fn(selection: InputSelection<T>): Array<Effect> {
        throw new Error('Method not implemented.');
    }
};

/**
 * Move
 */
export class MoveAction extends Action<GridLocation, BoardState> {
    source: Unit;

    constructor(source: Unit, state: BoardState) {
        super(MOVE, 1);
        this.source = source;

        var increment_fn = (stack: Stack<GridLocation>): Array<GridLocation> => {
            var units = state.units;
            var grid_space = state.grid;
            var neighborhood = grid_space.getGridNeighborhood(stack.value);
            var occupied = new Set(units.map((u) => u.loc));
            var options = neighborhood.filter((l) => !occupied.has(l))
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
}

/**
 * Attack
 */
export class AttackAction extends Action<Unit, BoardState> {
    source: Unit;

    constructor(source: Unit, state: BoardState) {
        super(ATTACK, 2);
        this.source = source;

        var option_fn = (): Array<Unit> => {
            // TODO: Somehow allowed to click self. Worse, this autoconfirms (input gen bug)
            var units = state.units.filter((u) => (u.team != this.source.team));
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
        // TODO: InputSelection wrap/unwrap
        var target = selection;
        var effects = [
            new DamageEffect(this.source, target),
            new ExhaustEffect(this.source, this)
        ];
        return effects;
    }
}


export class ChainLightningAction extends Action<Unit, BoardState> {
    source: Unit;

    constructor(source: Unit, state: BoardState) {
        super(CHAIN, 3);
        this.source = source;

        var increment_fn = (stack: Stack<Unit>): Array<Unit> => {
            var grid = state.grid;
            var units = state.units;
            var origin_loc = stack.value.loc;
            var options = units.filter((u) => {
                var dist = grid.getDistance(origin_loc, u.loc);
                return 0 < dist && dist <= 3;
            });
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
        // TODO: InputSelection wrap/unwrap
        var target_arr = selection.to_array();
        target_arr.shift();
        var effects: Array<Effect> = target_arr.map((target) => new DamageEffect(this.source, target));
        effects.push(
            new ExhaustEffect(this.source, this)
        );
        return effects;
    }
}

export class ChanneledAttackAction extends Action<Unit, BoardState> {
    source: Unit;

    constructor(source: Unit, state: BoardState) {
        super(CHANNELED_ATTACK, 3);
        this.source = source;

        // TODO: Create acquirer as fixed sequences of SimpleInputAcquirers
        var increment_fn = (stack: Stack<Unit>): Array<Unit> => {
            switch (stack.depth) {
                case 1: // choose proxy
                    var proxy_options = state.units.filter((u) => (u.team == source.team));
                    return proxy_options;
                case 2: // proxy already chosen; choose target
                    var proxy = stack.value;
                    var units = state.units.filter((u) => (u.team != source.team));
                    var attack_range = proxy.attack_range;
                    var attacker_loc = proxy.loc;
                    var options = units.filter(
                        (u) => state.grid.getDistance(attacker_loc, u.loc) <= attack_range
                    );
                    return options;
                default: // should never happen
                    return [];
            }
        };
        var termination_fn = (stack: Stack<Unit>): boolean => {
            return stack.depth == 3; // + 1 because stack starts at root.
        }
        var acquirer = new SequentialInputAcquirer<Unit>(
            increment_fn, termination_fn
        )
        this.acquirer = acquirer;
    }

    digest_fn(selection: Stack<Unit>): Array<Effect> {
        // TODO: InputSelection wrap/unwrap
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
}

/**
 * End Turn
 */

export class EndTurnAction extends Action<Confirmation, BoardState> {
    source: Unit;

    constructor(confirmation: Confirmation, source: Unit, state: BoardState) {
        super(END, 4);
        this.source = source;
        var acquirer = new AutoInputAcquirer<Confirmation>(confirmation);
        this.acquirer = acquirer;
    }

    digest_fn(selection: Confirmation): Array<Effect> {
        // TODO: InputSelection wrap/unwrap
        // @ts-ignore
        var effects = this.source.actions.map((a) => new ExhaustEffect(this.source, a))
        return effects;
    }
}