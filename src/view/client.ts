/* Imports */
import { makeCanvas } from "./rendering";
import { DisplayHitOnevent, DisplayMap, SelectionBroker, build_broker_callback } from "./input";
import { GridLocation, GridSpace } from "../model/space";
import { AbstractDisplay, GridLocationDisplay, MenuElementDisplay, UnitDisplay } from "./display";
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
    state: BoardState,
) {
    context.canvas.onclick = function (event) {
        selection_broker.onclick(event);
        refreshDisplay(context, display_map, state);
    }
    context.canvas.onmousemove = function (event) {
        selection_broker.onmousemove(event);
        refreshDisplay(context, display_map, state);
    }
}

// Tactics
var unit = new Unit(0);
unit.setLoc(grid_space.get(1, 0));
unit.setActions(CONSTRUCT_BASIC_ACTIONS(unit, grid_space));
var units = [unit]
for (let unit of units) {
    let unit_display = new UnitDisplay(unit);
    for (let action of unit.actions) {
        let action_display = new MenuElementDisplay(action, unit_display)
        display_map.set(action, action_display);
        action_display.display(context);
    }
    display_map.set(unit, unit_display);
    unit_display.display(context);
}

// TODO: Before this will work must rework canvas onclick -> display onclick connection
var board_state = new BoardState();
board_state.grid = grid_space;
board_state.units = units;
addCanvasListeners(selection_broker, context, display_map, board_state);
// addCanvasListeners(unit_selection_broker, context, display_map, grid_space, units);
var tp = new TacticsPhase();
var display_handler = new TacticsDisplayHander(context, display_map, board_state);
tactics_input_bridge(tp, board_state, input_request, display_handler);
