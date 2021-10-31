import { 
    ISelectable, 
    Stack,
    Tree,
} from "./core";

export type InputRequest = (preview_tree: Tree<ISelectable>) => Promise<Stack<ISelectable>>;

async function get_input(preview_tree: Tree<ISelectable>): Promise<Stack<ISelectable>> {
    // return new Promise(new Stack<ISelectable>(null));
    return null;
};