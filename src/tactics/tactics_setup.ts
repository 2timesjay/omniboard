import { MOVE, ATTACK, CHAIN, END, CHANNELED_ATTACK, COUNTER, TERRAIN, SHOVE } from "../model/action";
import { GridSpace } from "../model/space";
import { BoardState } from "../model/state";
import { 
    construct_actions, 
    GLOBAL_CONFIRMATION, 
    Unit, 
} from "../model/unit";
import { Canvas2DBroker } from "../view/broker";
import { TICK_DURATION_MS } from "../view/client";
import { DisplayHandler } from "../view/display_handler";
import { View2D } from "../view/rendering";
import { TacticsPhase, TacticsController } from "./tactics_controller";
import { display_setup } from "./tactics_display_setup";

/**
 * Create a KxK grid for Tactics game
 */
export function tactics_state_setup(k: number): BoardState {
    // Space Setup
    const grid_space = new GridSpace(k, k);
    grid_space.get({x: 3, y: 1}).traversable = false;

    // State Setup
    var state = new BoardState();
    // TODO: Do I need to assign grid here? Should not be needed. Call grid late in unit.
    state.grid = grid_space;
    
    // Unit setup
    var unit_0_a = new Unit(0);
    unit_0_a.setLoc(grid_space.get({x: 2, y: 2}));
    unit_0_a.setActions(construct_actions(unit_0_a, state, [MOVE, ATTACK, COUNTER, END, SHOVE]))
    unit_0_a.piercing_strength = 2;
    var unit_0_b = new Unit(0);
    unit_0_b.setLoc(grid_space.get({x: 0, y: 0}));
    unit_0_b.setActions(construct_actions(unit_0_b, state, [MOVE, TERRAIN, CHANNELED_ATTACK, END]))

    var unit_1_a = new Unit(1);
    unit_1_a.setLoc(grid_space.get({x: 3, y: 2}));
    unit_1_a.setActions(construct_actions(unit_1_a, state, [MOVE, ATTACK, CHAIN, END]))
    var unit_1_b = new Unit(1);
    unit_1_b.setLoc(grid_space.get({x: 2, y: 3}));
    unit_1_b.setActions(construct_actions(unit_1_b, state, [MOVE, ATTACK, END]))
    var unit_1_c = new Unit(1);
    unit_1_c.setLoc(grid_space.get({x: 4, y: 1}));
    unit_1_c.setActions(construct_actions(unit_1_c, state, [MOVE, ATTACK, END]))
    
    var units = [
        unit_0_a, unit_0_b, 
        unit_1_a, unit_1_b, unit_1_c,
    ]
    state.units = units;

    state.confirmation = GLOBAL_CONFIRMATION;
    state.cur_team = 0;
    return state
}

export function tactics_setup() {
    // State Setup
    var k = 6;
    var state = tactics_state_setup(k)

    // Create Canvas
    const size = 100;
    const view =  new View2D(k, size)

    // Create Displays
    var display_map = display_setup(state, view);

    // Connect View (display) interactions with state through Broker
    var display_handler = new DisplayHandler(view, display_map, state);
    var broker = new Canvas2DBroker(display_handler, view);
    var input_request = broker.input_request;
    var tick = setInterval(display_handler.on_tick.bind(display_handler), TICK_DURATION_MS);

    // Create Controller
    var tp = new TacticsPhase(state);
    var tc = new TacticsController(state);

    // Start main game loop
    tc.run(tp, input_request, display_handler);
}