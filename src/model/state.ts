import { 
    Stack, 
    Tree, 
    ISelectable, 
    IncrementFn, 
    TerminationFn, 
    bfs
} from "./core";

import {
    InputRequest
} from "./input";

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
    
}

// T is the type of input expected
export class Action<T extends ISelectable> {
    // Class managing combination of input acquisition and effect generation.
    increment_fn: IncrementFn<T>;
    termination_fn: TerminationFn<T>;
    digest_fn: DigestFn<T>;
    
    constructor(increment_fn: IncrementFn<T>, termination_fn: TerminationFn<T>, digest_fn: DigestFn<T>) {
        this.increment_fn = increment_fn;
        this.termination_fn = termination_fn;
        this.digest_fn = digest_fn;
    }

    async acquire_input(base: Stack<T>, input_request: InputRequest<T>): Promise<Stack<T>> {
        // Async but fully encapsulated. Never exposes intermediate input.
        var input = base
        do {
            var preview_tree = bfs(input, this.increment_fn, this.termination_fn);
            var input = await input_request(preview_tree.to_map());
        } while(preview_tree.children);
        return input;
    }

    async * acquire_input_gen(base: Stack<T>, input_request: InputRequest<T>) {
        // Handlescases where intermediate input is required by yielding it.
        var input = base;
        var preview_tree = bfs(input, this.increment_fn, this.termination_fn);
        do {
            var preview_tree = bfs(input, this.increment_fn, this.termination_fn);
            var input_resp = await input_request(preview_tree.to_map());
            // TODO: Currently treats "null" response as special flag to pop.
            if (!input_resp) {
                if (input.parent) {
                    input = input.pop();
                    console.log("reject")
                    preview_tree = bfs(input, this.increment_fn, this.termination_fn);                        
                } else {
                    console.log("ignore reject");
                }
                yield input;
            } else if (input_resp.value == input.value){
                console.log("repeat");
                yield input;
                break;
            } else {
                console.log("choice");
                input = input_resp;
                yield input;
            }
            console.log(input);
        } while(preview_tree.children);
        console.log("acquire_input_gen over")
    }
};