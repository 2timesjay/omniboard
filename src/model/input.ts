import { 
    ISelectable, 
    Stack,
    Tree,
} from "./core";
import { Awaited } from "./utilities";

// Should this be Stack instead of Tree (and everywhere similar?)
// Should this be a generator???
export type InputRequest<T extends ISelectable> = (
    preview_map: Map<T, Tree<T>>
) => Promise<Stack<T>>;

export type SelectionFn<T extends ISelectable> = (arr: Array<T>) => T

export type CallbackSelectionFn<T extends ISelectable> = (
    arr: Array<T>, callback: Awaited<T> // Awaited from utilities. Replace in ts 4.5
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

export function async_input_getter<T extends ISelectable>(
    selection_fn: CallbackSelectionFn<T>
): InputRequest<T> {
    return async function get_input( 
        preview_map: Map<T, Tree<T>>
    ): Promise<Stack<T>> {
        var arr = Array.from(preview_map.keys())
        // Manually specify type to remove errors
        var selection_promise: Promise<T> = new Promise(
            function(resolve, reject) {
                selection_fn(arr, resolve)
            }
        );
        return selection_promise.then(
            function(selection) { 
                return preview_map.get(selection); 
            }
        );
    };
}

// Suspicious function. TODO: Clean up.
// Build a generator a la https://whistlr.info/2020/async-generators-input/ ?
// function build_input_getter(preview_map: Map<ISelectable, Tree<ISelectable>>, sequence: Array<ISelectable>): InputRequest {
//     return async function get_input(
//         preview_map: Map<ISelectable, Tree<ISelectable>>
//     ): Promise<Stack<ISelectable>> {
//         return input_getter(preview_map);
//     };
// }


// Readline Input
// See https://stackoverflow.com/questions/8128578/reading-value-from-console-interactively
// And https://stackoverflow.com/questions/33858763/console-input-in-typescript/49055758 