import * as test from "tape";
import {bfs, ISelectable, Stack, Tree} from "../model/core";
import {InputRequest} from "../model/input";
import {Action, Effect, IState} from "../model/state";
import {Awaited} from "../model/utilities";

class SelectableNumber implements ISelectable {
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

class NumberState implements IState {
    value: number;
    
    constructor(value: number){
        this.value = value;
    }

    // Should this mutate or return new State?
    add(add_value: number) {
        this.value = this.value + add_value;
    }
}

type SelectionFn<T extends ISelectable> = (arr: Array<T>) => T

function select_first<T>(arr: Array<T>): T {
    return arr[0];
}

function synthetic_input_getter<T extends ISelectable>(selection_fn: SelectionFn<T>): InputRequest<T> {
    return async function get_input( 
        preview_map: Map<T, Tree<T>>
    ): Promise<Stack<T>> {
        var arr = Array.from(preview_map.keys())
        var selection = selection_fn(arr);
        return preview_map.get(selection);
    };
}


test("Action/input test", (t) => {
    // move caching into SelectableNumber class definition?
    var numbers = new Array<SelectableNumber>();
    for (var i = 0; i < 100; i++) {
        numbers.push(new SelectableNumber(i));
    }
    
    var root_stack = new Stack<SelectableNumber>(new SelectableNumber(3));
    var increment_fn = (nums: Stack<SelectableNumber>): Array<SelectableNumber> => {
        var options = Array<SelectableNumber>();
        var current_num = nums.value.value;
        options.push(numbers[current_num+3]);
        options.push(numbers[current_num+6]);
        return options;
    };
    var termination_fn = (nums: Stack<SelectableNumber>): boolean => {
        return nums.depth > 3;
    }
    var digest_fn = (nums: Array<SelectableNumber>): Array<Effect> => {
        function effect(state: NumberState): NumberState {
            state.add(nums[0].value);
            return state;
        };
        // Reconsider callable.
        effect.description = null;
        effect.pre_effect = null;
        effect.post_effect = null;
        return [effect];
    }
    // Either specify SelectableNumber as type of input getter OR cast within digest_fn
    // TODO: Make casting option more robust
    var select_first_input_getter = synthetic_input_getter<SelectableNumber>(select_first);
    var action = new Action(increment_fn, termination_fn, digest_fn);
    var input_promise = action.acquire_input(root_stack, select_first_input_getter);
    input_promise.then(
        function(input) {var effect = digest_fn(input.to_array())}
    );
    t.end();
})



