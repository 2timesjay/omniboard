import { GridSpace } from "../model/space";
import { BoardState } from "../model/state";
import { CONSTRUCT_BASIC_ACTIONS, GLOBAL_CONFIRMATION, Unit } from "../model/unit";

/**
 * Create a KxK grid for Tactics game
 */
export function tactics_setup(k: number): BoardState {
    const grid_space = new GridSpace(k, k);

    // Tactics State setup
    var state = new BoardState();
    state.grid = grid_space;
    var unit_1 = new Unit(0);
    unit_1.setLoc(grid_space.get(3, 2));
    var unit_2 = new Unit(1);
    unit_2.setLoc(grid_space.get(2,2));
    var unit_3 = new Unit(0);
    unit_3.setLoc(grid_space.get(2, 3));
    var units = [unit_1, unit_2, unit_3];
    for (var co of [[1,2],[2,1],[2,0],[0,2],[0,0]]) {
        var [x, y] = co;
        var unit_extra = new Unit(1);
        unit_extra.setLoc(grid_space.get(x, y));
        units.push(unit_extra);
    }
    // TODO: Safer Laziness in action construction
    for (let unit of units) {
        unit.setActions(CONSTRUCT_BASIC_ACTIONS(unit, state));
    }
    state.units = units;

    state.confirmation = GLOBAL_CONFIRMATION;
    return state
}
