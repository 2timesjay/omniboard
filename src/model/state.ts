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
export type Effect = {
    description: string;
    pre_effect: Observer;
    post_effect: Observer;
    (state: IState): IState;
};

export type Observer = {
    description: string;
    (effect: Effect, state: IState): Array<Effect>;
};

export type DigestFn<T extends ISelectable> = (selection: Array<T>) => Array<Effect>;

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
        do {
            var preview_tree = bfs(base, this.increment_fn, this.termination_fn);
            var input = await input_request(preview_tree.to_map());
        } while(preview_tree.children);
        return input;
    }
};