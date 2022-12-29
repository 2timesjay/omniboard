import { ISelectable } from "../../model/core";
import { Entity, Glement } from "../../common/entity";
import { InputRequest } from "../../model/input";
import { GridLocation, ILocation } from "../../model/space";
import { VolumeSpace } from "../../common/space";
import { DisplayMap, ThreeBroker } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { AbstractDisplay, EntityDisplay3D, GridLocationDisplay3D } from "../../view/display";
import { DisplayHandler, SmartDisplayHandler } from "../../view/display_handler";
import { DisplayHandler3D } from "../../view/display_handler_three";
import { View3D } from "../../view/rendering_three";
import { EditorController, EditorPhase } from "./editor_controller";
import { EditorState } from "./editor_state";


function editor_state_setup(k: number): EditorState {
    var state = new EditorState();

    // Space Setup
    const grid_space = new VolumeSpace(k, k, 3);
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

    // // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    // var display_map = setup_display_map(state, view);

    // var display_handler = new DisplayHandler3D(view, display_map, state);
    var display_handler = new SmartDisplayHandler(view, state, display_builder);
    var broker = new ThreeBroker(display_handler, view);
    // Connect View (display) interactions with state through Broker
    
    // NOTE: Only one display
    var input_request = broker.input_request;
    // TODO: Add NullInputRequest to prevent error messages if I need a ReadOnlyBroker???

    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);
    return [display_handler, input_request];
}

function space_builder(loc: GridLocation): AbstractDisplay<GridLocation> {
    return new GridLocationDisplay3D(loc);
}

function glement_builder(glement: Glement): AbstractDisplay<ISelectable> {
    switch (glement.indicator) { // TODO: Should I use type guard pattern?
        case "Entity":
            return new EntityDisplay3D(glement as Entity);
        default:
            throw new Error("Invalid glement type");
    }
}

function display_builder(glement: ISelectable): AbstractDisplay<ISelectable> {
    if (glement instanceof GridLocation) {
        return new GridLocationDisplay3D(glement);
    }
    else if (glement instanceof Glement) {
        return new EntityDisplay3D(glement);
    }
    else {
        throw new Error("Invalid selectable type");
    }
}

export function editor_setup() {
    // State Setup
    var k = 4;
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
