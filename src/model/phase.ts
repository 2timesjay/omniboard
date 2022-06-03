import { ISelectable } from "./core";
import { InputOptions, InputSelection } from "./input";
import { IState } from "./state";

type AnyGenerator<T, U, V> = Generator<T, U, V> | AsyncGenerator<T, U, V>

export interface IPhase {
    current_inputs: Array<InputSelection<ISelectable>>; // TODO: Fix typing.
    run_phase: (state: IState, cur_team: number) => AnyGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>>;
}