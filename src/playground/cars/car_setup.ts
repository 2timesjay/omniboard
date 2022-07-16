import { Canvas2DBroker, ThreeBroker } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { DisplayHandler } from "../../view/display_handler";
import { DisplayHandler3D } from "../../view/display_handler_three";
import { View2DHudReadOnly } from "../../view/hud_rendering";
import { View3D } from "../../view/rendering_three";
import { PlaygroundPhase, PlaygroundController } from "../playground_controller";
import { playground_display_setup_3D } from "../playground_display_setup";
import { playground_setup } from "../playground_model_setup";
import { car_display_setup, car_hud_display_setup } from "./car_display_setup";

export function car_setup() {
    // State Setup
    var k = 4;
    var d = 3;
    var pg_state = playground_setup(k, d)
    
    // Create Canvas
    const size = 100
    const view = new View3D(k * size, k * size)
    const dupe_view = new View3D(k * size, k * size)
    const hud_view = new View2DHudReadOnly(k, size)
    
    // Create Displays
    // NOTE: Shared displays and DisplayMap between views.
    var three_display_map = car_display_setup(pg_state, view);
    var hud_display_map = car_hud_display_setup(pg_state, hud_view);
    
    // Connect View (display) interactions with state through Broker
    var three_display_handler = new DisplayHandler3D(view, three_display_map, pg_state);
    var dupe_three_display_handler = new DisplayHandler3D(dupe_view, three_display_map, pg_state);
    var hud_display_handler = new DisplayHandler(hud_view, hud_display_map, pg_state);

    var three_broker = new ThreeBroker(three_display_handler, view);
    
    // NOTE: Only one display
    var input_request = three_broker.input_request;
    // TODO: Add NullInputRequest to prevent error messages if I need a ReadOnlyBroker???

    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(three_display_handler.on_tick.bind(three_display_handler), TICK_DURATION_MS);
    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(dupe_three_display_handler.on_tick.bind(dupe_three_display_handler), TICK_DURATION_MS);
    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(hud_display_handler.on_tick.bind(hud_display_handler), TICK_DURATION_MS);
    
    // Create Controller
    var pg_p = new PlaygroundPhase();
    var pg_c = new PlaygroundController(pg_state);
    
    // Start main game loop
    // @ts-ignore
    pg_c.run(pg_p, input_request, three_display_handler);
    pg_c.run(pg_p, input_request, dupe_three_display_handler);
}