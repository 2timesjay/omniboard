import { ISelectable } from "./core";
import { InputOptions, InputSelection } from "./input";
import { IState } from "./state";

export interface IPhase {
    current_inputs: Array<InputSelection<ISelectable>>; // TODO: Fix typing.
    run_phase: (state: IState, cur_team: number) => Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>>;
}