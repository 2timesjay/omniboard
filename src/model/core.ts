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

    to_array(): Array<T> {
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

    static from_stack<U>(stack: Stack<U>): Tree<U> {
        var tree = new Tree<U>(stack.value);
        var tree_root = tree;
        while (stack.parent) {
            stack = stack.parent;
            tree_root = tree_root.add_parent(stack.parent.value);
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

    add_parent(parent: T): Tree<T> {
        var parent_tree = new Tree<T>(parent, this);
        this.parent = parent_tree;
        parent_tree.children = [this];
        return parent_tree;
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

export type IncrementFn = (stack: Stack<ISelectable>) => Options;

export type TerminationFn = (stack: Stack<ISelectable>) => boolean;

export function bfs(
    root_stack: Stack<ISelectable>, 
    increment_fn: IncrementFn, 
    termination_fn: TerminationFn
): Tree<ISelectable> {
    var preview_tree = Tree.from_stack<ISelectable>(root_stack); 
    var explored = new Set<ISelectable>();
    var to_explore = new Array<Tree<ISelectable>>(preview_tree);
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
    return preview_tree;
}