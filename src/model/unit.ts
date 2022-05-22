import { ISelectable, Stack } from "./core";
import { SequentialInputAcquirer, SimpleInputAcquirer } from "./input";
import { GridLocation, GridSpace } from "./space";
import { Action, BoardState, Effect, IState } from "./state";

// TODO: Clicking other target gives weird queue view.
// TODO: User SimpleAcquirer
function construct_attack(unit: Unit, state: BoardState) {
    var option_fn = (): Array<Unit> => {
        // TODO: Somehow allowed to click self. Worse, this autoconfirms (input gen bug)
        var units = state.units.filter((u) => (u.team != unit.team));
        var attack_range = unit.attack_range;
        var attacker_loc = unit.loc
        var options = units.filter(
            (u) => state.grid.getDistance(attacker_loc, u.loc) <= attack_range
        )
        return options;
    };
    var acquirer = new SimpleInputAcquirer<Unit>(
        option_fn
    )
    var digest_fn = (target: Unit): Array<Effect<BoardState>> => {
        console.log("Attempting to Digest: ", unit);
        function effect_constructor(target: Unit){
            console.log("Attempting to generate damage Effect: ", target);
            function effect(state: BoardState): BoardState {
                console.log("Attempting to execute Damage: ", unit, target);
                target.damage(unit.strength);
                return state;
            };
            // TODO: Reconsider Effect as callable.
            effect.description = "attack target";
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }
        return [effect_constructor(target)];
    }
    var move = new Action<Unit, BoardState>("Attack", 2, acquirer, digest_fn)
    return move
}

function construct_move(unit: Unit, state: BoardState) {
    var units = state.units;
    var increment_fn = (loc_stack: Stack<GridLocation>): Array<GridLocation> => {
        var grid_space = state.grid;
        var neighborhood = grid_space.getGridNeighborhood(loc_stack.value);
        var occupied = new Set(units.map((u) => u.loc));
        var options = neighborhood.filter((l) => !occupied.has(l))
        return options;
    };
    var termination_fn = (loc_stack: Stack<GridLocation>): boolean => {
        return loc_stack.depth >= unit.speed + 1; // + 1 because stack starts at root.
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
    var move = new Action<Array<GridLocation>, BoardState>("Move", 1, acquirer, digest_fn)
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
    actions: Array<Action<ISelectable, BoardState>>;
    hp: number;
    max_hp: number;
    speed: number;
    strength: number;
    attack_range: number;

    constructor(team: number){
        this.team = team;
        this.max_hp = 10;
        this.hp = this.max_hp;
        this.speed = 3;
        this.strength = 5;
        this.attack_range = 1;
    }

    damage(damage_amount: number){
        this.setHp(this.hp - damage_amount)
    }

    setHp(hp: number) {
        this.hp = Math.max(hp, 0);
    }

    setLoc(loc: GridLocation){
        this.loc = loc; 
    }

    setActions(actions: Array<Action<ISelectable, BoardState>>) {
        this.actions = actions;
    }
}