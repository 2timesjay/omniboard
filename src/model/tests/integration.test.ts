import * as test from "tape";
import { NumberState, SelectableNumber } from "../../tests/utilities";
import {bfs, ISelectable, Stack, Tree} from "../core";
import {SelectionFn, synthetic_input_getter} from "../input";
import {Action, Effect, IState} from "../state";
import {Awaited} from "../utilities";

function select_last<T>(arr: Array<T>): T {
    return arr[arr.length-1];
}

test("Integration test", (t) => {
    // move caching into SelectableNumber class definition?
    var numbers = new Array<SelectableNumber>();
    for (var i = 0; i < 30; i++) {
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
        return nums.depth >= 4;
    }
    var digest_fn = (nums: Array<SelectableNumber>): Array<Effect<NumberState>> => {
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
    var select_last_input_getter = synthetic_input_getter<SelectableNumber>(select_last);
    var action = new Action(increment_fn, termination_fn, digest_fn);
    var input_promise = action.acquire_input(root_stack, select_last_input_getter);
    var number_state = new NumberState(10);
    var input = input_promise.then(
        function(input) {
            // console.log(input.to_array());
            var effects = digest_fn(input.to_array())
            t.equal(effects.length, 1);
            var transformed_state = effects[0](number_state);
            t.equal(transformed_state.value, 31);
            // console.log(input_promise);
            t.end();
        }
    );
})



