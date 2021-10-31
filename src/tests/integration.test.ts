import * as test from "tape";
import {bfs, ISelectable, Stack, Tree} from "../model/core";
import {InputRequest} from "../model/input";
import {Action, Effect, IState} from "../model/state";

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

type SelectionFn = (arr: Array<ISelectable>) => ISelectable

function select_first<T>(arr: Array<T>): T {
    return arr[0];
}

function synthetic_input_getter(selection_fn: SelectionFn): InputRequest {
    return async function get_input(
        preview_map: Map<ISelectable, Tree<ISelectable>>
    ): Promise<Stack<ISelectable>> {
        var arr = Array.from(preview_map.keys())
        return preview_map.get(selection_fn(arr));
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
    var action = new Action(increment_fn, termination_fn, digest_fn);
    t.end();
})



