/* Imports */
import { makeCanvas } from "./rendering";
import { TacticsController, TacticsPhase } from "../tactics/tactics_controller";
import { tactics_setup } from "../tactics/tactics_setup";
import { display_setup } from "../tactics/tactics_display_setup";
import { Canvas2DBroker } from "./broker";
import { DisplayHandler } from "./display_handler";
import { playground_setup } from "../playground/playground_model_setup";
import { playground_display_setup, playground_display_setup_3D } from "../playground/playground_display_setup";
import { PlaygroundController, PlaygroundPhase } from "../playground/playground_controller";
import { View3D } from "./rendering_three";
import { DisplayHandler3D } from "./display_handler_three";
import { ThreeBroker } from "./broker_three";

export const TICK_DURATION_MS = 20

enum GameType {
    Tactics = 0,
    Playground2D = 1,
    Playground3D = 2,
}

// const game_type = GameType.Tactics;
const game_type = GameType.Playground3D;

// @ts-ignore - just a switch
if (game_type == GameType.Tactics) {
    // State Setup
    var k = 6;
    var state = tactics_setup(k)

    // Create Canvas
    const size = 100;
    const canvas = makeCanvas(k * size, k * size, true);
    const context = canvas.getContext("2d");

    // Create Displays
    var display_map = display_setup(state, context);

    // Connect View (display) interactions with state through Broker
    var broker = new Canvas2DBroker(display_map, state, context);
    var input_request = broker.input_request;

    // Create Controller
    var tp = new TacticsPhase();
    var display_handler = new DisplayHandler(context, display_map, state);
    var tick = setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);
    var tc = new TacticsController(state);

    // Start main game loop
    tc.run(tp, input_request, display_handler);
// @ts-ignore - just a switch
} else if (game_type == GameType.Playground2D) {
    // State Setup
    var k = 4;
    var d = 2;
    var pg_state = playground_setup(k, d)

    // Create Canvas
    const size = 100 * d;
    const canvas = makeCanvas(k * size, k * size, true);
    const context = canvas.getContext("2d");

    // Create Displays
    var display_map = playground_display_setup(pg_state, context);

    // Connect View (display) interactions with state through Broker
    var broker = new Canvas2DBroker(display_map, pg_state, context);
    var input_request = broker.input_request;

    // Create Controller
    var pg_p = new PlaygroundPhase();
    var display_handler = new DisplayHandler(context, display_map, pg_state);
    var tick = setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);
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
    const view = new View3D(k* size, k* size)

    // Create Displays
    var display_map = playground_display_setup_3D(pg_state, view);

    // Connect View (display) interactions with state through Broker
    var three_broker = new ThreeBroker(display_map, pg_state, view);
    var input_request = three_broker.input_request;

    // Create Controller
    var pg_p = new PlaygroundPhase();
    var three_display_handler = new DisplayHandler3D(view, display_map, pg_state);
    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(three_display_handler.on_tick.bind(three_display_handler), TICK_DURATION_MS);
    var pg_c = new PlaygroundController(pg_state);

    // Start main game loop
    // @ts-ignore
    pg_c.run(pg_p, input_request, three_display_handler);

}
