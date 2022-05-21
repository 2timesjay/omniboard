import { ISelectable, Stack } from "./core";
import { GridLocation, GridSpace } from "./space";
import { Action, BoardState, Effect, IState, SequentialInputAcquirer } from "./state";

// TODO: Clicking other target gives weird queue view.
// TODO: Break out input acquisition; use flatInputAcquisition here.
function construct_attack(unit: Unit, state: BoardState){
    var increment_fn = (unit_stack: Stack<Unit>): Array<Unit> => {
        // TODO: Somehow allowed to click self. Worse, this autoconfirms (input gen bug)
        var options = state.units.filter((u) => (u != unit));
        return options;
    };
    var termination_fn = (unit_stack: Stack<Unit>): boolean => {
        return (unit_stack.depth >= 2);
    }
    var acquirer = new SequentialInputAcquirer<Unit>(
        increment_fn,
        termination_fn,
    )
    var digest_fn = (units: Array<Unit>): Array<Effect<BoardState>> => {
        console.log("Attempting to Digest: ", unit);
        function effect_constructor(target: Unit){
            console.log("Attempting to generate damage Effect: ", target);
            function effect(state: BoardState): BoardState {
                console.log("Attempting to execute Damage: ", unit, target);
                target.damage(5);
                return state;
            };
            // TODO: Reconsider Effect as callable.
            effect.description = "attack target";
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }
        var target = units.pop();
        return [effect_constructor(target)];
    }
    var move = new Action("Attack", 2, acquirer, digest_fn)
    return move
}

function construct_move(unit: Unit, state: BoardState){
    var increment_fn = (loc_stack: Stack<GridLocation>): Array<GridLocation> => {
        var grid_space = state.grid;
        var options = grid_space.getGridNeighborhood(loc_stack.value);
        return options;
    };
    var termination_fn = (loc_stack: Stack<GridLocation>): boolean => {
        return loc_stack.depth >= 4;
    }
    var acquirer = new SequentialInputAcquirer<GridLocation>(
        increment_fn,
        termination_fn,
    )
    var digest_fn = (locs: Array<GridLocation>): Array<Effect<BoardState>> => {
        console.log("Attempting to Digest: ", locs);
        function effect_constructor(loc: GridLocation){
            console.log("Attempting to generate move Effect", loc);
            function effect(state: BoardState): BoardState {
                console.log("Attempting to execute Move: ", unit.loc, loc);
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
    var move = new Action("Move", 1, acquirer, digest_fn)
    return move
}

export function CONSTRUCT_BASIC_ACTIONS(unit: Unit, state: BoardState){
    var move = construct_move(unit, state);
    var attack = construct_attack(unit, state);
    return [
        move,
        attack,
    ]
} 

export class Unit implements ISelectable {
    team: number;
    loc: GridLocation;
    actions: Array<Action<ISelectable, IState>>;
    hp: number;
    max_hp: number;

    constructor(team: number){
        this.team = team;
        this.max_hp = 10;
        this.hp = this.max_hp;
    }

    damage(damage_amount: number){
        this.setHp(this.hp - damage_amount)
    }

    setHp(hp: number) {
        this.hp = hp;
    }

    setLoc(loc: GridLocation){
        this.loc = loc; 
    }

    setActions(actions: Array<Action<ISelectable, IState>>) {
        this.actions = actions;
    }
}