import { Action, ATTACK } from "../model/action";
import { ISelectable } from "../model/core";
import { InputRequest, synthetic_input_getter } from "../model/input";
import { BoardState } from "../model/state";
import { Unit } from "../model/unit";


export class AI {
    team: number;
    state: BoardState;
    unit_getter: InputRequest<Unit>;
    action_getter: InputRequest<Action<ISelectable, BoardState>>;
    action_input_getter: InputRequest<ISelectable>;

    constructor(team: number, state: BoardState) {
        this.team = team;
        this.state = state;
        this.unit_getter = synthetic_input_getter<Unit>(this._select_unit);
        this.action_getter = synthetic_input_getter<Action<ISelectable, BoardState>>(this._select_action);
        this.action_input_getter = synthetic_input_getter<ISelectable>(this._select_action_input);
    }

    _select_unit(arr: Array<Unit>): Unit {
        return arr[0];
    }

    _select_action(arr: Array<Action<ISelectable, BoardState>>): Action<ISelectable, BoardState> {
        // TODO: Validate the action has valid input; do in phase.action_selection()
        for (var action of arr) {
            var is_valid = true;
            if (action.text == ATTACK) {
                // @ts-ignore
                is_valid = action.acquirer.option_fn().length > 0;
            }
            if (is_valid) {
                return action;
            }
        }
    }

    _select_action_input(arr: Array<ISelectable>): ISelectable {
        return arr[0];
    }
}
