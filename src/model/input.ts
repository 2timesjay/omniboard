import { 
    ISelectable, 
    Stack,
    Tree,
} from "./core";
import { Awaited } from "./utilities";
// TODO: Build a generator a la https://whistlr.info/2020/async-generators-input/ ?

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
        // TODO: "resolve" returns value, "reject" deselects
        // TODO: selecting null parent of Stack head as CONFIRM signal?
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