/* Imports */
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { DisplayHitListener, DisplayMap, getMousePos, SelectionBroker, setup_selection_broker } from "./input";
import { GridLocation, GridSpace } from "../model/space";
import { AbstractDisplay, GridLocationDisplay } from "./display";
import { ISelectable } from "../model/core";
import { async_input_getter } from "../model/input";
import { Action } from "../model/state";

/* Generic setup */
const k = 4;
const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");
const grid_space = new GridSpace(k, k);


// narrowed from ISelectable to GridLocation
var display_map = new Map<GridLocation, GridLocationDisplay>();
var loc_listeners = new Array<DisplayHitListener<GridLocation>>();

for (let grid_row of grid_space.locs) {
    for (let grid_loc of grid_row) {
        var grid_display = new GridLocationDisplay(grid_loc);
        display_map.set(grid_loc, grid_display);
        grid_display.display(context);
    }
}

for (let grid_row of grid_space.locs) {
    for (let grid_loc of grid_row) {
        var grid_display = display_map.get(grid_loc);
        loc_listeners.push(grid_display.createPreviewListener(context.canvas));
        loc_listeners.push(grid_display.createClickListener(context.canvas));
    }
}

var selection_broker = new SelectionBroker<GridLocation>(loc_listeners);
// TODO: Error with unset handlers - dummies for now.
selection_broker.setPromiseHandlers(()=>{}, ()=>{});

function refreshDisplay(grid_space: GridSpace, display_map: DisplayMap<GridLocation>){
    for (let grid_row of grid_space.locs) {
        for (let grid_loc of grid_row) {
            var grid_display = display_map.get(grid_loc);
            grid_display.display(context);
        }
    }
}

function addCanvasListeners(
    context: CanvasRenderingContext2D, 
    grid_space: GridSpace, 
    display_map: DisplayMap<GridLocation>,
) {
    context.canvas.onclick = function (event) {
        selection_broker.onclick(event);
        refreshDisplay(grid_space, display_map);
    }
    context.canvas.onmousemove = function (event) {
        selection_broker.onmousemove(event);
        refreshDisplay(grid_space, display_map);
    }
}

addCanvasListeners(context, grid_space, display_map);


var callback_selection_fn = setup_selection_broker(selection_broker, display_map, canvas);
var input_request = async_input_getter(callback_selection_fn);

// TODO: Change below to free-standing move input
// var increment_fn = (grid: Stack<GridLocation>): Array<GridLocation> => {
//     var options = Array<SelectableNumber>();
//     var current_num = nums.value.value;
//     options.push(numbers[current_num+3]);
//     options.push(numbers[current_num+6]);
//     return options;
// };
// var termination_fn = (nums: Stack<SelectableNumber>): boolean => {
//     return nums.depth >= 4;
// }
// var digest_fn = (nums: Array<SelectableNumber>): Array<Effect<NumberState>> => {
//     function effect(state: NumberState): NumberState {
//         state.add(nums[0].value);
//         return state;
//     };
//     // Reconsider callable.
//     effect.description = null;
//     effect.pre_effect = null;
//     effect.post_effect = null;
//     return [effect];
// }
// var action = new Action(increment_fn, termination_fn, digest_fn);
// var input_promise = action.acquire_input(root_stack, input_request);