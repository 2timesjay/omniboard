/* Imports */
import { makeCanvas } from "./rendering";
import { TacticsController, TacticsPhase } from "../game/tactics_controller";
import { tactics_setup } from "../game/tactics_setup";
import { display_setup } from "../game/tactics_display_setup";
import { Canvas2DBroker } from "./broker";
import { DisplayHandler } from "./display_handler";

// State Setup
var k = 6;
var state = tactics_setup(k)

// Create Canvas
const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");

// Create Displays
var display_map = display_setup(state, context);

// Connect View (display) interactions with state through Broker
var broker = new Canvas2DBroker(display_map, state, context);
var input_request = broker.input_request;

// Create Controller
var tp = new TacticsPhase();
var display_handler = new DisplayHandler(context, display_map, state);
var tick = setInterval(display_handler.on_tick.bind(display_handler), 10);
var tc = new TacticsController(state);

// Start main game loop
tc.run(tp, input_request, display_handler);
