import { ISelectable } from "../../model/core";
import { Entity } from "../../common/entity";
import { InputRequest } from "../../model/input";
import { VolumeSpace } from "../../common/space";
import { Broker, DisplayDim } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { DisplayHandler } from "../../view/display_handler";
import { View3D } from "../../view/rendering_three";
import { EditorController, EditorPhase } from "./editor_controller";
import { EditorState } from "./editor_state";
import { canvas_display_builder, palette_display_builder, EditorDisplayHandler, EditorMenuDisplayHandler } from "./editor_display";
import { EditorSelectionBroker } from "./editor_broker";
import { View2D } from "../../view/rendering";


// TODO: Don't export
export function editor_state_setup(k: number): EditorState {
    var state = new EditorState();

    // Space Setup
    const grid_space = new VolumeSpace(k, k, k/2);
    for (var loc of grid_space.to_array()) {
        if (loc.co.z > 0) { loc.traversable = false}
    }
    var entities: Array<Entity> = [];

    // State Setup
    // TODO: Construct state with space and entities instead of later assignment.
    state.space = grid_space;
    state.glements = entities;

    return state;
}

// TODO: Turn into generic "display setup"
/**
 * Create Display glements for every selectable in state, create view and broker.
 */
 export function editor_display_setup(
    state: EditorState, view: View3D,
): [DisplayHandler, InputRequest<ISelectable>] {
    var display_handler = new EditorDisplayHandler(view, state, canvas_display_builder);
    var broker = new Broker(display_handler, view, DisplayDim.Three, EditorSelectionBroker);
    // Connect View (display) interactions with state through Broker
    
    // NOTE: Only one display
    var input_request = broker.input_request;
    // TODO: Add NullInputRequest to prevent error messages if I need a ReadOnlyBroker???

    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);
    return [display_handler, input_request];
}

export function editor_menu_display_setup(
    state: EditorState, view: View2D,
): [DisplayHandler, InputRequest<ISelectable>] {
    var display_handler = new EditorMenuDisplayHandler(view, state, palette_display_builder);
    var broker = new Broker(display_handler, view, DisplayDim.Two);
    // Connect View (display) interactions with state through Broker
    
    // NOTE: Only one display
    var input_request = broker.input_request;
    // TODO: Add NullInputRequest to prevent error messages if I need a ReadOnlyBroker???

    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);
    return [display_handler, input_request];
}

export function editor_setup(loaded_state?: EditorState) {
    // State Setup
    var k = 6;
    if (loaded_state) {
        var state = loaded_state;
    } else {
        var state = editor_state_setup(k)
    }
    
    // Create Canvas
    const size = 100
    const canvas_view = new View3D(k*size, k*size);

    const palette_view = new View2D(4, 100);
    
    // TODO: Avoid unwieldy super-"then"; maybe make setup async?
    // Create Displays
    // NOTE: Shared displays and DisplayMap between views.
    var [canvas_display_handler, canvas_input_request] = editor_display_setup(state, canvas_view);
    var [palette_display_handler, palette_input_request] = editor_menu_display_setup(state, palette_view);
    // Create Controller
    var editor_phase = new EditorPhase(state);
    var controller = new EditorController(state);
    
    // Start main game loop
    // @ts-ignore
    controller.run(
        editor_phase, 
        canvas_input_request,
        canvas_display_handler,
        palette_input_request,
        palette_display_handler,
    );
}
