import { 
    ISelectable, 
    Stack,
    Tree,
} from "./core";

// Should this be Stack instead of Tree (and everywhere similar?)
// Should this be a generator???
export type InputRequest<T extends ISelectable> = (preview_map: Map<T, Tree<T>>) => Promise<Stack<T>>;

// Readline Input
// See https://stackoverflow.com/questions/8128578/reading-value-from-console-interactively
// And https://stackoverflow.com/questions/33858763/console-input-in-typescript/49055758 
export async function stdin_input_getter(
    preview_map: Map<ISelectable, Tree<ISelectable>>
): Promise<Stack<ISelectable>> {
    var stdin = process.openStdin();

    var options_map = new Map(
        Array.from(preview_map.keys()).map(
            (value: ISelectable, index: number) => {return [index, value];}
        )
    );

    stdin.addListener("data", function(d) {
        // note:  d is an object, and when converted to a string it will
        // end with a linefeed.  so we (rather crudely) account for that  
        // with toString() and then trim() 
        var choice = options_map.get(parseInt(d.toString()))
        console.log("You chose: ", choice)
    });
    return null;
};

// Suspicious function. TODO: Clean up.
// Build a generator a la https://whistlr.info/2020/async-generators-input/ ?
// function build_input_getter(preview_map: Map<ISelectable, Tree<ISelectable>>, sequence: Array<ISelectable>): InputRequest {
//     return async function get_input(
//         preview_map: Map<ISelectable, Tree<ISelectable>>
//     ): Promise<Stack<ISelectable>> {
//         return input_getter(preview_map);
//     };
// }