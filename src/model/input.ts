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

/**
 * NOTE: Key type; from InputOptions generates asynchronous request for InputSelection.
 *   Bridge between InputState and user. 
 */
export type InputRequest<T extends ISelectable> = (
    input_options: InputOptions<T>
) => Promise<InputSelection<T>>;


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
    ): Promise<InputSelection<T>> {
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
 * InputOptions and returns corresponding InputSelection type.
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
 * InputAcquirers: Generate repeated InputRequests, yielding intermediate InputSelections,
 *   until satisfying conditions are met for a final InputSelection to be returned. 
 *   `yield` vs. `return` distinguishes the two.
 */
export interface IInputAcquirer<T> {
    current_input: InputSelection<T>;
    input_option_generator: SelectionGen<T>;
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

    * input_option_generator(
        base?: T
    ): Generator<Array<T>, T, T> {
        var selection = yield [this.auto_input]; // For confirmation only.
        return selection;
    }
}

export class SimpleInputAcquirer<T> implements IInputAcquirer<T> {
    // TODO: Cleanup - Simplify coupling with controller loop.
    option_fn: OptionFn<T>;
    current_input: T;
    
    constructor(
        option_fn: OptionFn<T>
    ) {
        this.option_fn = option_fn;
        // NOTE: State has to return after any complete pop off the stack.
        this.current_input = null;
    }

    public static from_options<U>(options: Array<U>): SimpleInputAcquirer<U> {
        return new SimpleInputAcquirer<U>(() => options);
    }

    * input_option_generator(
        base?: T
    ): Generator<Array<T>, T, T> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        this.current_input = base;
        var options = this.option_fn(this.current_input);
        var input_resp = yield options;
        do {
            var REJECT_CASE = !input_resp;
            var CONFIRM_CASE = (input_resp != null && input_resp == this.current_input)
            // TODO: Currently treats "null" response as special flag to pop.
            if (REJECT_CASE) {
                // var input_resp = yield options;
                return null; // NOTE: Propagates POP Signal to subphase
            } else if (CONFIRM_CASE){
                console.log("Confirm Simple InputSelection");
                break;
            } else {
                console.log("InputSelection: ", input_resp);
                this.current_input = input_resp;
                input_resp = yield options;
            }
        } while(true);
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

    get_options(input: Stack<T>): Tree<T> {
        return bfs(input, this.increment_fn, this.termination_fn);
    }

    * input_option_generator(
        base?: Stack<T>
    ): Generator<PreviewMap<T>, Stack<T>, Stack<T>> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        this.current_input = base;
        var preview_map = this.get_options(this.current_input).to_map();
        var input_resp = yield preview_map;
        do {
            var REJECT_CASE = !input_resp;
            var CONFIRM_CASE = (input_resp != null && input_resp.value == this.current_input.value)
            // TODO: Currently treats "null" response as special flag to pop.
            if (REJECT_CASE) {
                // TODO: Propagate null selection better - current state + "pop signal" tuple?
                if (this.current_input.parent) {
                    this.current_input = this.current_input.pop();
                    console.log("Pop Sequential InputSelection")
                    preview_map = this.get_options(this.current_input).to_map();                        
                } else {
                    console.log("Cannot Pop Sequential InputSelection");
                    return null; // NOTE: Propagates POP Signal to subphase
                }
                input_resp = yield preview_map;
            } else if (CONFIRM_CASE){
                console.log("Confirm Sequential InputSelection");
                break;
            } else {
                console.log("InputSelection: ", input_resp);
                this.current_input = input_resp;
                preview_map = this.get_options(this.current_input).to_map(); 
                input_resp = yield preview_map;
            }
        } while(true);
        return this.current_input;
    }
}