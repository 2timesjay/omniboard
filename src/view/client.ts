/* Imports */
import { makeCanvas } from "./rendering";
import { DisplayHitOnevent, DisplayMap, SelectionBroker, build_broker_callback } from "./input";
import { GridLocation, GridSpace } from "../model/space";
import { AbstractDisplay, GridLocationDisplay, UnitDisplay } from "./display";
import { ISelectable, Stack } from "../model/core";
import { async_input_getter, InputRequest } from "../model/input";
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

for (let grid_row of grid_space.locs) {
    for (let grid_loc of grid_row) {
        let grid_display = new GridLocationDisplay(grid_loc);
        display_map.set(grid_loc, grid_display);
        grid_display.display(context);
    }
}

var selection_broker = new SelectionBroker<ISelectable>();
// TODO: Error with unset handlers - dummies for now.
selection_broker.setPromiseHandlers(()=>{console.log("sres")}, ()=>{console.log("srej")});
var brokered_selection_fn = build_broker_callback(selection_broker, display_map, canvas);
var input_request = async_input_getter(brokered_selection_fn);

function addCanvasListeners(
    selection_broker: SelectionBroker<ISelectable>,
    context: CanvasRenderingContext2D, 
    display_map: DisplayMap<ISelectable>,
    grid_space: GridSpace, 
    unit?: Array<Unit> | null,
) {
    context.canvas.onclick = function (event) {
        selection_broker.onclick(event);
        refreshDisplay(context, display_map, grid_space, unit);
    }
    context.canvas.onmousemove = function (event) {
        selection_broker.onmousemove(event);
        refreshDisplay(context, display_map, grid_space, unit);
    }
}

// // --- Path-only ---
// var increment_fn = (loc_stack: Stack<GridLocation>): Array<GridLocation> => {
//     var options = grid_space.getGridNeighborhood(loc_stack.value);
//     return options;
// };
// var termination_fn = (loc_stack: Stack<GridLocation>): boolean => {
//     return loc_stack.depth >= 4;
// }
// var digest_fn = (nums: Array<GridLocation>): Array<Effect<BoardState>> => {
//     function effect(state: BoardState): BoardState {
//         return state;
//     };
//     // Reconsider callable.
//     effect.description = null;
//     effect.pre_effect = null;
//     effect.post_effect = null;
//     return [effect];
// }
// var root_stack = new Stack<GridLocation>(grid_space.get(0, 0));
// var action = new Action(increment_fn, termination_fn, digest_fn);
// addCanvasListeners(selection_broker, context, display_map, grid_space);
// var pop = new PathOnlyPhase();
// var display_handler = new PathOnlyDisplayHander(context, grid_space, display_map);
// path_only_input_bridge(pop, action, root_stack, [input_request], display_handler);

// Tactics
var unit = new Unit(0);
unit.setLoc(grid_space.get(0, 0));
unit.setActions(CONSTRUCT_BASIC_ACTIONS(unit, grid_space));
var units = [unit]
for (let unit of units) {
    let unit_display = new UnitDisplay(unit);
    display_map.set(unit, unit_display);
    unit_display.display(context);
}

var unit_selection_broker = new SelectionBroker<ISelectable>();
// TODO: Error with unset handlers - dummies for now.
unit_selection_broker.setPromiseHandlers(()=>{console.log("ures")}, ()=>{console.log("urej")});
var unit_brokered_selection_fn = build_broker_callback(unit_selection_broker, display_map, canvas);
// @ts-ignore
var unit_request: InputRequest<Unit> = input_request
// var unit_request: InputRequest<Unit> = async_input_getter(unit_brokered_selection_fn);
// @ts-ignore
var location_request: InputRequest<GridLocation> = input_request

// TODO: Before this will work must rework canvas onclick -> display onclick connection
var board_state = new BoardState();
board_state.grid = grid_space;
board_state.units = units;
var units = [unit];
addCanvasListeners(selection_broker, context, display_map, grid_space, units);
// addCanvasListeners(unit_selection_broker, context, display_map, grid_space, units);
var tp = new TacticsPhase();
var display_handler = new TacticsDisplayHander(context, display_map, board_state);
tactics_input_bridge(tp, board_state, [unit_request, null, location_request], display_handler);
