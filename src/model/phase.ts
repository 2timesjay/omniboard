import { ISelectable, Stack } from "./core";
import { acquire_flat_input, async_input_getter, CallbackSelectionFn, InputOptions, InputRequest, InputSelection } from "./input";
import { GridLocation } from "./space";
import { Action, BoardState, Effect, IState } from "./state";
import { Unit } from "./unit";

export interface IPhase {
    current_inputs: Array<InputSelection<ISelectable>>; // TODO: Fix typing.
    run_phase: (state: IState, cur_team: number) => Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>>;
}