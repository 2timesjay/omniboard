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

export type DigestFn = (selection: Array<ISelectable>) => Array<Effect>;

export class Action {
    // Class managing combination of input acquisition and effect generation.
    increment_fn: IncrementFn;
    termination_fn: TerminationFn;
    digest_fn: DigestFn;
    
    constructor(increment_fn: IncrementFn, termination_fn: TerminationFn, digest_fn: DigestFn) {
        this.increment_fn = increment_fn;
        this.termination_fn = termination_fn;
        this.digest_fn = digest_fn;
    }

    async acquire_input(base: Stack<ISelectable>, input_request: InputRequest): Promise<Stack<ISelectable>> {
        do {
            var preview_tree = bfs(base, this.increment_fn, this.termination_fn);
            var input = await input_request(preview_tree.to_map());
        } while(preview_tree.children);
        return input;
    }
};