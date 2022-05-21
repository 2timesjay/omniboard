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
// TODO: Build a generator a la https://whistlr.info/2020/async-generators-input/ ?

export type PreviewMap<T> = Map<T, Tree<T>>;

export type InputOptions<T> = PreviewMap<T> | Array<T>;
export type InputSelection<T> = Stack<T> | T;

// Should this be Stack instead of Tree (and everywhere similar?)
// Should this be a generator???
export type InputRequest<T extends ISelectable> = (
    input_options: InputOptions<T>
) => Promise<InputSelection<T>>;

export type SelectionFn<T extends ISelectable> = (options: Array<T>) => T

// TODO: Pass preview_map directly instead of just options.
export type CallbackSelectionFn<T extends ISelectable> = (
    options: Array<T>, resolve: Awaited<T>, reject: Rejection // Awaited from utilities. Replace in ts 4.5
) => void;

export function synthetic_input_getter<T extends ISelectable>(
    selection_fn: SelectionFn<T>
): InputRequest<T> {
    return async function get_input( 
        preview_map: Map<T, Tree<T>>
    ): Promise<Stack<T>> {
        var arr = Array.from(preview_map.keys())
        var selection = selection_fn(arr);
        return preview_map.get(selection);
    };
}

// AKA build_callback_input_getter
export function async_input_getter<T extends ISelectable>(
    selection_fn: CallbackSelectionFn<T>
): InputRequest<T> {
    return async function get_input( 
        preview_map: Map<T, Tree<T>>
    ): Promise<Stack<T>> {
        console.log("pm: ", preview_map)
        // TODO: Fix Hack to handle Arr InputOptions
        if (preview_map instanceof Array) {
            var arr: Array<T> = preview_map
        } else {
            var arr = Array.from(preview_map.keys())
        }
        // TODO: "resolve" returns value, "reject" deselects
        // TODO: selecting null parent of Stack head as CONFIRM signal?
        // Manually specify type to remove errors
        var selection_promise: Promise<T> = new Promise(
            function(resolve, reject) {
                selection_fn(arr, resolve, reject)
            }
        );
        return selection_promise.then(
            function(selection) { 
                console.log("aig_res: ", selection);
                if (preview_map instanceof Array) {
                    return selection;
                } else {
                    return preview_map.get(selection); 
                }
            }
        ).catch(
            function() {
                console.log("aig_rej");
                return null;
            }
        );
    };
}

export function flat_tree_helper<T extends ISelectable>(options: Array<T>) {
    var tree = new Tree(null);
    for (var option of options){
        tree.add_child(new Tree(option));
    }
    return tree;
}

// TODO: Does "null" root cause problems? Probably
export async function acquire_flat_input<T extends ISelectable>(options: Array<T>, input_request: InputRequest<T>): Promise<InputSelection<T>> {
    // Single-element input acquisition
    var preview_tree = flat_tree_helper<T>(options);
    var input = await input_request(preview_tree.to_map());
    return input;
}



// TODO add structure
export interface IInputAcquirer<T> {
    // * input_option_generator(
    //     base?: Stack<T>
    // ): Generator<PreviewMap<T>, Array<T>, Stack<T>>;
}

export class SimpleInputAcquirer<T> implements IInputAcquirer<T> {
    // TODO: Cleanup - Simplify coupling with controller loop.
    option_fn: OptionFn<T>;
    
    constructor(
        option_fn: OptionFn<T>
    ) {
        this.option_fn = option_fn;
    }

    * input_option_generator(
        base?: T
    ): Generator<Array<T>, T, T> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        var input = base;
        var options = this.option_fn(input);
        var input_resp = yield options;
        do {
            var REJECT_CASE = !input_resp;
            var CONFIRM_CASE = (input_resp != null && input_resp == input)
            // TODO: Currently treats "null" response as special flag to pop.
            if (REJECT_CASE) {
                // var input_resp = yield options;
                return null; // NOTE: Propagates POP Signal to subphase
            } else if (CONFIRM_CASE){
                console.log("confirm");
                break;
            } else {
                console.log("simple choice: ", input_resp);
                input = input_resp;
                input_resp = yield options;
            }
        } while(true);
        console.log("input_option_generation over");
        return input;
    }
}

export class SequentialInputAcquirer<T> implements IInputAcquirer<T> {
    // TODO: Cleanup - Simplify coupling with controller loop.
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
        base?: Stack<T>
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
                    return null; // NOTE: Propagates POP Signal to subphase
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