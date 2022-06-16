import { ISelectable } from "../model/core";
import { Effect } from "../model/effect";
import { InputOptions, InputRequest, InputSelection, SimpleInputAcquirer } from "../model/input";
import { Inputs, IPhase } from "../model/phase";
import { IState } from "../model/state";
import { DisplayHandler } from "../view/display_handler";

type SelectionLabel = ContinuousSelectionLabel | DiscreteSelectionLabel;

enum ContinuousSelectionLabel { }

enum DiscreteSelectionLabel {
    Entity = 0,
    Point = 1,
    Confirmation = 2,
}

interface LabeledSelection {
    label?: SelectionLabel;
    selection: InputSelection<ISelectable>;
}

class PlaygroundInputs implements Inputs {
    input_state: number;
    input_queue: Array<LabeledSelection>;

    constructor() {
        this.input_state = 0;
    }

    push_input(input: LabeledSelection) {
        this.input_queue.push(input);
        this.input_state += 1;
    }

    pop_input() {
        this.input_queue.pop();
        this.input_state = Math.max(0, this.input_state - 1);
    }

    consume_input(): LabeledSelection {
        return this.input_queue.shift();
    }

    reset() {
        this.input_queue.length = 0;
    }
}

/**
 * Phase is simplified to allow exploration of input acquisition.
 */
export class PlaygroundPhase implements IPhase {
    current_inputs: PlaygroundInputs;
    display_handler: DisplayHandler;

    constructor() {
        this.current_inputs = new PlaygroundInputs();
    }

    set_display_handler(display_handler: DisplayHandler) {
        this.display_handler = display_handler;
    }

    inputs_to_effects(inputs: PlaygroundInputs): Array<Effect> {
        return [];
    }

    phase_condition(): boolean {
        return true;
    }

    async * run_phase(
        state: IState
    ): AsyncGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        while (this.phase_condition()) {
            var inputs: PlaygroundInputs = yield *this.run_subphase(state);            
            var effects = this.inputs_to_effects(inputs);

            console.log("Effects: ", effects);

            // TODO: Side effect that queue display doesn't clear before effect execution
            await state.process(effects, this.display_handler).then(() => {});
        }
    }

    // TODO: Explicit and well-typed, but some generic patterns could be abstracted. 
    * run_subphase(
        state: IState
    ): Generator<InputOptions<ISelectable>, PlaygroundInputs, InputSelection<ISelectable>> {
        /**
         * Occupies one of three states:
         *  Acquiring Unit,
         *  Acquiring Actions,
         *  Acquiring ActionInputs,
         * 
         * Increment state on selection.
         * Decrement state on rejection.
         */        
        while (true) {
            var selection = yield *this.selection(state);
            var labeled_selection = {selection: selection}
            this.current_inputs.push_input(labeled_selection);
            break;
        }
        this.current_inputs.reset();
        return this.current_inputs;
    }

    // TODO: Unify with SimpleInputAcquirer
    * selection (
        state: IState
    ): Generator<Array<ISelectable>, ISelectable, ISelectable> {
        var selection_options: Array<ISelectable> = [];
        var acquirer = new SimpleInputAcquirer<ISelectable>(() => selection_options, false);
        var selection = yield *acquirer.input_option_generator();
        return selection;
    }
}

/**
 * Repeatedly executes TacticsPhases. Key point where we await InputRequest.
 * Also calls various display_handler refresh subroutines, and evaluates gameEnd.
 */
export class PlaygroundController {
    state: IState;

    constructor(state: IState) {
        this.state = state;
    }

    /**
     * input_bridge == controller. Calls phases in a loop and requests input
     * then feeds input to display_handler.
     */
    async run(
        phase: PlaygroundPhase, 
        input_request: InputRequest<ISelectable>,
        display_handler: DisplayHandler,
    ) {
        phase.set_display_handler(display_handler);
        display_handler.on_selection(null, phase);
        // Note: No Victory Conditions. Go forever.
        while (true) {
            var phase_runner = phase.run_phase(this.state);
            // TODO: lol what a mess
            var input_options = await phase_runner.next();
            while(input_options.value){
                var input_selection = await input_request(input_options.value);
                input_options = await phase_runner.next(input_selection);
                display_handler.on_selection(input_selection, phase);
            }
        }  
    }
}