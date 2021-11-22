import { ISelectable } from "./core";
import { GridLocation } from "./space";
import { Action } from "./state";


export const BASIC_ACTIONS = new Array<Action<ISelectable>>(
    // var increment_fn = (loc_stack: Stack<GridLocation>): Array<GridLocation> => {
    //     var options = grid_space.getGridNeighborhood(loc_stack.value);
    //     return options;
    // };
    // var termination_fn = (loc_stack: Stack<GridLocation>): boolean => {
    //     return loc_stack.depth >= 4;
    // }
    // var digest_fn = (nums: Array<GridLocation>): Array<Effect<BoardState>> => {
    //     function effect(state: BoardState): BoardState {
    //         return state;
    //     };
    //     // Reconsider callable.
    //     effect.description = null;
    //     effect.pre_effect = null;
    //     effect.post_effect = null;
    //     return [effect];
    // }
);

export class Unit implements ISelectable {
    team: number;
    loc: GridLocation;
    actions: Array<Action<ISelectable>>;

    constructor(team: number){
        this.team = team;
    }

    setLoc(loc: GridLocation){
        this.loc = loc; 
    }

    setActions(actions: Array<Action<ISelectable>>) {
        this.actions = actions;
    }
}