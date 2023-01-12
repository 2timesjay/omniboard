import { InputOptions, InputResponse } from "./input";

export interface ISelectable {}

class StackIterator<T> implements Iterator<T> {
    private _stack: Stack<T> | null;

    constructor(stack: Stack<T>) {
        this._stack = stack;
    }

    next(): IteratorResult<T> {
        if (this._stack == null) {
            return {value: undefined, done: true};
        }
        else {
            var cur = this._stack.value;
            this._stack = this._stack.parent;
            return {value: cur, done: false};   
        }
    }
}

/**
 * Stack - more like a LinkedList really. 
 */ 
export class Stack<T> implements Iterable<T>{
    value: T;
    parent: Stack<T> | null;
    depth: number;
    
    constructor(value: T, parent?: Stack<T>) {
        this.value = value;
        if (parent) {
            this.parent = parent;
            this.depth = parent.depth + 1;
        } else {
            this.parent = null;
            this.depth = 1;
        }
    }

    static from_array<U>(arr: Array<U>): Stack<U> {
        var stack = null
        for (var value of arr) {
            stack = new Stack(value, stack);
        }
        return stack;
    }

    [Symbol.iterator](): Iterator<T> {
        return new StackIterator<T>(this);
    }

    push(sel: T): Stack<T> {
        return new Stack<T>(sel, this);
    }

    peek(): T {
        return this.value;
    }

    // TODO: This is not the conventional meaning of pop()
    pop(): Stack<T> {
        return this.parent;
    }
    
    splice(value: T): Stack<T> {
        var arr = this.to_array();
        var index = arr.indexOf(value);
        if (index >= 0) {
            arr.splice(index, 1);
            return Stack.from_array(arr);
        } else {
            return this;
        }
        
    }

    to_array(): Array<T> {
        var arr = Array<T>();
        for (var value of this) {
            // Don't include null values (specifically roots)
            // TODO: Make safer if nulls present in stack?
            if (value != null) {
                arr.unshift(value);
            }
        };
        return arr;
    }
}

/**
 * Tree - Each subtree can be treated as a Stack.
 * This is useful for converting a choice on a PreviewMap
 * into a Stack InputResponse with maximum ease.
 */
export class Tree<T> extends Stack<T> {
    value: T;
    parent: Tree<T> | null;
    children: Array<Tree<T>> | null;
    depth: number;

    // TODO: Handles depth kind of hackily - improve.
    static from_stack<U>(stack: Stack<U>): Tree<U> {
        var tree = new Tree<U>(stack.value);
        if (stack.parent) { 
            tree.add_parent(Tree.from_stack(stack.parent));
            stack = stack.parent;
        }
        return tree;
    }

    static from_array<U>(arr: Array<U>): Tree<U> {
        var root = new Tree<U>(null);
        for (var elem of arr) { 
            var tree = new Tree<U>(elem);
            tree.add_parent(root);
        }
        return tree;
    }

    constructor(value: T, parent?: Tree<T>, children?: Array<Tree<T>>){
        super(value, parent);
        if (children) {
            this.children = children;
        } else {
            this.children = null;
        }
    }

    add_parent(parent: Tree<T>): Tree<T> {
        this.parent = parent;
        this.depth = this.parent.depth + 1;
        parent.add_child(this);
        return parent;
    }

    add_child(child: Tree<T>): Tree<T> {
        child.depth = this.depth + 1;
        child.parent = this;
        if (this.children) {
            this.children.push(child);
        }
        else {
            this.children = new Array<Tree<T>>(child);
        }
        return child;
    }

    // TODO: Alias type as PreviewMap<T>
    to_map(): Map<T, Tree<T>> {
        if (this.children) {
            var map = new Map<T, Tree<T>>()
            map.set(this.value, this);
            this.children.forEach(
                (child) => {
                    var child_map = child.to_map();
                    child_map.forEach((value, key) => map.set(key, value));
                }
            )
        } else {
            var map = new Map<T, Tree<T>>()
            map.set(this.value, this);
        }
        return map;
    }
}

export type OptionFn<T extends ISelectable> = (selection?: T) => InputOptions<T>;

export type IncrementFn<T extends ISelectable> = (selection?: Stack<T>) => InputOptions<T>;

export type TerminationFn<T extends ISelectable> = (selection?: Stack<T>) => boolean;

export function bfs<T extends ISelectable>(
    root_stack: Stack<T>, 
    increment_fn: IncrementFn<T>, 
    termination_fn: TerminationFn<T>
): Tree<T> {
    var preview_tree = Tree.from_stack<T>(root_stack);
    var explored = new Set<T>();
    var to_explore = new Array<Tree<T>>(preview_tree);
    while (to_explore.length > 0) {
        var exploring = to_explore.shift();
        if (!termination_fn(exploring)){
            var candidates = increment_fn(exploring);
            var filtered_candidates = candidates.filter(
                (candidate) => !(explored.has(candidate))
            );
            filtered_candidates.forEach(
                (candidate) => {
                    var candidate_tree = exploring.add_child(new Tree(candidate));
                    to_explore.push(candidate_tree);
                }
            )
        }
        explored.add(exploring.value);
    }
    return preview_tree;
}