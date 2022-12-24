import { ISelectable } from "../../model/core";
import { Entity } from "../../model/entity";
import { InputRequest } from "../../model/input";
import { GridSpace, ICoordinate } from "../../model/space";
import { VolumeSpace } from "../../playground/playground_space";
import { Canvas2DBroker, DisplayMap, ThreeBroker } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { AbstractDisplay, AbstractDisplay3D, EntityDisplay, EntityDisplay3D, GridLocationDisplay3D, MenuElementDisplay3D } from "../../view/display";
import { BaseDisplayHandler, DisplayHandler } from "../../view/display_handler";
import { DisplayHandler3D } from "../../view/display_handler_three";
import { View2D } from "../../view/rendering";
import { IView3D, View3D } from "../../view/rendering_three";
import { EditorController, EditorPhase } from "./editor_controller";
import { EditorState } from "./editor_state";


function editor_state_setup(k: number): EditorState {
    var state = new EditorState();

    // Space Setup
    const grid_space = new VolumeSpace(k, k, 2);
    for (var loc of grid_space.to_array()) {
        if (loc.co.z > 0) { loc.traversable = false}
    }
    var entities: Array<Entity> = [];

    // State Setup
    // TODO: Construct state with space and entities instead of later assignment.
    state.space = grid_space;
    state.entities = entities;

    return state
}

// TODO: Turn into generic "display setup"
/**
 * Create Display elements for every selectable in state, create view and broker.
 */
 export function editor_display_setup_3D(
    state: EditorState, view: View3D,
): [DisplayHandler, InputRequest<ISelectable>] {

    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay3D<ISelectable>>();

    for (let loc of state.space.to_array()) {
        // @ts-ignore Actually a GridLocation in this case.
        let loc_display = new GridLocationDisplay3D(loc);
        // @ts-ignore fix Display3D inheritance
        display_map.set(loc, loc_display);
        // @ts-ignore
        loc_display.display(view);
    }

    for (let [index, entity] of state.entities.entries()) {
        if (index == 0) {
            console.log("Adding Player")
            // @ts-ignore
            let player_display = new PlayerDisplay(entity);
            // @ts-ignore
            display_map.set(entity, player_display);
            // @ts-ignore
            player_display.display(view);
        }
        else {
            console.log("Adding Box")
            // @ts-ignore
            let box_display = new BoxDisplay(entity);
            // @ts-ignore
            display_map.set(entity, box_display);
            // @ts-ignore
            box_display.display(view);
        }
    }

    var display_handler = new DisplayHandler3D(view, display_map, state);
    var broker = new ThreeBroker(display_handler, view);
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
    var k = 4;
    var state = editor_state_setup(k)
    
    // Create Canvas
    const size = 100
    const view = new View3D(k*size, k*size);
    
    // TODO: Avoid unwieldy super-"then"; maybe make setup async?
    // Create Displays
    // NOTE: Shared displays and DisplayMap between views.
    var [display_handler, input_request] = editor_display_setup_3D(state, view);
    // Create Controller
    var editor_phase = new EditorPhase(state);
    var controller = new EditorController(state);
    
    // Start main game loop
    // @ts-ignore
    controller.run(editor_phase, input_request, display_handler);
}
