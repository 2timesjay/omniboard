import { BaseDisplayHandler } from "../view/display_handler";
import { ISelectable, Stack } from "./core";
import { Effect } from "../model/effect";
import { IInputAcquirer, IInputNext, IInputStep, InputOptions, InputSignal, isInputStep } from "./input";
import { BaseState, IState } from "./state";

export interface Inputs {
    input_steps: Stack<IInputNext<ISelectable>>;
    push_input: (input_step: ISelectable, state: IState) => void;
    // TODO: Standard meaning of "pop"
    pop_input: () => void;
    peek: () => IInputNext<ISelectable>;
    reset: (state: IState) => void;
};

export interface ProcessedInputs {
}

// TODO: Bundle acquirers + InputState + Input Type info into a new class.
// TODO: Label input selections based on InputState
export class BaseInputs implements Inputs {
    base_step_factory: (state: IState) => IInputNext<ISelectable>;
    input_steps: Stack<IInputNext<ISelectable>>;

    constructor(
        base_step_factory: (state: IState) => IInputNext<ISelectable>,
    ) {
        this.base_step_factory = base_step_factory;
    }

    // TODO: State needed for all next_steps; smuggle in more elegantly
    push_input(input: ISelectable, state: IState) {
        var head = this.peek();
        if (isInputStep(head)) {
            // TODO: This should always be true already? Or acquirer should have it.
            // head.input = input;
            var next = head.get_next_step(state) ;
            this.input_steps = this.input_steps.push(next);
        }
    }

    pop_input() {
        // TODO: Pop leaves item in "selected" or queued state.
        if (this.input_steps.parent != null) {
            this.input_steps = this.input_steps.pop();
        }
    }

    // TODO: Convert to `get head()`
    peek(): IInputNext<ISelectable> {
        return this.input_steps.value;
    }

    reset(state: IState): void {
        this.input_steps = new Stack(this.base_step_factory(state));
    }

    is_stopped() {
        var head = this.input_steps.peek();
        return !isInputStep(head) && head != null;
    }
}

export type AnyGenerator<T, U, V> = Generator<T, U, V> | AsyncGenerator<T, U, V>

export interface IPhase {
    current_inputs: Inputs;
    pending_inputs: ISelectable;
    run_phase: (state: IState, cur_team: number) => AnyGenerator<InputOptions<ISelectable>, void, ISelectable>;
}

// TODO: Complicated state around class members, e.g. current_inputs is used several ways.
export class AbstractBasePhase implements IPhase {
    // TODO: Must make Inputs class Generic
    current_inputs: BaseInputs;
    _current_acquirer: IInputAcquirer<ISelectable>;
    display_handler: BaseDisplayHandler;

    constructor() {
    }

    set_display_handler(display_handler: BaseDisplayHandler) {
        this.display_handler = display_handler;
    }

    phase_condition(state: BaseState): boolean {
        return true;
    }

    // TODO: Is this safe enough?
    get current_acquirer(): IInputAcquirer<ISelectable> {
        var head = this.current_inputs.peek();
        if (isInputStep(head)) {
            return head.acquirer;
        } else {
            return null;
        }
    }

    // TODO: Maybe move into partial_inputs
    get pending_inputs(): ISelectable {
        if (this.current_acquirer == null) {
            return null;
        } else { 
            return this.current_acquirer.current_input;
        }
    }    

    async * run_phase(
        state: BaseState
    ): AsyncGenerator<InputOptions<ISelectable>, void, ISelectable> {
        console.log("Running Phase")
        while (this.phase_condition(state)) {
            var inputs: BaseInputs = yield *this.run_subphase(state); 
            var effects = this.digest_inputs();
            this.current_inputs.reset(state);  

            // TODO: Side effect that queue display doesn't clear before effect execution
            await state.process(effects, this.display_handler).then(() => {});
        }
    }

    digest_inputs(): Array<Effect> {
        var inputs = this.current_inputs;
        var input_steps = inputs.input_steps;
        if (!inputs.is_stopped()) {
            // NOTE: Must receive inputs with InputStop.
            return null;
        } 

        // TODO: Typing is preeeeetty loose here.
        var partial_digest = input_steps.value;
        var parent_step = input_steps.parent.value;
        // TODO: Whole section is messy and incorrect; Rethink partial_digest
        while(parent_step != null && isInputStep(parent_step)) {
            console.log("consuming children of ", parent_step)
            partial_digest = parent_step.consume_children(input_steps.value)
            console.log("partial digest: ", partial_digest)
            input_steps = input_steps.pop();
            if (input_steps.parent != null){
                parent_step = input_steps.parent.value;
            } else {
                break
            }
        }
        // @ts-ignore final partial_digest is effect list (see todo above)
        return partial_digest;
    }

    get base_step_factory(): (state: IState) => IInputNext<ISelectable> {
        throw new Error("Function not implemented.");
    }

    // TODO: Explicit and well-typed, but some generic patterns could be abstracted. 
    * run_subphase(
        state: BaseState
    ): Generator<InputOptions<ISelectable>, BaseInputs, ISelectable> {
        // TODO: Does it make more sense to reset/initialize in `run_phase`?
        this.current_inputs = new BaseInputs(this.base_step_factory);
        this.current_inputs.reset(state);
        while (!this.current_inputs.is_stopped()) {
            // @ts-ignore InputSignal not handled
            var input_response = yield *this.current_acquirer.input_option_generator();
            if (input_response.signal != InputSignal.Reject) {
                this.current_inputs.push_input(input_response, state);
            } else {
                // TODO: Pop leaves item in queued state
                this.current_inputs.pop_input();
            }
        };
        return this.current_inputs;
    }
}