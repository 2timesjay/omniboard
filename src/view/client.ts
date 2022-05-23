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
import { TacticsController, TacticsDisplayHander, TacticsPhase } from "../game/tactics";
import { CONSTRUCT_BASIC_ACTIONS, GLOBAL_CONFIRMATION, Unit } from "../model/unit";

/* Generic setup */
const k = 6;
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

// Tactics State setup
var state = new BoardState();
state.grid = grid_space;
var unit_1 = new Unit(0);
unit_1.setLoc(grid_space.get(3, 2));
var unit_2 = new Unit(1);
unit_2.setLoc(grid_space.get(2,2));
var unit_3 = new Unit(0);
unit_3.setLoc(grid_space.get(2, 3));
var units = [unit_1, unit_2, unit_3];
state.units = units;

// TODO: Safer Laziness in action construction
for (let unit of units) {
    unit.setActions(CONSTRUCT_BASIC_ACTIONS(unit, state));
    let unit_display = new UnitDisplay(unit);
    for (let action of unit.actions) {
        let action_display = new MenuElementDisplay(action, unit_display)
        display_map.set(action, action_display);
        action_display.display(context);
    }
    display_map.set(unit, unit_display);
    unit_display.display(context);
}
let global_confirmation_display = new MenuElementDisplay(
    GLOBAL_CONFIRMATION, 
    // @ts-ignore doesn't know this is an ILocatableDisplay
    // TODO: Replace with some kind of "invisible pin" display.
    display_map.get(grid_space.get(1,1)), 
)
display_map.set(GLOBAL_CONFIRMATION, global_confirmation_display);

state.confirmation = GLOBAL_CONFIRMATION;

// TODO: Before this will work must rework canvas onclick -> display onclick connection
addCanvasListeners(selection_broker, context, display_map, state);
// addCanvasListeners(unit_selection_broker, context, display_map, grid_space, units);
var tp = new TacticsPhase();
var display_handler = new TacticsDisplayHander(context, display_map, state);
var tc = new TacticsController(state);
tc.tactics_input_bridge(tp, input_request, display_handler);
