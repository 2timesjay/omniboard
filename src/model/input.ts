import { 
    ISelectable, 
    Stack,
    Tree,
} from "./core";
import { GridLocation } from "./space";
import { Action } from "./state";
import { Unit } from "./unit";
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
                selection_fn(arr, resolve, reject)
            }
        );
        return selection_promise.then(
            function(selection) { 
                return preview_map.get(selection); 
            }
        ).catch(
            function() {
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
export async function acquire_flat_input<T extends ISelectable>(options: Array<T>, input_request: InputRequest<T>): Promise<Stack<T>> {
    // Single-element input acquisition
    var preview_tree = flat_tree_helper<T>(options);
    var input = await input_request(preview_tree.to_map());
    return input;
}

export function input_bridge(phase: Phase, input_brokers: Array<InputRequest<ISelectable>>) {
}

// --- Tactics ---

function isInputOptionsUnit(o: any): o is InputOptions<Unit> {
    return (!!o.value && o.value instanceof Unit) || o instanceof Unit
} 
// TODO: Have to take "TacticsSelectable" on faith - should this be part of Action?
function isInputOptionsAction(o: any): o is InputOptions<Action<TacticsSelectable>> {
    return (!!o.value && o.value instanceof Action) || o instanceof Action
} 
function isInputOptionsGridLocation(o: any): o is InputOptions<GridLocation> {
    return (!!o.value && o.value instanceof GridLocation) || o instanceof GridLocation
} 

type TacticsSelectable = Unit | GridLocation | Action<TacticsSelectable>

export async function tactics_input_wrangler(
    input_options: InputOptions<TacticsSelectable>, 
    unit_broker: InputRequest<Unit>,
    action_broker: InputRequest<Action<TacticsSelectable>>,
    location_broker: InputRequest<GridLocation>,
) {
    if (isInputOptionsUnit(input_options)) {
        return unit_broker(input_options);
    } else if (isInputOptionsAction(input_options)) {
        return action_broker(input_options);
    } else if (isInputOptionsGridLocation(input_options)) {
        return location_broker(input_options);
    }
}