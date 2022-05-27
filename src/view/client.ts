/* Imports */
import { makeCanvas } from "./rendering";
import { TacticsController, TacticsPhase } from "../game/tactics";
import { tactics_setup } from "../game/tactics_setup";
import { display_setup } from "../game/tactics_display_setup";
import { Canvas2DBroker } from "./broker";
import { DisplayHandler } from "./display_handler";

// State Setup
var k = 6;
var state = tactics_setup(k)

const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");

var display_map = display_setup(k, state, context);

var broker = new Canvas2DBroker(display_map, state, context);
var input_request = broker.input_request;

var tp = new TacticsPhase();
var display_handler = new DisplayHandler(context, display_map, state);
var tc = new TacticsController(state);
tc.tactics_input_bridge(tp, input_request, display_handler);
