/* Imports */
import { makeCanvas } from "./rendering";
import { DisplayHitListener, DisplayMap, SelectionBroker, setup_selection_broker } from "./input";
import { GridLocation, GridSpace } from "../model/space";
import { AbstractDisplay, GridLocationDisplay } from "./display";
import { ISelectable, Stack } from "../model/core";
import { async_input_getter } from "../model/input";
import { Action, BoardState, Effect } from "../model/state";
import { refreshDisplay } from "../game/shared";
import { PathOnlyDisplayHander, PathOnlyPhase, path_only_input_bridge } from "../game/path_only";
import { TacticsDisplayHander, TacticsPhase, tactics_input_bridge } from "../game/tactics";
import { CONSTRUCT_BASIC_ACTIONS, Unit } from "../model/unit";

/* Generic setup */
const k = 4;
const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");
const grid_space = new GridSpace(k, k);


// narrowed from ISelectable to GridLocation
var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();
var loc_listeners = new Array<DisplayHitListener<ISelectable>>();

for (let grid_row of grid_space.locs) {
    for (let grid_loc of grid_row) {
        let grid_display = new GridLocationDisplay(grid_loc);
        display_map.set(grid_loc, grid_display);
        grid_display.display(context);
    }
}

for (let grid_row of grid_space.locs) {
    for (let grid_loc of grid_row) {
        let grid_display = display_map.get(grid_loc);
        loc_listeners.push(grid_display.createPreviewListener(context.canvas));
        loc_listeners.push(grid_display.createClickListener(context.canvas));
    }
}

var selection_broker = new SelectionBroker<ISelectable>(loc_listeners);
// TODO: Error with unset handlers - dummies for now.
selection_broker.setPromiseHandlers(()=>{}, ()=>{});

function addCanvasListeners(
    context: CanvasRenderingContext2D, 
    display_map: DisplayMap<ISelectable>,
    grid_space: GridSpace, 
    unit?: Array<Unit> | null,
) {
    context.canvas.onclick = function (event) {
        selection_broker.onclick(event);
        refreshDisplay(context, display_map, grid_space);
    }
    context.canvas.onmousemove = function (event) {
        selection_broker.onmousemove(event);
        refreshDisplay(context, display_map, grid_space);
    }
}

var brokered_selection_fn = setup_selection_broker(selection_broker, display_map, canvas);
var input_request = async_input_getter(brokered_selection_fn);

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

// // --- Path-only ---
var root_stack = new Stack<GridLocation>(grid_space.get(0, 0));
var action = new Action(increment_fn, termination_fn, digest_fn);
// addCanvasListeners(context, display_map, grid_space);
// var pop = new PathOnlyPhase();
// var display_handler = new PathOnlyDisplayHander(context, grid_space, display_map);
// path_only_input_bridge(pop, action, root_stack, [input_request], display_handler);

// Tactics
var unit = new Unit(0);
unit.setActions(CONSTRUCT_BASIC_ACTIONS(unit, grid_space));
var board_state = new BoardState();
board_state.grid = grid_space;
board_state.units = units;
var units = [unit];
addCanvasListeners(context, display_map, grid_space, units);
var pop = new TacticsPhase();
var display_handler = new TacticsDisplayHander(context, display_map, board_state);
// tactics_input_bridge(pop, action, root_stack, [input_request], display_handler);
