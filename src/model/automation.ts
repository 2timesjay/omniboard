import { ISelectable } from "./core";
import { InputOptions, InputRequest, synthetic_input_getter, InputResponse, isInputStep } from "./input";
import { BaseInputs, IPhase } from "./phase";
import { IState } from "./state";

export class BaseAutomation {
    state: IState;
    inputs: BaseInputs;

    constructor(state: IState) {
        this.state = state;
    }

    _build_getter<U extends ISelectable>(
        selector_fn: (options: InputOptions<U>) => U
    ): InputRequest<U> {
        return synthetic_input_getter<U>(selector_fn.bind(this));
    }

    // TODO: Kind of lame; needs to be general
    get_input(
        phase: IPhase, 
        input_options: InputOptions<ISelectable>, 
        inputs: BaseInputs,
    ): Promise<InputResponse<ISelectable>> {
        this.inputs = inputs;
        if (!isInputStep(inputs.peek())) {
            console.log("SHOULD NOT REACH");
        }
        return null;
    }
}
