import { Action, ATTACK, END, MOVE } from "../model/action";
import { ISelectable, Stack } from "../model/core";
import { InputOptions, InputRequest, InputSelection, synthetic_input_getter } from "../model/input";
import { GridLocation } from "../model/space";
import { BoardState } from "../model/state";
import { Unit } from "../model/unit";
import { BoardAction, InputState, TacticsPhase } from "./tactics_controller";


export class AI {
    team: number;
    state: BoardState;
    unit_getter: InputRequest<Unit>;
    action_getter: InputRequest<BoardAction>;
    action_input_getter: InputRequest<ISelectable>;

    constructor(team: number, state: BoardState) {
        this.team = team;
        this.state = state;
        this.unit_getter = synthetic_input_getter<Unit>(this._select_unit);
        this.action_getter = synthetic_input_getter<BoardAction>(this._select_action);
        this.action_input_getter = synthetic_input_getter<ISelectable>(this._select_action_input);
    }

    get_input(
        phase: TacticsPhase, input_options: InputOptions<ISelectable>
    ): Promise<InputSelection<ISelectable>> {
        // Note: Fine to hit these all in one loop
        if (phase.input_state == InputState.NoneSelected){
            // @ts-ignore
            return this.unit_getter(input_options.value);
        }
        else if (phase.input_state == InputState.UnitSelected){
            // @ts-ignore
            return this.action_getter(input_options.value);
        }
        else if (phase.input_state == InputState.ActionSelected){
            // @ts-ignore
            return this.action_input_getter(input_options.value);
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
        // TODO: Validate the action has valid input; do in phase.action_selection()
        var valid_actions: Array<BoardAction> = [];
        for (var action of arr) {
            var is_valid = false;
            if (action.text == MOVE) {
                // @ts-ignore
                is_valid = action.acquirer.get_options(new Stack<GridLocation>(action.source.loc));
            } else if (action.text == ATTACK) {
                // @ts-ignore
                is_valid = action.acquirer.option_fn().length > 0;
            } else if (action.text == END) {
                is_valid = true;
            }

            if (is_valid) {
                valid_actions.push(action);
            }
        }
        return valid_actions[0];
    }

    // TODO: Get smart - optimization criteria for action input.
    _select_action_input(arr: Array<ISelectable>): ISelectable {
        return arr[arr.length-1];
    }
}
