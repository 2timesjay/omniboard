import { 
    Stack, 
    Tree, 
    ISelectable, 
    IncrementFn, 
    TerminationFn, 
    bfs,
    OptionFn
} from "./core";

import {
    IInputAcquirer,
    InputOptions,
    InputRequest, InputSelection, PreviewMap
} from "./input";
import { GridSpace } from "./space";
import { Unit } from "./unit";

import {Awaited} from "./utilities";

export interface IState {
};

// Implement as Callable for now
// https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures
export type Effect<T extends IState> = {
    description: string;
    pre_effect: Observer<T>;
    post_effect: Observer<T>;
    (state: T): T;
};

export type Observer<T extends IState> = {
    description: string;
    (effect: Effect<T>, state: T): Array<Effect<T>>;
};

// TODO: The `any` here is a big wacky. Could https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-types help?
export type DigestFn<T extends ISelectable> = (selection: InputSelection<T>) => Array<Effect<any>>;

export class BoardState implements IState {
    grid: GridSpace;
    units: Array<Unit>;

    process(
        effects: Array<Effect<BoardState>>
    ): BoardState {
        // TODO: Handle effect-tree and observers
        for (var effect of effects) {
            effect(this);
        }
        return this;
    };

    get_selectables(): Array<ISelectable> {
        var selectables = new Array<ISelectable>();
        for (let grid_row of this.grid.locs) {
            for (let grid_loc of grid_row) {
                selectables.push(grid_loc);
            }
        }
        for (let unit of this.units) {
            selectables.push(unit);
            for (let action of unit.actions) {
                selectables.push(action);
            }
        }
        return selectables;
    }
};

// T is the type of input expected
export class Action<T extends ISelectable, U extends IState> implements ISelectable {
    // Class managing combination of input acquisition and effect generation.
    text: string;
    index: number;
    acquirer: IInputAcquirer<T>;
    digest_fn: DigestFn<T>;
    
    constructor(
        text: string,
        index: number,
        acquirer: IInputAcquirer<T>,
        digest_fn: DigestFn<InputSelection<T>>,
    ) {
        this.text = text;
        this.index = index;
        this.acquirer = acquirer;
        this.digest_fn = digest_fn;
    }

    peek_final_input(): InputSelection<T> {
        return this.acquirer.current_input;
    }

    // TODO: Correctly type this.
    * get_final_input(
        base: Stack<T>
    ): Generator<InputOptions<T>, InputSelection<T>, InputSelection<T>> {
        // @ts-ignore expects 'Stack<T> & T', but the containing gen sends 'InputSelection<T>'
        var input = yield *this.acquirer.input_option_generator(base);
        // TODO: More elegant propagation? Probably solved by separating digest.
        return input;
    }
};