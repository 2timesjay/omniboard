import { ISelectable } from "../../model/core";
import { Entity, Glement } from "../../common/entity";
import { InputRequest } from "../../model/input";
import { GridLocation, ILocation } from "../../model/space";
import { VolumeSpace } from "../../common/space";
import { DisplayMap, ThreeBroker } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { AbstractDisplay, EntityDisplay3D, GridLocationDisplay3D } from "../../view/display";
import { DisplayHandler, SmartDisplayHandler } from "../../view/display_handler";
import { View3D } from "../../view/rendering_three";
import { EditorController, EditorPhase } from "./editor_controller";
import { EditorState } from "./editor_state";
import { display_builder, EditorDisplayHandler } from "./editor_display";
import { EditorSelectionBroker } from "./editor_broker";


function editor_state_setup(k: number): EditorState {
    var state = new EditorState();

    // Space Setup
    const grid_space = new VolumeSpace(k, k, 4);
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
    var display_handler = new EditorDisplayHandler(view, state, display_builder);
    // @ts-ignore we know View is View3D
    var broker = new ThreeBroker(display_handler, view, EditorSelectionBroker);
    // Connect View (display) interactions with state through Broker
    
    // NOTE: Only one display
    var input_request = broker.input_request;
    // TODO: Add NullInputRequest to prevent error messages if I need a ReadOnlyBroker???

    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);
    return [display_handler, input_request];
}

export function editor_setup() {
    // State Setup
    var k = 8;
    var state = editor_state_setup(k)
    
    // Create Canvas
    const size = 100
    const view = new View3D(k*size, k*size);
    
    // TODO: Avoid unwieldy super-"then"; maybe make setup async?
    // Create Displays
    // NOTE: Shared displays and DisplayMap between views.
    var [display_handler, input_request] = editor_display_setup(state, view);
    // Create Controller
    var editor_phase = new EditorPhase(state);
    var controller = new EditorController(state);
    
    // Start main game loop
    // @ts-ignore
    controller.run(editor_phase, input_request, display_handler);
}
