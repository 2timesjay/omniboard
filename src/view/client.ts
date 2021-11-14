/* Imports */
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { DisplayHitListener, DisplayMap, getMousePos, SelectionBroker, setup_selection_broker } from "./input";
import { GridLocation, GridSpace } from "../model/space";
import { AbstractDisplay, DisplayState, GridLocationDisplay } from "./display";
import { ISelectable, Stack } from "../model/core";
import { async_input_getter } from "../model/input";
import { Action, BoardState, Effect } from "../model/state";

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
var increment_fn = (loc_stack: Stack<GridLocation>): Array<GridLocation> => {
    var options = grid_space.getGridNeighborhood(loc_stack.value);
    return options;
};
var termination_fn = (loc_stack: Stack<GridLocation>): boolean => {
    return loc_stack.depth >= 4;
}
var digest_fn = (nums: Array<GridLocation>): Array<Effect<BoardState>> => {
    function effect(state: BoardState): BoardState {
        return state;
    };
    // Reconsider callable.
    effect.description = null;
    effect.pre_effect = null;
    effect.post_effect = null;
    return [effect];
}
var root_stack = new Stack<GridLocation>(grid_space.get(0, 0));
var action = new Action(increment_fn, termination_fn, digest_fn);
var input_gen = action.acquire_input_gen(root_stack, input_request);
// TODO: Further Improve DisplayState handling (need "filter" or state machine for states).
(async function () {
    var prev_stack;
    for await (var input of input_gen) {
        console.log("input promise result: ", input);
        var stack = input;
        // Erase old selection_state;
        if(prev_stack) {
            do {
                var loc = prev_stack.value;
                var display = display_map.get(loc);
                display.selection_state = DisplayState.Neutral;
                prev_stack = prev_stack.parent;
            } while(prev_stack);
        }
        prev_stack = stack;
        // Add new selection_state;
        do {
            var loc = stack.value;
            var display = display_map.get(loc);
            display.selection_state = DisplayState.Queue;
            stack = stack.parent;
        } while(stack);
        refreshDisplay(grid_space, display_map);
    }
})();