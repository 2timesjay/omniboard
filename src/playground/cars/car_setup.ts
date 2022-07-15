import { ThreeBroker } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { DisplayHandler3D } from "../../view/display_handler_three";
import { View3D } from "../../view/rendering_three";
import { PlaygroundPhase, PlaygroundController } from "../playground_controller";
import { playground_display_setup_3D } from "../playground_display_setup";
import { playground_setup } from "../playground_model_setup";
import { car_display_setup } from "./car_display_setup";

export function car_setup() {
    // State Setup
    var k = 4;
    var d = 3;
    var pg_state = playground_setup(k, d)
    
    // Create Canvas
    const size = 100
    const view = new View3D(k* size, k* size)
    
    // Create Displays
    var three_display_map = car_display_setup(pg_state, view);
    
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

    
    var alsothree_display_handler = new DisplayHandler3D(view, three_display_map, pg_state);
    pg_c.run(pg_p, input_request, alsothree_display_handler);


}