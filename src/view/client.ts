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
import { tactics_setup } from "../game/tactics_setup";
import { display_setup } from "../game/tactics_display_setup";

// State Setup
var k = 6;
var state = tactics_setup(k)

const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");

var display_map = display_setup(k, state, context);


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

// TODO: Before this will work must rework canvas onclick -> display onclick connection
addCanvasListeners(selection_broker, context, display_map, state);
// addCanvasListeners(unit_selection_broker, context, display_map, grid, units);


var tp = new TacticsPhase();
var display_handler = new TacticsDisplayHander(context, display_map, state);
var tc = new TacticsController(state);
tc.tactics_input_bridge(tp, input_request, display_handler);
