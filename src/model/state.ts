import { 
    Stack, 
    Tree, 
    ISelectable, 
    IncrementFn, 
    TerminationFn, 
    bfs
} from "./core";

import {
    InputAcquisitionFn,
    InputRequest, PreviewMap
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
export type DigestFn<T extends ISelectable> = (selection: Array<T>) => Array<Effect<any>>;

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

class SequentialInputAcquirer<T> {
    // TODO: Cleanup - Simplify coupling with controller loop.
    root: T
    input_acquisition_fn: InputAcquisitionFn<T>;
    increment_fn: IncrementFn<T>;
    termination_fn: TerminationFn<T>;

    constructor(
        increment_fn: IncrementFn<T>, 
        termination_fn: TerminationFn<T>, 
    ) {
        this.increment_fn = increment_fn;
        this.termination_fn = termination_fn;
    }

    get_options(input: Stack<T>): Tree<T> {
        return bfs(input, this.increment_fn, this.termination_fn);
    }

    * input_option_generator(
        base: Stack<T>
    ): Generator<PreviewMap<T>, Array<T>, Stack<T>> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        var input = base;
        var preview_map = this.get_options(input).to_map();
        var input_resp = yield preview_map;
        do {
            var REJECT_CASE = !input_resp;
            var CONFIRM_CASE = (input_resp != null && input_resp.value == input.value)
            // TODO: Currently treats "null" response as special flag to pop.
            if (REJECT_CASE) {
                if (input.parent) {
                    input = input.pop();
                    console.log("reject")
                    preview_map = this.get_options(input).to_map();                        
                } else {
                    console.log("ignore reject");
                }
                input_resp = yield preview_map;
            } else if (CONFIRM_CASE){
                console.log("confirm");
                // input_resp = yield preview_map;
                break;
            } else {
                console.log("choice");
                input = input_resp;
                preview_map = this.get_options(input).to_map(); 
                input_resp = yield preview_map;
            }
            // console.log(input);
        } while(true);
        console.log("input_option_generation over");
        return input.to_array();
    }
}

// T is the type of input expected
export class Action<T extends ISelectable, U extends IState> implements ISelectable {
    // Class managing combination of input acquisition and effect generation.
    text: string;
    index: number;
    acquirer: SequentialInputAcquirer<T>;
    digest_fn: DigestFn<T>;
    
    constructor(
        text: string,
        index: number,
        increment_fn: IncrementFn<T>, 
        termination_fn: TerminationFn<T>, 
        digest_fn: DigestFn<T>,
    ) {
        this.text = text;
        this.index = index;
        this.acquirer = new SequentialInputAcquirer<T>(
            increment_fn,
            termination_fn,
        )
        this.digest_fn = digest_fn;
    }

    // get_options(input: Stack<T>): Tree<T> {
    //     return bfs(input, this.increment_fn, this.termination_fn);
    // }

    // TODO: Correctly type this.
    * get_final_input_and_effect(base: Stack<T>): Effect<U> {
        var input = yield *this.acquirer.input_option_generator(base);
        return this.digest_fn(input);
    }
    // // TODO: Cleanup - Simplify coupling with controller loop.
    // * input_option_generator(
    //     base: Stack<T>
    // ): Generator<PreviewMap<T>, Array<Effect<U>>, Stack<T>> {
    //     // Handles cases where intermediate input is required by yielding it.
    //     // Coroutine case.
    //     var input = base;
    //     var preview_map = this.get_options(input).to_map();
    //     var input_resp = yield preview_map;
    //     do {
    //         var REJECT_CASE = !input_resp;
    //         var CONFIRM_CASE = (input_resp != null && input_resp.value == input.value)
    //         // TODO: Currently treats "null" response as special flag to pop.
    //         if (REJECT_CASE) {
    //             if (input.parent) {
    //                 input = input.pop();
    //                 console.log("reject")
    //                 preview_map = this.get_options(input).to_map();                        
    //             } else {
    //                 console.log("ignore reject");
    //             }
    //             input_resp = yield preview_map;
    //         } else if (CONFIRM_CASE){
    //             console.log("confirm");
    //             // input_resp = yield preview_map;
    //             break;
    //         } else {
    //             console.log("choice");
    //             input = input_resp;
    //             preview_map = this.get_options(input).to_map(); 
    //             input_resp = yield preview_map;
    //         }
    //         // console.log(input);
    //     } while(true);
    //     console.log("input_option_generation over");
    //     return this.digest_fn(input.to_array());
    // }
};