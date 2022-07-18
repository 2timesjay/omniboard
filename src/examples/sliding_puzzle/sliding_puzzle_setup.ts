import { ICoordinate } from "../../model/space";
import { Canvas2DBroker, DisplayMap } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { DisplayHandler } from "../../view/display_handler";
import { View2D } from "../../view/rendering";


function sliding_puzzle_state_setup(k: number, d: number): DisplayMap {
    throw new Error("Function not implemented.");
}

function sliding_puzzle_display_setup(
    state: SlidingPuzzleState, view: View2D,
): SlidingPuzzleState {
    throw new Error("Function not implemented.");
}

export function sliding_puzzle_setup() {
    // State Setup
    var k = 4;
    var d = 3;
    var pg_state = sliding_puzzle_state_setup(k, d)
    
    // Create Canvas
    const size = 100
    const view = new View2D(k * size, k * size)
    
    // Create Displays
    // NOTE: Shared displays and DisplayMap between views.
    var display_map = sliding_puzzle_display_setup(pg_state, view);
    
    // Connect View (display) interactions with state through Broker
    var display_handler = new DisplayHandler(view, display_map, pg_state);

    var broker = new Canvas2DBroker(display_handler, view);
    
    // NOTE: Only one display
    var input_request = broker.input_request;
    // TODO: Add NullInputRequest to prevent error messages if I need a ReadOnlyBroker???

    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);

    // Create Controller
    var phase = new SlidingPuzzlePhase();
    var controller = new SlidingPuzzleController(sp_state);
    
    // Start main game loop
    // @ts-ignore
    controller.run(phase, input_request, display_handler);
}
