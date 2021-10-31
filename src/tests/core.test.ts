import * as test from "tape";
import {bfs, ISelectable, Stack, Tree} from "../model/core";
import {InputRequest} from "../model/input";

class SelectableNumber implements ISelectable {
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

test("Stack Test", (t) => {
    var stack = new Stack<number>(1);
    stack = stack.push(2);
    stack = stack.push(3);
    t.deepEqual(stack.to_array(), [3, 2, 1])
    t.equal(stack.peek(), 3);
    stack = stack.pop();
    t.equal(stack.peek(), 2);
    stack = stack.pop();
    t.equal(stack.peek(), 1);
    t.deepEqual(stack.to_array(), [1])
    t.equal(stack.parent, null);
    t.end();
})

test("Tree Test", (t) => {
    var tree = new Tree<number>(1);
    t.end()
})

test("BFS test", (t) => {
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
    var tree = bfs(root_stack, increment_fn, termination_fn);
    var map = tree.to_map();
    console.log(map);
    // fails because no customizable object equality in Map/Set.
    // Or works if caching moved outside bfs layer (which stinks)
    t.equal(map.size, 7); 
    t.end();
})