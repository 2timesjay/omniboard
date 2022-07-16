/* Imports */
import { makeCanvas, View2D, View2DPseudoZ } from "./rendering";
import { TacticsController, TacticsPhase } from "../tactics/tactics_controller";
import { tactics_setup } from "../tactics/tactics_setup";
import { display_setup } from "../tactics/tactics_display_setup";
import { DisplayHandler } from "./display_handler";
import { playground_setup } from "../playground/playground_model_setup";
import { playground_display_setup, playground_display_setup_3D } from "../playground/playground_display_setup";
import { PlaygroundController, PlaygroundPhase } from "../playground/playground_controller";
import { View3D } from "./rendering_three";
import { DisplayHandler3D } from "./display_handler_three";
import { Canvas2DBroker, ThreeBroker } from "./broker";
import { car_setup } from "../playground/cars/car_setup";

export const TICK_DURATION_MS = 20

enum GameType {
    Tactics = 0,
    Playground2D = 1,
    Playground3D = 2,
    Cars3D = 3,
}

var game_type = (
    // GameType.Tactics
    // GameType.Playground2D
    // GameType.Playground3D
    GameType.Cars3D
)
// Dummy code to avoid type errors in switch check.
if (Math.random() > 1) {
    game_type += 1;
}

if (game_type == GameType.Tactics) {
    // State Setup
    var k = 6;
    var state = tactics_setup(k)

    // Create Canvas
    const size = 100;
    const view =  new View2D(k, size)

    // Create Displays
    var display_map = display_setup(state, view);

    // Connect View (display) interactions with state through Broker
    var display_handler = new DisplayHandler(view, display_map, state);
    var broker = new Canvas2DBroker(display_handler, view);
    var input_request = broker.input_request;
    var tick = setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);

    // Create Controller
    var tp = new TacticsPhase();
    var tc = new TacticsController(state);

    // Start main game loop
    tc.run(tp, input_request, display_handler);
// @ts-ignore - just a switch
} else if (game_type == GameType.Playground2D) {
    // State Setup
    var k = 4;
    var d = 3;
    var pg_state = playground_setup(k, d)

    // Create Canvas
    const size = 100;
    // const context = canvas.getContext("2d");
    const view = new View2DPseudoZ(k, size, {depth: 3})

    // Create Displays
    var display_map = playground_display_setup(pg_state, view);

    // Connect View (display) interactions with state through Broker
    var display_handler = new DisplayHandler(view, display_map, pg_state);
    var broker = new Canvas2DBroker(display_handler, view);
    var input_request = broker.input_request;
    var tick = setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);

    // Create Controller
    var pg_p = new PlaygroundPhase();
    var pg_c = new PlaygroundController(pg_state);

    // Start main game loop
    pg_c.run(pg_p, input_request, display_handler);

} else if (game_type == GameType.Playground3D) {
    // State Setup
    var k = 4;
    var d = 3;
    var pg_state = playground_setup(k, d)

    // Create Canvas
    const size = 100
    // TODO: Discrepancy in view size inputs between 3d and 2d; blocks vs pixels.
    const view = new View3D(k* size, k* size)

    // Create Displays
    var three_display_map = playground_display_setup_3D(pg_state, view);

    // Connect View (display) interactions with state through Broker
    var three_display_handler = new DisplayHandler3D(view, three_display_map, pg_state);
    var three_broker = new ThreeBroker(three_display_handler, view);
    var input_request = three_broker.input_request;
    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(three_display_handler.on_tick.bind(three_display_handler), TICK_DURATION_MS);

    // Create Controller
    var pg_p = new PlaygroundPhase();
    var pg_c = new PlaygroundController(pg_state);

    // Start main game loop
    // @ts-ignore
    pg_c.run(pg_p, input_request, three_display_handler);
} else if (game_type == GameType.Cars3D) {
    car_setup();
}
