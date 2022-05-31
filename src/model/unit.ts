import { Bump, Flinch, Move } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { ISelectable, Stack } from "./core";
import { AutoInputAcquirer, Confirmation, SequentialInputAcquirer, SimpleInputAcquirer } from "./input";
import { GridLocation, GridSpace, Point } from "./space";
import { Action, BoardState, Effect, IState } from "./state";

// Actions constants
export const MOVE = "Move";
export const ATTACK = "Attack";
export const CHAIN = "Chain Lightning";
export const END = "End Turn";

// TODO: Move somewhere more appropriate
export const GLOBAL_CONFIRMATION = new  Confirmation(); 

function construct_end_turn(confirmation: Confirmation, state: BoardState) {
    var acquirer = new AutoInputAcquirer<Confirmation>(confirmation);
    var digest_fn = (confirmation: Confirmation): Array<Effect<BoardState>> => {
        console.log("Attempting to Digest: ", "End Turn");
        return [];
    }
    var end_turn = new Action<Confirmation, BoardState>("End Turn", 4, acquirer, digest_fn)
    return end_turn
}

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
            var vector: Point = state.grid.getVector(unit.loc, target.loc);
            // TODO: Reconsider Effect as callable.
            effect.description = "attack target";
            effect.set_animate = (display_handler:DisplayHandler) => {
                var target_display = display_handler.display_map.get(target);
                var unit_display = display_handler.display_map.get(unit);
                // TODO: Relate to graphical size.
                var target_animation = new Flinch(vector.x*20, vector.y*20, 50);
                var unit_animation = new Bump(vector.x*.4, vector.y*.4, 50);
                // @ts-ignore
                effect.animate = () => {
                    // @ts-ignore
                    target_display.interrupt_animation(target_animation);
                    // @ts-ignore
                    unit_display.interrupt_animation(unit_animation);
                };
            }
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
    var increment_fn = (loc_stack: Stack<GridLocation>): Array<GridLocation> => {
        var units = state.units;
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
    var digest_fn = (locs: Stack<GridLocation>): Array<Effect<BoardState>> => {
        var locs_arr = locs.to_array();
        // TODO: don't include initial "current" loc as part of locs.
        locs_arr.shift();
        console.log("Attempting to Digest: ", locs_arr);
        function effect_constructor(loc: GridLocation){
            var target_loc = loc;
            var hash = (loc.x*100+loc.y).toString(16);
            console.log("Attempting to generate move Effect", target_loc);
            // @ts-ignore
            var effect: Effect<BoardState> = (state: BoardState) => {
                console.log("Attempting to execute Move: ", unit.loc, target_loc);
                unit.setLoc(loc);
                return state;
            };
            // TODO: Reconsider Effect as callable. Really!
            effect.description = "move unit";
            effect.set_animate = (display_handler:DisplayHandler) => {
                effect.animate = () => {
                    var vector: Point = state.grid.getVector(unit.loc, target_loc);
                    console.log("Vector: ", vector)
                    var unit_display = display_handler.display_map.get(unit);
                    // @ts-ignore Doesn't know unit_display is a UnitDisplay
                    var animation = new Move(vector.x, vector.y, 40, unit_display);
                    // @ts-ignore Can't even use UnitDisplay as a normal type.
                    unit_display.interrupt_animation(animation)
                };
            }
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }
        return locs_arr.map(effect_constructor)
    }
    // TODO: Fix bad use of generics here.
    var move = new Action<GridLocation, BoardState>("Move", 1, acquirer, digest_fn)
    return move
}

// TODO: option to select unit twice shown but triggers "confirm". Either forbid or fix.
function construct_chain_lightning(unit: Unit, state: BoardState) {
    var increment_fn = (unit_stack: Stack<Unit>): Array<Unit> => {
        var grid = state.grid;
        var units = state.units;
        var origin_loc = unit_stack.value.loc;
        var options = units.filter((u) => {
            var dist = grid.getDistance(origin_loc, u.loc);
            return 0 < dist && dist <= 3;
        });
        return options;
    };
    var termination_fn = (loc_stack: Stack<Unit>): boolean => {
        return loc_stack.depth >= 4; // + 1 because stack starts at root.
    }
    var acquirer = new SequentialInputAcquirer<Unit>(
        increment_fn,
        termination_fn,
    )
    var digest_fn = (units: Stack<Unit>): Array<Effect<BoardState>> => {
        var units_arr = units.to_array();
        var unit = units_arr.shift();
        console.log("Attempting to Digest: ", units_arr);
        function effect_constructor(target: Unit){
            console.log("Attempting to generate Chain Lightning Effect", unit, target);
            function effect(state: BoardState): BoardState {
                console.log("Attempting to execute Damage: ", unit, target);
                target.damage(2);
                return state;
            };
            // TODO: Reconsider Effect as callable.
            effect.description = "lightning damage unit";
            effect.set_animate = (display_handler: DisplayHandler) => {
                console.log("Animation for target: ", target);
                var unit_display = display_handler.display_map.get(target);
                var animation = new Flinch(.4*(2*Math.random()-1), .4*(2*Math.random()-1), 50);
                // @ts-ignore
                effect.animate = () => {console.log("CL Anim"); unit_display.interrupt_animation(animation)};
            }
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }
        return units_arr.map(effect_constructor)
    }
    // TODO: Fix bad use of generics here.
    var move = new Action<Unit, BoardState>("Chain Lightning", 3, acquirer, digest_fn)
    return move
}

export function CONSTRUCT_BASIC_ACTIONS(unit: Unit, state: BoardState){
    return construct_actions(unit, state, [MOVE, ATTACK, CHAIN, END])
} 

export function construct_actions(unit: Unit, state: BoardState, action_list: Array<string>){
    var actions = [];
    for (var i = 0; i < action_list.length; i++) {
        // TODO: Pass index to action construction
        var action_str = action_list[i];
        switch(action_str) {
            case MOVE:
                actions.push(construct_move(unit, state));
                break;
            case ATTACK:
                actions.push(construct_attack(unit, state));
                break;
            case CHAIN:
                actions.push(construct_chain_lightning(unit, state));
                break;
            case END:
                actions.push(construct_end_turn(GLOBAL_CONFIRMATION, state));
                break;
        }
        return actions;
    }
    var move = construct_move(unit, state);
    var attack = construct_attack(unit, state);
    var chain_lightning = construct_chain_lightning(unit, state);
    var end_turn = construct_end_turn(GLOBAL_CONFIRMATION, state);
    return [
        move,
        attack,
        chain_lightning,
        end_turn,
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
        this.max_hp = 5;
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

    is_alive(): boolean {
        return this.hp > 0;
    }

    setLoc(loc: GridLocation){
        this.loc = loc; 
    }

    setActions(actions: Array<Action<ISelectable, BoardState>>) {
        this.actions = actions;
    }
}