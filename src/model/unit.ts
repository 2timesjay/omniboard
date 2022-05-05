import { ISelectable, Stack } from "./core";
import { GridLocation, GridSpace } from "./space";
import { Action, BoardState, Effect } from "./state";


export function CONSTRUCT_BASIC_ACTIONS(unit: Unit, grid_space: GridSpace){
    var increment_fn = (loc_stack: Stack<GridLocation>): Array<GridLocation> => {
        var options = grid_space.getGridNeighborhood(loc_stack.value);
        return options;
    };
    var termination_fn = (loc_stack: Stack<GridLocation>): boolean => {
        return loc_stack.depth >= 4;
    }
    var digest_fn = (locs: Array<GridLocation>): Array<Effect<BoardState>> => {
        console.log("Attempting to Digest");
        function effect_constructor(loc: GridLocation){
            console.log("Attempting to generate Effect");
            function effect(state: BoardState): BoardState {
                console.log("Attempting to execute Effect");
                unit.setLoc(loc);
                return state;
            };
            // TODO: Reconsider Effect as callable.
            effect.description = "move unit";
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }
        return locs.map(effect_constructor)
    }
    return [new Action(increment_fn, termination_fn, digest_fn)]
} 

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