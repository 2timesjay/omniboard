import { Action, ATTACK, END, MOVE } from "../model/action";
import { ISelectable, Stack } from "../model/core";
import { InputOptions, InputRequest, InputSelection, synthetic_input_getter } from "../model/input";
import { GridLocation, GridSpace } from "../model/space";
import { BoardState } from "../model/state";
import { Unit } from "../model/unit";
import { BoardAction, InputState, TacticsInputs, TacticsPhase } from "./tactics_controller";


function _min_distance(grid: GridSpace, base_loc: GridLocation, other_locs: Array<GridLocation>) {
    var distances = other_locs.map(o => grid.getDistance(base_loc, o));
    return Math.min(...distances);
}

export class AI {
    team: number;
    state: BoardState;
    unit_getter: InputRequest<Unit>;
    action_getter: InputRequest<BoardAction>;
    action_input_getter: InputRequest<ISelectable>;
    tactics_inputs: TacticsInputs;

    constructor(team: number, state: BoardState) {
        this.team = team;
        this.state = state;
        this.unit_getter = synthetic_input_getter<Unit>(this._select_unit.bind(this));
        this.action_getter = synthetic_input_getter<BoardAction>(this._select_action.bind(this));
        this.action_input_getter = synthetic_input_getter<ISelectable>(this._select_action_input.bind(this));
    }

    get_input(
        phase: TacticsPhase, 
        input_options: InputOptions<ISelectable>, 
        tactics_inputs: TacticsInputs,
    ): Promise<InputSelection<ISelectable>> {
        // TODO: Is it better to inject tactics_inputs another way?
        this.tactics_inputs = tactics_inputs;
        // Note: Fine to hit these all in one loop
        if (phase.input_state == InputState.NoneSelected){
            // @ts-ignore
            return this.unit_getter(input_options);
        }
        else if (phase.input_state == InputState.UnitSelected){
            // @ts-ignore
            return this.action_getter(input_options);
        }
        else if (phase.input_state == InputState.ActionSelected){
            // @ts-ignore
            return this.action_input_getter(input_options);
        }
        else if (phase.input_state == InputState.ActionInputSelected) {
            console.log("SHOULD NOT REACH");
        }
        return null;
    }

    _select_unit(arr: Array<Unit>): Unit {
        return arr[0];
    }

    _select_action(arr: Array<BoardAction>): BoardAction {
        // TODO: Validate the action has valid input; filter in phase.action_selection()
        // TODO: Chain lightning doesn't work when enabled
        var unit = this.tactics_inputs.unit;
        var enemy_units = this.state.units.filter(u => u.team != unit.team);
        var valid_actions: Array<BoardAction> = [];
        for (var action of arr) {
            var is_valid = false;
            if (action.text == MOVE) {
                console.log("MIN DIST: ", _min_distance(
                    this.state.grid, unit.loc, enemy_units.map(u => u.loc)
                ))
                is_valid = _min_distance(
                    this.state.grid, unit.loc, enemy_units.map(u => u.loc)
                ) > 1;
            } else if (action.text == ATTACK || action.text == END) {
                is_valid = action.has_options(this.tactics_inputs);
            }

            if (is_valid) {
                valid_actions.push(action);
            }
        }
        console.log("selecting action : ", valid_actions[0].text)
        return valid_actions[0];
    }

    _select_action_input(arr: Array<ISelectable>): ISelectable {
        var unit = this.tactics_inputs.unit;
        var action = this.tactics_inputs.action;

        var enemy_units = this.state.units.filter(u => u.team != unit.team);
        if (action.text == MOVE) {
            var best_loc: GridLocation = null; // Note: Guaranteed to have one option to replace this.
            var best_dist: number = Infinity;
            // @ts-ignore - we know it's the correct type because of MOVE
            var loc_arr: Array<GridLocation> = arr;
            for (var loc of loc_arr) {
                var dist = _min_distance(
                    this.state.grid, loc, enemy_units.map(u => u.loc)
                )
                if (dist < best_dist) {
                    best_loc = loc;
                    best_dist = dist;
                }
            }
            return best_loc;
        }
        else if (action.text == ATTACK) {

        }
        else if (action.text == END) {

        } 
        return arr[0];
    }
}
