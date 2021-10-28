export interface T {}

export class Stack<T> {
    value: T;
    parent: Stack<T> | null;
    
    constructor(value: T, parent: Stack<T>) {
        this.value = value;
        this.parent = parent;
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

// export class Deque<T> {
//     value: T;
//     middle: Deque<T>;
//     bottom: T;
// }

export class Tree<T> {
    value: T;
    parent: Tree<T> | null;
    children: Array<Tree<T>> | null;

    constructor(value: T, parent?: Tree<T>, children?: Array<Tree<T>>){
        this.value = value;
        if (parent) {
            this.parent = parent;
        } else {
            this.parent = null;
        }

        if (children) {
            this.children = children;
        } else {
            this.children = null;
        }
    }
}

export class PreviewMap<T> {
    // A Map<T, Stack<T>>
    constructor(tree: Tree<T>) {

    }
}