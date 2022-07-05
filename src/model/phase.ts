import { ISelectable } from "./core";
import { InputOptions, InputSelection } from "./input";
import { IState } from "./state";

export type Inputs = {};

type AnyGenerator<T, U, V> = Generator<T, U, V> | AsyncGenerator<T, U, V>

export interface IPhase {
    current_inputs: Inputs;
    pending_inputs?: InputSelection<ISelectable>;
    run_phase: (state: IState, cur_team: number) => AnyGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>>;
}