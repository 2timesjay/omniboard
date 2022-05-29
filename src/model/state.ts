import { DisplayHandler } from "../view/display_handler";
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
    Confirmation,
    IInputAcquirer,
    InputOptions,
    InputRequest, InputSelection, PreviewMap
} from "./input";
import { GridSpace } from "./space";
import { Unit } from "./unit";

import {Awaited, sleep} from "./utilities";

export interface IState {
    get_selectables: () => Array<ISelectable>;
};

// Implement as Callable for now
// https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures
export type Effect<T extends IState> = {
    description: string;
    set_animate?: (display_handler: DisplayHandler) => void;
    animate?: () => void;
    pre_effect: Observer<T>;
    post_effect: Observer<T>;
    (state: T): T;
};

export type Observer<T extends IState> = {
    description: string;
    (effect: Effect<T>, state: T): Array<Effect<T>>;
};

// TODO: The `any` here is a bit wacky. Could https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-types help?
export type DigestFn<T extends ISelectable> = (selection: InputSelection<T>) => Array<Effect<any>>;

export class BoardState implements IState {
    grid: GridSpace;
    units: Array<Unit>;
    confirmation: Confirmation; // NOTE: Single Confirmation for all cases.

    async process(
        effects: Array<Effect<BoardState>>
    ): Promise<BoardState> {
        var self = this;
        // TODO: Handle effect-tree and observers
        var execution_promise = sleep(0);
        for (var effect of effects) {
            if (false) {
            // if (effect.animate != null){
                console.log("Animating + Executing")
                execution_promise = execution_promise
                    .then(() => effect.animate())
                    .then(() => sleep(1000))
                    .then(() => effect(self))
                    .then(() => console.log("Tempo"));
            } else {
                console.log("Executing")
                // execution_promise = execution_promise
                //     .then(() => sleep(1000))
                //     .then(() => effect(self))  
                //     .then(() => console.log("Tempo"));
                // effect(self);
                sleep(0).then(() => effect.bind(self)(self));
            }
        }
        return this;
    };

    // TODO: Add actions or handle generically
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
        selectables.push(this.confirmation);
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

    * get_final_input(
        base: InputSelection<T>
    ): Generator<InputOptions<T>, InputSelection<T>, InputSelection<T>> {
        // @ts-ignore expects 'Stack<T> & T', but the containing gen sends 'InputSelection<T>'
        var input = yield *this.acquirer.input_option_generator(base);
        // TODO: More elegant propagation? Probably solved by separating digest.
        return input;
    }
};