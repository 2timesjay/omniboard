import { ISelectable, Stack } from "../model/core";
import { Effect } from "../model/effect";
import { InputOptions, InputRequest, InputSelection, SequentialInputAcquirer, SimpleInputAcquirer } from "../model/input";
import { Inputs, IPhase } from "../model/phase";
import { GridLocation } from "../model/space";
import { IState } from "../model/state";
import { DisplayHandler } from "../view/display_handler";
import { Entity } from "./playground_entity";
import { LineSpace } from "./playground_space";
import { PlaygroundState } from "./playground_state";

type SelectionLabel = ContinuousSelectionLabel | DiscreteSelectionLabel;

enum ContinuousSelectionLabel { }

enum DiscreteSelectionLabel {
    Entity = 0,
    Location = 1,
    Confirmation = 2,
}

enum PlaygroundInputState {
    Entity = 0,
    Location = 1,
    Confirmation = 2,
}

interface LabeledSelection {
    label?: SelectionLabel;
    selection: InputSelection<ISelectable>;
}

// TODO: Label input selections based on InputState
class PlaygroundInputs implements Inputs {
    input_state: PlaygroundInputState;
    // input_queue: Array<LabeledSelection>;
    input_queue: Array<InputSelection<ISelectable>>;

    constructor() {
        this.input_state = 0;
        this.input_queue = [];
    }

    push_input(input: InputSelection<ISelectable>) {
        this.input_queue.push(input);
        this.input_state += 1;
    }

    pop_input() {
        this.input_queue.pop();
        this.input_state = Math.max(0, this.input_state - 1);
    }

    consume_input(): InputSelection<ISelectable> {
        return this.input_queue.shift();
    }

    peek(): InputSelection<ISelectable> {
        return this.input_queue[0];
    }

    reset() {
        this.input_queue.length = 0;
        this.input_state = 0;
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
        state: PlaygroundState
    ): AsyncGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        while (this.phase_condition()) {
            console.log("Running Subphase")
            var inputs: PlaygroundInputs = yield *this.run_subphase(state); 
            console.log("Resetting Inputs")
            this.current_inputs.reset();           
            var effects = this.inputs_to_effects(inputs);
            console.log("Effects: ", effects);

            // TODO: Side effect that queue display doesn't clear before effect execution
            await state.process(effects, this.display_handler).then(() => {});
        }
    }

    // TODO: Explicit and well-typed, but some generic patterns could be abstracted. 
    * run_subphase(
        state: PlaygroundState
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
            // TODO: Replicate robustness of tactics_controller
            if (this.current_inputs.input_state == PlaygroundInputState.Entity) {
                var selection = yield *this.entity_selection(state);
                this.current_inputs.push_input(selection);
            } else if (this.current_inputs.input_state == PlaygroundInputState.Location) {
                var selection = yield *this.location_selection(state);
                this.current_inputs.push_input(selection);
            } else if (this.current_inputs.input_state == PlaygroundInputState.Confirmation) {
                break;
            }
        }
        return this.current_inputs;
    }

    // TODO: further simplify to SimpleInputAcquirer direct usage?
    * entity_selection (
        state: PlaygroundState
    ): Generator<Array<ISelectable>, ISelectable, ISelectable> {
        var selection_options: Array<ISelectable> = state.entities;
        var acquirer = new SimpleInputAcquirer<ISelectable>(() => selection_options, false);
        var selection = yield *acquirer.input_option_generator();
        return selection;
    }
    
    * location_selection (
    state: PlaygroundState
    ): Generator<Array<ISelectable>, ISelectable, ISelectable> { // TODO: Type alias
        // @ts-ignore
        var source : Entity = this.current_inputs.peek();
        var increment_fn = (stack: Stack<GridLocation>): Array<GridLocation> => {
            var entities = state.entities;
            // @ts-ignore
            var space: LineSpace = state.space;
            // @ts-ignore
            var neighborhood = space.getNaturalNeighborhood(stack.value);
            var occupied = new Set(entities.map((u) => u.loc));
            var options = neighborhood
                .filter(l => !occupied.has(l))
                .filter(l => l.traversable);
            return options;
        };
        var termination_fn = (stack: Stack<GridLocation>): boolean => {
            return stack.depth >= 3; // + 1 because stack starts at root.
        }
        var acquirer = new SequentialInputAcquirer<GridLocation>(
            increment_fn,
            termination_fn,
        )
        // @ts-ignore
        var selection = yield *acquirer.input_option_generator(new Stack(source.loc));
        return selection;
    }
}

/**
 * Repeatedly executes TacticsPhases. Key point where we await InputRequest.
 * Also calls various display_handler refresh subroutines, and evaluates gameEnd.
 */
export class PlaygroundController {
    state: PlaygroundState;

    constructor(state: PlaygroundState) {
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