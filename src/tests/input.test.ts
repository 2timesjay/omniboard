import * as test from "tape";
import {InputRequest} from "../model/input";



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



