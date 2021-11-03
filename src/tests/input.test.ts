import * as test from "tape";
import { Stack, Tree } from "../model/core";
import {InputRequest, CallbackSelectionFn, async_input_getter, SelectionFn} from "../model/input";
import { Awaited } from "../model/utilities";
import {SelectableNumber} from "./integration.test"

test("async_input_getter test", (t) => {
    var options = new Array<SelectableNumber>();
    var input_selector = () => {};
    var callback_selection_fn = (arr: Array<SelectableNumber>, resolve: Awaited<SelectableNumber>) => {
        var sel = arr[0];
        input_selector = () => resolve(sel); //throw arr in a closure instead?
    };
    var input_request = async_input_getter(callback_selection_fn)
    var sel_num = new SelectableNumber(10);
    var input_promise = input_request(new Map([[sel_num, new Tree(sel_num)]]))
    input_promise.then((sel) => {
        t.equal(sel.value, sel_num);
        t.end();
    })
    input_selector();
})

// test("Stdin input test", (t) => {
//     var stdin = process.openStdin();

//     var options_map = new Map(
//         Array.from(preview_map.keys()).map(
//             (value: ISelectable, index: number) => {return [index, value];}
//         )
//     );

//     stdin.addListener("data", function(d) {
//         // note:  d is an object, and when converted to a string it will
//         // end with a linefeed.  so we (rather crudely) account for that  
//         // with toString() and then trim() 
//         var choice = options_map.get(parseInt(d.toString()))
//         console.log("You chose: ", choice)
//     });

//     var input = input_promise.then(
//         function(input) {
//             // console.log(input.to_array());
//             var effects = digest_fn(input.to_array())
//             t.equal(effects.length, 1);
//             var transformed_state = effects[0](number_state);
//             t.equal(transformed_state.value, 31);
//             // console.log(input_promise);
//             t.end();
//         }
//     );
// })



