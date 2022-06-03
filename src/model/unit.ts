import { TrueLiteral } from "typescript";
import { Bump, Flinch, Move } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { ISelectable, Stack } from "./core";
import { AutoInputAcquirer, Confirmation, SequentialInputAcquirer, SimpleInputAcquirer } from "./input";
import { GridLocation, GridSpace, Point } from "./space";
import { Action, BoardState, Effect, IState } from "./state";

export const DURATION_FRAMES = 25

// Actions constants
export const MOVE = "Move";
export const ATTACK = "Attack";
export const CHAIN = "Chain Lightning";
export const END = "End Turn";
export const CHANNELED_ATTACK = "Channeled Attack";

// TODO: Move somewhere more appropriate
export const GLOBAL_CONFIRMATION = new  Confirmation(); 


function exhaust_effect_constructor(unit: Unit, action: Action<ISelectable, BoardState>) {
    function effect(state: BoardState): BoardState {
        console.log("Exhausting action: ", action);
        unit.exhaust_action(action);
        return state;
    };
    effect.description = "exhaust action";
    effect.pre_effect = null;
    effect.post_effect = null;
    return effect;
}

function construct_end_turn(confirmation: Confirmation, unit: Unit, state: BoardState) {
    var acquirer = new AutoInputAcquirer<Confirmation>(confirmation);
    var digest_fn = (confirmation: Confirmation): Array<Effect<BoardState>> => {
        function effect_constructor() { 
            function effect(state: BoardState): BoardState {
                console.log("Exhausting Unit: ", unit);
                unit.action_points = 0;
                return state;
            };
            effect.description = "exhaust unit";
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }
        console.log("Attempting to Digest: ", "End Turn");
        return [effect_constructor()];
    }
    var end_turn = new Action<Confirmation, BoardState>();
    end_turn.build(END, 4, acquirer, digest_fn)
    return end_turn
}

function construct_attack(unit: Unit, state: BoardState) {
    var action = new Action<Unit, BoardState>();
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
                var target_animation = new Flinch(vector.x*20, vector.y*20, DURATION_FRAMES);
                var unit_animation = new Bump(vector.x*.4, vector.y*.4, DURATION_FRAMES);
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
        return [effect_constructor(target), exhaust_effect_constructor(unit, action)];
    }
    action.build(ATTACK, 2, acquirer, digest_fn);
    return action;
}

function construct_move(unit: Unit, state: BoardState) {
    var action = new Action<GridLocation, BoardState>();
    var increment_fn = (stack: Stack<GridLocation>): Array<GridLocation> => {
        var units = state.units;
        var grid_space = state.grid;
        var neighborhood = grid_space.getGridNeighborhood(stack.value);
        var occupied = new Set(units.map((u) => u.loc));
        var options = neighborhood.filter((l) => !occupied.has(l))
        return options;
    };
    var termination_fn = (stack: Stack<GridLocation>): boolean => {
        return stack.depth >= unit.speed + 1; // + 1 because stack starts at root.
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
                    var animation = new Move(vector.x, vector.y, DURATION_FRAMES, unit_display);
                    // @ts-ignore Can't even use UnitDisplay as a normal type.
                    unit_display.interrupt_animation(animation)
                };
            }
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }
        var effects = locs_arr.map(effect_constructor);
        effects.push(exhaust_effect_constructor(unit, action));
        return effects;
    }
    // TODO: Fix bad use of generics here.
    action.build(MOVE, 1, acquirer, digest_fn);
    return action;
}

function construct_channeled_attack(unit: Unit, state: BoardState) {
    var action = new Action<Unit, BoardState>();
    // TODO: Create acquirer as fixed sequences of SimpleInputAcquirers
    var increment_fn = (stack: Stack<Unit>): Array<Unit> => {
        switch (stack.depth) {
            case 1: // choose proxy
                var proxy_options = state.units.filter((u) => (u.team == unit.team));
                return proxy_options;
            case 2: // proxy already chosen; choose target
                var proxy = stack.value;
                var units = state.units.filter((u) => (u.team != unit.team));
                var attack_range = proxy.attack_range;
                var attacker_loc = proxy.loc;
                var options = units.filter(
                    (u) => state.grid.getDistance(attacker_loc, u.loc) <= attack_range
                );
                return options;
            default: // should never happen
                return [];
        }
    };
    var termination_fn = (stack: Stack<Unit>): boolean => {
        return stack.depth == 3; // + 1 because stack starts at root.
    }
    var acquirer = new SequentialInputAcquirer<Unit>(
        increment_fn, termination_fn
    )
    var digest_fn = (units: Stack<Unit>): Array<Effect<BoardState>> => {
        console.log("Attempting to Digest: ", units);
        function effect_constructor(unit: Unit, proxy: Unit, target: Unit){
            console.log("Attempting to generate damage Effect: ", target);
            function effect(state: BoardState): BoardState {
                console.log("Attempting to channel Damage: ", proxy, target);
                target.damage(proxy.strength);
                return state;
            };
            var vector: Point = state.grid.getVector(proxy.loc, target.loc);
            // TODO: Reconsider Effect as callable.
            effect.description = "attack target";
            effect.set_animate = (display_handler:DisplayHandler) => {
                // TODO: get<T> method that returns AbstractDisplay<T>, safely.
                var unit_display = display_handler.display_map.get(unit);
                var target_display = display_handler.display_map.get(target);
                var proxy_display = display_handler.display_map.get(proxy);
                // TODO: Relate to graphical size.
                var target_animation = new Flinch(vector.x*20, vector.y*20, DURATION_FRAMES);
                var unit_animation = new Flinch(10*(2*Math.random()-1), 10*(2*Math.random()-1), DURATION_FRAMES);
                var proxy_animation = new Bump(vector.x*.4, vector.y*.4, DURATION_FRAMES);
                // @ts-ignore
                effect.animate = () => {
                    // @ts-ignore
                    unit_display.interrupt_animation(unit_animation);
                    // @ts-ignore
                    proxy_display.interrupt_animation(proxy_animation)
                    // @ts-ignore
                    target_display.interrupt_animation(target_animation);
                };
            }
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }

        var units_arr = units.to_array(); // Length 3 array
        var unit = units_arr[0];
        var proxy = units_arr[1];
        var target = units_arr[2];
        return [effect_constructor(unit, proxy, target), exhaust_effect_constructor(unit, action)];
    }
    action.build(CHANNELED_ATTACK, 3, acquirer, digest_fn);
    return action;
}

// TODO: option to select unit twice shown but triggers "confirm". Either forbid or fix.
function construct_chain_lightning(unit: Unit, state: BoardState) {
    var action = new Action<Unit, BoardState>();
    var increment_fn = (stack: Stack<Unit>): Array<Unit> => {
        var grid = state.grid;
        var units = state.units;
        var origin_loc = stack.value.loc;
        var options = units.filter((u) => {
            var dist = grid.getDistance(origin_loc, u.loc);
            return 0 < dist && dist <= 3;
        });
        return options;
    };
    var termination_fn = (stack: Stack<Unit>): boolean => {
        return stack.depth >= 4; // + 1 because stack starts at root.
    }
    var acquirer = new SequentialInputAcquirer<Unit>(
        increment_fn,
        termination_fn,
    )
    var digest_fn = (units: Stack<Unit>): Array<Effect<BoardState>> => {
        var units_arr = units.to_array();
        var unit = units_arr.shift();
        console.log("Attempting to Digest: ", units_arr);
        function effect_constructor(target: Unit): Effect<BoardState>{
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
                var animation = new Flinch(20*(2*Math.random()-1), 20*(2*Math.random()-1), DURATION_FRAMES);
                // @ts-ignore
                effect.animate = () => {console.log("CL Anim"); unit_display.interrupt_animation(animation)};
            }
            effect.pre_effect = null;
            effect.post_effect = null;
            return effect;
        }
        var effects = units_arr.map(effect_constructor);
        effects.push(exhaust_effect_constructor(unit, action));
        return effects;
    }
    // TODO: Fix bad use of generics here.
    action.build(CHAIN, 3, acquirer, digest_fn);
    return action;
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
            case CHANNELED_ATTACK:
                actions.push(construct_channeled_attack(unit, state));
                break;
            case ATTACK:
                actions.push(construct_attack(unit, state));
                break;
            case CHAIN:
                actions.push(construct_chain_lightning(unit, state));
                break;
            case END:
                actions.push(construct_end_turn(GLOBAL_CONFIRMATION, unit, state));
                break;
        }
    }
    return actions;
} 

export class Unit implements ISelectable {
    team: number;
    loc: GridLocation;
    actions: Array<Action<ISelectable, BoardState>>;
    action_points: number;
    max_action_points: number;
    _hp: Array<number>;
    _max_hp: Array<number>;
    speed: number;
    strength: number;
    attack_range: number;

    constructor(team: number){
        this.team = team;
        
        this._max_hp = [10];
        this._hp = [...this._max_hp];
        
        this.speed = 3;
        this.strength = 5;
        this.attack_range = 1;

        this.max_action_points = 2;
        this.action_points = 2;
    }

    get hp(): number {
        return this._hp[0];
    }

    get all_hp(): Array<number> {
        return this._hp;
    }
    
    // TODO: Do I always want just first max hp?
    get max_hp(): number {
        return this._max_hp[0];
    }
    
    get all_max_hp(): Array<number> {
        return this._max_hp;
    }

    damage(damage_amount: number){
        this.setHp(this._hp[0] - damage_amount)
    }

    setHp(hp: number) {
        this._hp[0] = Math.max(hp, 0);
        // Pop life bar
        if (this._hp[0] == 0 && this._hp.length > 1) {
            this._hp.shift();
            this._max_hp.shift();
        }
    }

    is_alive(): boolean {
        return this.hp > 0;
    }

    is_exhausted(): boolean {
        return this.action_points == 0;
    }

    exhaust_action(action: Action<ISelectable, BoardState>) {
        this.action_points -=  1;
        action.enabled = false;
    }

    reset_actions() {
        this.action_points = this.max_action_points;
        this.actions.forEach((a) => a.enabled = true);
    }

    setLoc(loc: GridLocation){
        this.loc = loc; 
    }

    setActions(actions: Array<Action<ISelectable, BoardState>>) {
        this.actions = actions;
    }
}