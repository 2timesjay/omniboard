import { GridSpace } from "../model/space";
import { BoardState } from "../model/state";
import { 
    construct_actions, 
    GLOBAL_CONFIRMATION, 
    Unit, 
    MOVE, 
    ATTACK, 
    CHAIN, 
    END, 
    CHANNELED_ATTACK
} from "../model/unit";

/**
 * Create a KxK grid for Tactics game
 */
export function tactics_setup(k: number): BoardState {
    const grid_space = new GridSpace(k, k);

    // Tactics State setup
    var state = new BoardState();
    state.grid = grid_space;
    var unit_0_a = new Unit(0);
    unit_0_a.setLoc(grid_space.get(2, 2));
    unit_0_a.setActions(construct_actions(unit_0_a, state, [MOVE, ATTACK, END]))
    var unit_0_b = new Unit(0);
    unit_0_b.setLoc(grid_space.get(0, 0));
    unit_0_b.setActions(construct_actions(unit_0_b, state, [MOVE, CHANNELED_ATTACK, END]))

    var unit_1_a = new Unit(1);
    unit_1_a.setLoc(grid_space.get(3, 2));
    unit_1_a.setActions(construct_actions(unit_1_a, state, [MOVE, ATTACK, END]))
    var unit_1_b = new Unit(1);
    unit_1_b.setLoc(grid_space.get(2, 3));
    unit_1_b.setActions(construct_actions(unit_1_b, state, [MOVE, ATTACK, END]))
    var unit_1_c = new Unit(1);
    unit_1_c.setLoc(grid_space.get(4, 1));
    unit_1_c.setActions(construct_actions(unit_1_c, state, [MOVE, ATTACK, END]))
    
    var units = [
        unit_0_a, unit_0_b, 
        unit_1_a, unit_1_b, unit_1_c,
    ]
    state.units = units;

    state.confirmation = GLOBAL_CONFIRMATION;
    return state
}