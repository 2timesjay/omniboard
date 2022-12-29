import { ISelectable } from "../../model/core";
import { Entity } from "../../common/entity";
import { GridSpace, ICoordinate } from "../../model/space";
import { Canvas2DBroker, DisplayMap } from "../../view/broker";
import { TICK_DURATION_MS } from "../../view/client";
import { AbstractDisplay, EntityDisplay, GridLocationDisplay } from "../../view/display";
import { DisplayHandler } from "../../view/display_handler";
import { View2D } from "../../view/rendering";
import { SlidingPuzzlePhase, SlidingPuzzleController } from "./sliding_puzzle_controller";
import { PuzzlePieceDisplay } from "./sliding_puzzle_display";
import { Piece, SlidingPuzzleState } from "./sliding_puzzle_state";


function sliding_puzzle_state_setup(k: number): SlidingPuzzleState {
    var state = new SlidingPuzzleState();

    // Space Setup
    const grid_space = new GridSpace(k, k);
    var entities: Array<Piece> = [];
    for (var loc of grid_space.to_array()) {
        if (!(loc.co.x == 0 && loc.co.y == 0)) { 
            entities.push(new Piece(loc));
        }
    }

    // State Setup
    // TODO: Construct state with space and entities instead of later assignment.
    state.space = grid_space;
    state.entities = entities;

    return state
}

async function sliding_puzzle_display_setup(
    state: SlidingPuzzleState, view: View2D,
): Promise<DisplayMap<ISelectable>> {
    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();

    for (let loc of state.space.to_array()) {
        let loc_display = new GridLocationDisplay(loc);
        display_map.set(loc, loc_display);
        loc_display.display(view);
    }

    // // TODO: Requires placeholders while waiting for image to load. 
    // for (let entity of state.entities) {
    //     let entity_display = new EntityDisplay(entity);
    //     display_map.set(entity, entity_display);
    //     entity_display.display(view);
    // }

    // TODO: Oddly requires 1-2 extra clicks.
    // TODO: Maybe better handled w/in PuzzlePiece?
    // TODO: Weird black border on lower-right piece. Out-of-order draw???
    // https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap#creating_sprites_from_a_sprite_sheets
    // https://stackoverflow.com/questions/2342132/waiting-for-image-to-load-in-javascript
    const loadImage = (src: string) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        })  
    ;
    await loadImage("/assets/images/square_bear_cub.png").then((puzzle_image: ImageBitmapSource) => {
        console.log("loaded image");
        createImageBitmap(
            puzzle_image
        ).then(function(image_bitmap: ImageBitmap) {   
            console.log("loading bitmap: ", image_bitmap);    
            for (let entity of state.entities) {
                // if (entity.loc.x == 0 && entity.loc.y == 0) {
                //     console.log("???????")
                //     continue
                // }
                let entity_display = new PuzzlePieceDisplay(entity, image_bitmap);
                display_map.set(entity, entity_display);
                entity_display.display(view);
            }
            console.log("built pieces");    
        })
    })

    return display_map
}

export function sliding_puzzle_setup() {
    // State Setup
    var k = 3;
    var state = sliding_puzzle_state_setup(k)
    
    // Create Canvas
    const size = 100
    const view = new View2D(k, size)
    
    // TODO: Avoid unwieldy super-"then"; maybe make setup async?
    // Create Displays
    // NOTE: Shared displays and DisplayMap between views.
    sliding_puzzle_display_setup(state, view).then((display_map: DisplayMap<ISelectable>) => {
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
    })
}
