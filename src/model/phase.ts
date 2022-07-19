import { BaseDisplayHandler } from "../view/display_handler";
import { ISelectable, Stack } from "./core";
import { Effect } from "./effect";
import { IInputAcquirer, IInputStep, InputOptions, InputSelection } from "./input";
import { BaseState, IState } from "./state";

type GeneralInputStep = IInputStep<ISelectable, ISelectable>

export interface Inputs {
    input_steps: Stack<GeneralInputStep>;
    push_input: (input_step: GeneralInputStep) => void;
    // TODO: Standard meaning of "pop"
    pop_input: () => void;
    peek: () => GeneralInputStep;
    reset: () => void;
};

// TODO: Bundle acquirers + InputState + Input Type info into a new class.
// TODO: Label input selections based on InputState
export class BaseInputs implements Inputs {
    base_step_factory: () => GeneralInputStep;
    input_steps: Stack<GeneralInputStep>;

    constructor(base_step_factory: () => GeneralInputStep) {
        this.base_step_factory = base_step_factory;
        this.input_steps = new Stack(base_step_factory());
    }

    push_input(input_step: GeneralInputStep) {
        this.input_steps.push(input_step)
    }

    pop_input() {
        this.input_steps = this.input_steps.pop();
    }

    peek(): GeneralInputStep {
        return this.input_steps.value;
    }

    reset() {
        this.input_steps = new Stack(null);
    }
}

type AnyGenerator<T, U, V> = Generator<T, U, V> | AsyncGenerator<T, U, V>

export interface IPhase {
    current_inputs: Inputs;
    pending_inputs: InputSelection<ISelectable>;
    run_phase: (state: IState, cur_team: number) => AnyGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>>;
}

/**
 * Phase is simplified to allow exploration of input acquisition.
 */
export class BasePhase implements IPhase {
    current_inputs: BaseInputs;
    _current_acquirer: IInputAcquirer<ISelectable>;
    display_handler: BaseDisplayHandler;

    constructor() {
        this.current_inputs = new BaseInputs();
    }

    set_display_handler(display_handler: BaseDisplayHandler) {
        this.display_handler = display_handler;
    }

    inputs_to_effects(inputs: BaseInputs): Array<Effect> {
        throw new Error("Function not implemented.");
    }

    phase_condition(): boolean {
        return true;
    }

    // TODO: Maybe move into partial_inputs
    get pending_inputs(): InputSelection<ISelectable> {
        if (this._current_acquirer == null) {
            return null;
        } else { 
            return this._current_acquirer.current_input;
        }
    }    

    async * run_phase(
        state: BaseState
    ): AsyncGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        while (this.phase_condition()) {
            console.log("Running Subphase")
            var inputs: BaseInputs = yield *this.run_subphase(state); 
            console.log("Resetting Inputs")
            var effects = this.inputs_to_effects(inputs);
            console.log("Effects: ", effects);
            this.current_inputs.reset();           

            // TODO: Side effect that queue display doesn't clear before effect execution
            await state.process(effects, this.display_handler).then(() => {});
        }
    }

    // TODO: Explicit and well-typed, but some generic patterns could be abstracted. 
    * run_subphase(
        state: BaseState
    ): Generator<InputOptions<ISelectable>, BaseInputs, InputSelection<ISelectable>> {
        throw new Error("Function not implemented.");
    }
}