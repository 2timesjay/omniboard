import { ISelectable, Stack } from "../../model/core";
import { Effect } from "../../model/effect";
import { IInputAcquirer, IInputStop, IInputStep, InputSelection, InputSignal, isInputSignal, SimpleInputAcquirer, InputStop, InputOptions, InputRequest, IInputNext } from "../../model/input";
import { AbstractBasePhase, BaseInputs, IPhase } from "../../model/phase";
import { GridLocation } from "../../model/space";
import { IState } from "../../model/state";
import { BaseDisplayHandler } from "../../view/display_handler";
import { SlidingPuzzleMoveEffect } from "./sliding_puzzle_effect";
import { Piece, SlidingPuzzleState } from "./sliding_puzzle_state";

class PieceInputStep implements IInputStep<Piece, GridLocation> { 
    acquirer: IInputAcquirer<Piece>;

    constructor(state: SlidingPuzzleState) {
        this.acquirer = new SimpleInputAcquirer(
            () => state.entities, false
        ); 
    }

    get input(): Piece {
        var input_response = this.acquirer.current_input;
        if (isInputSignal(input_response)) {
            return null;
        } else if (input_response instanceof Stack) { // TODO: shouldn't have to check this
            return input_response.value;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: GridLocationInputStep): Array<Effect> {
        return [new SlidingPuzzleMoveEffect(this.input, next_step.input)];
    };
    
    get_next_step(state: SlidingPuzzleState): GridLocationInputStep {
        return new GridLocationInputStep(state);
    }
}

class GridLocationInputStep implements IInputStep<GridLocation, null> {
    acquirer: IInputAcquirer<GridLocation>;

    constructor(state: SlidingPuzzleState) {
        this.acquirer = new SimpleInputAcquirer(
            () => state.space.to_array(), false
        ); 
    }

    get input(): GridLocation {
        var input_response = this.acquirer.current_input;
        if (isInputSignal(input_response)) {
            return null;
        } else if (input_response instanceof Stack) { // TODO: shouldn't have to check this
            return input_response.value;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: InputStop): GridLocation {
        if (InputStop == null) {
            throw new Error("Must pass InputStop to verify Inputs are complete.");
        }
        var input_response = this.acquirer.current_input;
        if (isInputSignal(input_response)) {
            return null;
        } else if (input_response instanceof Stack) { // TODO: shouldn't have to check this
            return input_response.value;
        } else {
            return input_response;
        }
    }
    
    get_next_step(state: SlidingPuzzleState): InputStop {
        return new InputStop();
    }
}

/**
 * Phase is simplified to allow exploration of input acquisition.
 */
export class SlidingPuzzlePhase extends AbstractBasePhase {
    constructor(state: SlidingPuzzleState) {
        super();
        // TODO: Do I need this? nullish until built in subphase, currently.
        this.current_inputs = new BaseInputs(this.base_step_factory);
        this.current_inputs.reset(state);
    }

    get base_step_factory(): (state: IState) => IInputNext<ISelectable> {
        return (state: SlidingPuzzleState) => new PieceInputStep(state);
    }
}

/**
 * Repeatedly executes TacticsPhases. Key point where we await InputRequest.
 * Also calls various display_handler refresh subroutines, and evaluates gameEnd.
 */
export class SlidingPuzzleController {
    state: SlidingPuzzleState;

    constructor(state: SlidingPuzzleState) {
        this.state = state;
    }

    /**
     * input_bridge == controller. Calls phases in a loop and requests input
     * then feeds input to display_handler.
     */
    async run(
        phase: SlidingPuzzlePhase, 
        input_request: InputRequest<ISelectable>,
        display_handler: BaseDisplayHandler,
    ) {
        display_handler.refresh();
        phase.set_display_handler(display_handler);
        display_handler.on_selection(null, phase);
        // Note: No Victory Conditions. Go forever.
        display_handler.refresh();
        while (true) {
            display_handler.refresh();
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