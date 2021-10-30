import * as test from "tape";
import {Stack, Tree} from "../model/core";

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