import { ISelectable } from "../../model/core";
import { Entity } from "../../model/entity";
import { GridSpace, ICoordinate } from "../../model/space";
import { Canvas2DBroker, DisplayMap } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { AbstractDisplay, EntityDisplay, GridLocationDisplay } from "../../view/display";
import { DisplayHandler } from "../../view/display_handler";
import { View2D } from "../../view/rendering";
import { SlidingPuzzlePhase, SlidingPuzzleController } from "./sliding_puzzle_controller";
import { Piece, SlidingPuzzleState } from "./sliding_puzzle_state";


function sliding_puzzle_state_setup(k: number): SlidingPuzzleState {
    var state = new SlidingPuzzleState();

    // Space Setup
    const grid_space = new GridSpace(k, k);
    var entities: Array<Piece> = [];
    for (var loc of grid_space.to_array()) {
        if (loc.co.x != 0 && loc.co.y != 0) { 
            entities.push(new Piece(loc));
        }
    }

    // State Setup
    // TODO: Construct state with space and entities instead of later assignment.
    state.space = grid_space;
    state.entities = entities;

    return state
}

function sliding_puzzle_display_setup(
    state: SlidingPuzzleState, view: View2D,
): DisplayMap<ISelectable> {
    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();

    for (let loc of state.space.to_array()) {
        let loc_display = new GridLocationDisplay(loc);
        display_map.set(loc, loc_display);
        loc_display.display(view);
    }

    for (let entity of state.entities) {
        let entity_display = new EntityDisplay(entity);
        display_map.set(entity, entity_display);
        entity_display.display(view);
    }

    return display_map
}

export function sliding_puzzle_setup() {
    // State Setup
    var k = 3;
    var state = sliding_puzzle_state_setup(k)
    
    // Create Canvas
    const size = 100
    const view = new View2D(k * size, k * size)
    
    // Create Displays
    // NOTE: Shared displays and DisplayMap between views.
    var display_map = sliding_puzzle_display_setup(state, view);
    
    // Connect View (display) interactions with state through Broker
    var display_handler = new DisplayHandler(view, display_map, state);

    var broker = new Canvas2DBroker(display_handler, view);
    
    // NOTE: Only one display
    var input_request = broker.input_request;
    // TODO: Add NullInputRequest to prevent error messages if I need a ReadOnlyBroker???

    // TODO: Change to `requestAnimationFrame` everywhere
    setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);

    // Create Controller
    var phase = new SlidingPuzzlePhase(state);
    var controller = new SlidingPuzzleController(state);
    
    // Start main game loop
    // @ts-ignore
    controller.run(phase, input_request, display_handler);
}
