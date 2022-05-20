import { 
    ISelectable, 
    Stack,
    Tree,
} from "./core";
import { Awaited, Rejection } from "./utilities";
// TODO: Build a generator a la https://whistlr.info/2020/async-generators-input/ ?

export type PreviewMap<T> = Map<T, Tree<T>>;

export type InputOptions<T> = PreviewMap<T> | Array<T>;
export type InputSelection<T> = Stack<T> | T;
export type InputAcquisitionFn<T> = () => InputSelection<T>;

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