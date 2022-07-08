import { FalseLiteral } from "typescript";
import { IMenuable } from "../view/display";
import { 
    bfs,
    IncrementFn,
    ISelectable, 
    OptionFn, 
    Stack,
    TerminationFn,
    Tree,
} from "./core";
import { Awaited, Rejection } from "./utilities";

export type PreviewMap<T> = Map<T, Tree<T>>;

// NOTE: PreviewMap Options should return Stack Selection; Array returns T.
export type InputOptions<T> = PreviewMap<T> | Array<T>;
export type InputSelection<T> = Stack<T> | T;
export enum InputSignal {
    Confirm,
    Reject,
    Enter,
    Exit,
}
export type InputResponse<T> = InputSelection<T> | InputSignal;

/**
 * NOTE: Key type; from InputOptions generates asynchronous request for InputResponse.
 *   Bridge between InputState and user. 
 */
export type InputRequest<T extends ISelectable> = (
    input_options: InputOptions<T>
) => Promise<InputResponse<T>>;


/**
 * Mechanistic Callback/SelectionFn classes - about the "how" of InputFetching 
 *   not abstract interfaces.
 */
export type SelectionFn<T extends ISelectable> = (options: Array<T>) => T
// TODO: Pass preview_map directly instead of just options.
export type CallbackSelectionFn<T extends ISelectable> = (
    options: InputOptions<T>, resolve: Awaited<T>, reject: Rejection // Awaited from utilities. Replace in ts 4.5
) => void;

/**
 * synthetic/async_input_getter: InputRequest factories really.
 */
export function synthetic_input_getter<T extends ISelectable>(
    selection_fn: SelectionFn<T>
): InputRequest<T> {
    return async function get_input( 
        input_options: InputOptions<T>
    ): Promise<InputResponse<T>> {
        console.log("synthetic_input_getter options: ", input_options);
        if (input_options instanceof Array) {
            return selection_fn(input_options);
        } else {
            var arr = Array.from(input_options.keys())
            var selection = selection_fn(arr);
            return input_options.get(selection);
        }
    };
}

// Builds an async InputRequest. Explicitly constructs promise around selection_fn
export function async_input_getter<T extends ISelectable>(
    selection_fn: CallbackSelectionFn<T>
): InputRequest<T> {
    return async function get_input( 
        input_options: InputOptions<T>
    ): Promise<Stack<T>> {
        console.log("Building InputRequest: ", input_options);
        // TS analog to type guarding kind of.
        if (input_options instanceof Array) {
            var arr: Array<T> = input_options
        } else {
            var arr = Array.from(input_options.keys())
        }
        // Manually specify type to remove errors
        var selection_promise: Promise<T> = new Promise(
            function(resolve, reject) {
                selection_fn(arr, resolve, reject)
            }
        );
        return selection_promise.then(
            function(selection) { 
                console.log("Resolve Selection: ", selection);
                if (input_options instanceof Array) {
                    return selection;
                } else {
                    return input_options.get(selection); 
                }
            }
        ).catch(
            function() {
                // TODO: Replace with some kind of explicit signal?
                console.log("Reject Selection");
                return null;
            }
        );
    };
}

/**
 * Key Type; Closely related to InputRequest, but a generator version - takes
 * InputOptions and returns corresponding InputResponse type.
 */
// TODO: Refine and use everywhere
export type SelectionGen<T> = (
    ((base?: Stack<T>) => Generator<PreviewMap<T>, Stack<T>, Stack<T>>) | 
    ((base?: T) => Generator<Array<T>, T, T>)
)

// TODO: Move and maybe generate from selectables instead of creating singleton.
export class Confirmation implements ISelectable, IMenuable {
    index: number;
    text: string;

    constructor() {
        this.index = 1;
        this.text = "Confirm";
    }
}

/**
 * InputAcquirers: Generate repeated InputRequests, yielding intermediate InputResponses,
 *   until satisfying conditions are met for a final InputResponse to be returned. 
 *   `yield` vs. `return` distinguishes the two.
 */
export interface IInputAcquirer<T> {
    current_input: InputResponse<T>;
    input_option_generator: SelectionGen<T>;
    get_options: (input: InputResponse<T>) => InputOptions<T>;
}

export class AutoInputAcquirer<T> implements IInputAcquirer<T> {
    auto_input: T;
    current_input: T;
    
    constructor(
        auto_input: T
    ) {
        this.auto_input = auto_input;
        // NOTE: Pre-queues auto_input; NEVER CHANGED.
        this.current_input = auto_input;
    }

    get_options(input: InputResponse<T>): Array<T> {
        return [this.auto_input];
    }

    * input_option_generator(
        base?: T
    ): Generator<Array<T>, T, T> {
        var selection = yield this.get_options(base); // For confirmation only.
        return selection;
    }
}

export class SimpleInputAcquirer<T> implements IInputAcquirer<T> {
    // TODO: Cleanup - Simplify coupling with controller loop.
    _option_fn: OptionFn<T>;
    current_input: T;
    require_confirmation: boolean;
    
    constructor(
        option_fn: OptionFn<T>,
        require_confirmation = true,
    ) {
        this._option_fn = option_fn;
        // NOTE: State has to return after any complete pop off the stack.
        this.current_input = null;
        this.require_confirmation = require_confirmation;
    }

    public static from_options<U>(options: Array<U>): SimpleInputAcquirer<U> {
        return new SimpleInputAcquirer<U>(() => options);
    }

    get_options(input: InputResponse<T>): Array<T> {
        return this._option_fn(input);
    }

    * input_option_generator(
        base?: InputResponse<T>
    ): Generator<Array<T>, T, T> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        var options = this.get_options(base);
        var input_resp = yield options;
        if (this.require_confirmation) {
            do {
                var REJECT_CASE = !input_resp;
                var CONFIRM_CASE = (input_resp != null && input_resp == this.current_input)
                // TODO: Currently treats "null" response as special flag to pop.
                if (REJECT_CASE) {
                    // var input_resp = yield options;
                    return null; // NOTE: Propagates POP Signal to subphase
                } else if (CONFIRM_CASE){
                    console.log("Confirm Simple InputResponse");
                    break;
                } else {
                    console.log("InputResponse: ", input_resp);
                    this.current_input = input_resp;
                    input_resp = yield options;
                }
            } while(true);
        } else {
            return input_resp;
        }
        return this.current_input;
    }
}

export class SequentialInputAcquirer<T> implements IInputAcquirer<T> {
    // TODO: Cleanup - Simplify coupling with controller loop.
    increment_fn: IncrementFn<T>;
    termination_fn: TerminationFn<T>;
    current_input: Stack<T>;

    constructor(
        increment_fn: IncrementFn<T>, 
        termination_fn: TerminationFn<T>, 
    ) {
        this.increment_fn = increment_fn;
        this.termination_fn = termination_fn;
        this.current_input = null;
    }

    get_options(input: Stack<T>): PreviewMap<T> {
        return bfs(input, this.increment_fn, this.termination_fn).to_map();
    }

    * input_option_generator(
        base?: Stack<T>
    ): Generator<PreviewMap<T>, Stack<T>, Stack<T>> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        this.current_input = base;
        var preview_map = this.get_options(this.current_input);
        var input_resp = yield preview_map;
        do {
            var REJECT_CASE = !input_resp;
            var CONFIRM_CASE = (input_resp != null && input_resp.value == this.current_input.value)
            // TODO: Currently treats "null" response as special flag to pop.
            if (REJECT_CASE) {
                // TODO: Propagate null selection better - current state + "pop signal" tuple?
                if (this.current_input.parent) {
                    this.current_input = this.current_input.pop();
                    console.log("Pop Sequential InputResponse")
                    preview_map = this.get_options(this.current_input);                        
                } else {
                    console.log("Cannot Pop Sequential InputResponse");
                    return null; // NOTE: Propagates POP Signal to subphase
                }
                input_resp = yield preview_map;
            } else if (CONFIRM_CASE){
                console.log("Confirm Sequential InputResponse");
                break;
            } else {
                console.log("InputResponse: ", input_resp);
                this.current_input = input_resp;
                preview_map = this.get_options(this.current_input); 
                input_resp = yield preview_map;
            }
        } while(true);
        return this.current_input;
    }
}

export class ChainedInputAcquirer<T> extends SequentialInputAcquirer<T> {
    // static from_input_acquirer_list<U>(
    //     input_acquirer_list: Array<IInputAcquirer<U>>
    // ): ChainedInputAcquirer<U> {
    constructor(option_fn_list: Array<OptionFn<T>>) {
        var increment_fn = (stack: Stack<T>): Array<T> => {
            var option_fn_index = stack.depth - 1;
            var option_fn = option_fn_list[option_fn_index];
            return option_fn(stack);
        };
        var termination_fn = (stack: Stack<T>): boolean => {
            return stack.depth > option_fn_list.length;
        };
        super(
            increment_fn,
            termination_fn,
        )
    }
}

/**
 * Experimental Acquirers
 */

// NOTE: Supports set acquisition with DAGish constraints.
// TODO: Actually harder to make an arbitrarily constrained SetInputAcquirer.
// TODO: Replace Stack.to_array with new InputResponse type? ("set" or "pool").
class TreeInputAcquirer<T> implements IInputAcquirer<T> {
    increment_fn: IncrementFn<T>;
    termination_fn: TerminationFn<T>;
    current_input: Stack<T>;

    constructor(
        increment_fn: IncrementFn<T>, 
        termination_fn: TerminationFn<T>, 
    ) {
        this.increment_fn = increment_fn;
        this.termination_fn = termination_fn;
        this.current_input = null;
    }

    get_options(input: Stack<T>): PreviewMap<T> {
        return bfs(input, this.increment_fn, this.termination_fn).to_map();
    }

    * input_option_generator(
        base?: Stack<T>
    ): Generator<PreviewMap<T>, Stack<T>, Stack<T>> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        this.current_input = base;
        var preview_map = this.get_options(this.current_input);
        var input_resp = yield preview_map;
        do {
            // TODO: Currently treats "null" response as special flag to pop.
            var REJECT_CASE = input_resp == null;
            if (REJECT_CASE) {
                // TODO: Propagate null selection better - current state + "pop signal" tuple?
                if (this.current_input.parent) {
                    this.current_input = this.current_input.pop();
                    console.log("Pop Sequential InputResponse")
                    preview_map = this.get_options(this.current_input);                        
                } else {
                    console.log("Cannot Pop Sequential InputResponse");
                    return null; // NOTE: Propagates POP Signal to subphase
                }
                input_resp = yield preview_map;
            } else {
                var already_selected = input_resp.value in this.current_input.to_array()
                var SELECT_CASE = input_resp != null && !already_selected;
                var DESELECT_CASE = input_resp != null && already_selected;
                var CONFIRM_CASE = false; // TODO: Implement.
                if (CONFIRM_CASE){
                    console.log("Confirm Sequential InputResponse");
                    break;
                } else {
                    console.log("InputResponse: ", input_resp);
                    this.current_input = input_resp;
                    preview_map = this.get_options(this.current_input); 
                    input_resp = yield preview_map;
                }
            }
        } while(true);
        return this.current_input;
    }
}