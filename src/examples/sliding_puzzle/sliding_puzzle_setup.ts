import { ISelectable } from "../../model/core";
import { Entity } from "../../model/entity";
import { GridSpace, ICoordinate } from "../../model/space";
import { Canvas2DBroker, DisplayMap } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { AbstractDisplay, EntityDisplay } from "../../view/display";
import { DisplayHandler } from "../../view/display_handler";
import { View2D } from "../../view/rendering";
import { SlidingPuzzlePhase, SlidingPuzzleController } from "./sliding_puzzle_controller";
import { SlidingPuzzleState } from "./sliding_puzzle_state";


function sliding_puzzle_state_setup(k: number): SlidingPuzzleState {
    var state = new SlidingPuzzleState();

    // Space Setup
    const grid_space = new GridSpace(k, k);
    for (var loc of grid_space.to_array()) {
        if (loc.co.x != 0 && loc.co.y != 0) { 
            new Entity()
        }
    }
    if (d >= 2) {
        console.log("Volume: ", volume_space);
        volume_space.get({x: 0, y: 0, z: 1}).traversable = true;
        volume_space.get({x: 1, y: 0, z: 1}).traversable = true;
        volume_space.get({x: 2, y: 0, z: 1}).traversable = true;
    }
    if (d >= 3) {
        console.log("Volume: ", volume_space);
        volume_space.get({x: 0, y: 0, z: 2}).traversable = true;
    }

    // TODO: Have to pass state for Action construction? Circular?
    var entity_0 = new Entity(volume_space.get({x: 1, y: 2, z: 0}));
    // @ts-ignore
    entity_0.setActions([new EntityMoveAction(entity_0, state)])
    var entity_1 = new Entity(volume_space.get({x: 2, y: 2, z: 0}));
    // @ts-ignore
    entity_1.setActions([new EntityMoveAction(entity_1, state)])

    // State Setup
    // TODO: Construct state with space and entities instead of later assignment.
    state.space = volume_space;
    state.entities = [entity_0, entity_1];

    return state
}

function sliding_puzzle_display_setup(
    state: SlidingPuzzleState, view: View2D,
): DisplayMap<ISelectable> {
    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();

    for (let loc of state.space.to_array()) {
        // @ts-ignore Actually a GridLocation in this case.
        let loc_display = new GridLocationDisplay(loc);
        // @ts-ignore fix Display3D inheritance
        display_map.set(loc, loc_display);
        // @ts-ignore
        loc_display.display(view);
    }

    for (let entity of state.entities) {
        let entity_display = new EntityDisplay(entity);
        // @ts-ignore fix Display3D inheritance
        display_map.set(entity, entity_display);
        // @ts-ignore
        entity_display.display(view);
    }

    return display_map
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
