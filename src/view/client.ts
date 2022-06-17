/* Imports */
import { makeCanvas } from "./rendering";
import { TacticsController, TacticsPhase } from "../tactics/tactics_controller";
import { tactics_setup } from "../tactics/tactics_setup";
import { display_setup } from "../tactics/tactics_display_setup";
import { Canvas2DBroker } from "./broker";
import { DisplayHandler } from "./display_handler";
import { playground_setup } from "../playground/playground_model_setup";
import { playground_display_setup } from "../playground/playground_display_setup";
import { PlaygroundController, PlaygroundPhase } from "../playground/playground";

export const TICK_DURATION_MS = 20

enum GameType {
    Tactics = 0,
    Playground = 1,
}

// const game_type = GameType.Tactics;
const game_type = GameType.Playground;

// @ts-ignore - just a switch
if (game_type == GameType.Tactics) {
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
    var tick = setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);
    var tc = new TacticsController(state);

    // Start main game loop
    tc.run(tp, input_request, display_handler);
} else if (game_type == GameType.Playground) {
    // State Setup
    var k = 8;
    var pg_state = playground_setup(k)

    // Create Canvas
    const size = 100;
    const canvas = makeCanvas(k * 100, k * size, true);
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

}
