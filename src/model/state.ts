import { 
    Stack, 
    Tree, 
    ISelectable, 
    IncrementFn, 
    TerminationFn, 
    bfs
} from "./core";

import {
    InputRequest, PreviewMap
} from "./input";
import { GridSpace } from "./space";
import { Unit } from "./unit";

import {Awaited} from "./utilities";

export interface IState {};

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
}

// T is the type of input expected
export class Action<T extends ISelectable> implements ISelectable {
    // Class managing combination of input acquisition and effect generation.
    increment_fn: IncrementFn<T>;
    termination_fn: TerminationFn<T>;
    digest_fn: DigestFn<T>;
    
    constructor(increment_fn: IncrementFn<T>, termination_fn: TerminationFn<T>, digest_fn: DigestFn<T>) {
        this.increment_fn = increment_fn;
        this.termination_fn = termination_fn;
        this.digest_fn = digest_fn;
    }

    get_options(input: Stack<T>){
        return bfs(input, this.increment_fn, this.termination_fn);
    }

    // TODO: Cleanup
    * input_option_generator(
        base: Stack<T>
    ): Generator<PreviewMap<T>, Array<Effect<BoardState>>, Stack<T>> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        var input = base;
        var preview_map = this.get_options(input).to_map();
        var input_resp = yield preview_map;
        do {
            console.log("click");
            // TODO: Currently treats "null" response as special flag to pop.
            if (!input_resp) {
                if (input.parent) {
                    input = input.pop();
                    console.log("reject")
                    preview_map = this.get_options(input).to_map();                        
                } else {
                    console.log("ignore reject");
                }
                input_resp = yield preview_map;
            } else if (input_resp.value == input.value){
                console.log("repeat");
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
        return this.digest_fn(input.to_array());
    }
};