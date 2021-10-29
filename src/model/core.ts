import { IScriptSnapshot } from "typescript";

export interface ISelectable {}

type Options = Array<ISelectable>;

export class Stack<T> {
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

    push(sel: T): Stack<T> {
        return new Stack<T>(sel, this);
    }

    peek(): T {
        return this.value;
    }

    pop(): Stack<T> {
        return this.parent;
    }

    as_array(): Array<T> {
        var arr = Array<T>();
        var value = this.value;
        arr.push(value);
        var parent = this.parent;
        while(parent != null){
            value = parent.value;
            arr.push(value);
            parent = parent.parent;
        }
        return arr;
    }
}

export class Tree<T> extends Stack<T> {
    value: T;
    parent: Tree<T> | null;
    children: Array<Tree<T>> | null;
    depth: number;

    constructor(value: T, parent?: Tree<T>, children?: Array<Tree<T>>){
        super(value, parent);
        if (children) {
            this.children = children;
        } else {
            this.children = null;
        }
    }

    add_child(child: T): Tree<T> {
        var child_tree = new Tree<T>(child, this);
        if (this.children) {
            this.children.push(child_tree);
        }
        else {
            this.children = new Array<Tree<T>>(child_tree);
        }
        return child_tree;
    }

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

type IncrementFn = (stack: Stack<ISelectable>) => Options;

type TerminationFn = (stack: Stack<ISelectable>) => boolean;

export function bfs(
    root: ISelectable, 
    increment_fn: IncrementFn, 
    termination_fn: TerminationFn
): Tree<ISelectable> {
    var preview_map = new Tree<ISelectable>(root); 
    var explored = new Set<ISelectable>();
    var to_explore = new Array<Tree<ISelectable>>(preview_map);
    while (to_explore.length > 0) {
        var exploring = to_explore.shift();
        if (!termination_fn(exploring)){
            var candidates = increment_fn(exploring);
            var filtered_candidates = candidates.filter(
                (candidate) => !(explored.has(candidate))
            );
            filtered_candidates.forEach(
                (candidate) => {
                    var candidate_tree = exploring.add_child(candidate);
                    to_explore.push(candidate_tree);
                }
            )
        }
        explored.add(exploring.value);
    }
    return preview_map;
}