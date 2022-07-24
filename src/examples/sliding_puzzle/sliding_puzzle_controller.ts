import { ISelectable, Stack } from "../../model/core";
import { Effect } from "../../model/effect";
import { IInputAcquirer, IInputStop, IInputStep, InputSelection, InputSignal, isInputSignal, SimpleInputAcquirer, InputStop, InputOptions, InputRequest, IInputNext } from "../../model/input";
import { AbstractBasePhase, BaseInputs, IPhase } from "../../model/phase";
import { GridLocation } from "../../model/space";
import { IState } from "../../model/state";
import { sync_sleep } from "../../model/utilities";
import { BaseDisplayHandler } from "../../view/display_handler";
import { SlidingPuzzleMoveEffect } from "./sliding_puzzle_effect";
import { SlidingPuzzleShuffler } from "./sliding_puzzle_shuffler";
import { Piece, SlidingPuzzleState } from "./sliding_puzzle_state";


const INPUT_OPTIONS_CLEAR: InputOptions<ISelectable> = [];


export class PieceInputStep implements IInputStep<Piece, GridLocation> { 
    acquirer: IInputAcquirer<Piece>;

    constructor(state: SlidingPuzzleState) {
        var occupied = new Set(state.entities.map(e => e.loc));
        var open_locs = state.space.to_array().filter((l) => !occupied.has(l))
        var open_locs_neighbors = new Set(
            open_locs.flatMap(loc => state.space.getGridNeighborhood(loc))
        );
        var movable_pieces = state.entities.filter(
            e => open_locs_neighbors.has(e.loc));
        this.acquirer = new SimpleInputAcquirer(
            () => movable_pieces, false
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
        return new GridLocationInputStep(state, this.input, true);
    }
}

export class GridLocationInputStep implements IInputStep<GridLocation, null> {
    acquirer: IInputAcquirer<GridLocation>;

    constructor(state: SlidingPuzzleState, piece: Piece, auto_select: boolean = false) {
        // Restrict to unoccupied neighbors of source piece.
        var occupied = new Set(state.entities.map(e => e.loc));
        var open_neighbor_locs = state.space
            .getGridNeighborhood(piece.loc)
            .filter(loc => !occupied.has(loc));
        // TODO: Is this the right place for auto_select?
        this.acquirer = new SimpleInputAcquirer(
            () => open_neighbor_locs, false, auto_select,
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
        // Player input
        display_handler.refresh();
        phase.set_display_handler(display_handler);
        display_handler.on_selection(null, phase);
        
        /**
         * Automated Shuffle performed.
         * TODO: Make invisible to user, or otherwise fix buggy graphics
         * TODO: Optimize Shuffle, avoid backtracks.
         * TODO: delineate "turns"/"subphases" since there's no control handoff.
         * TODO: Image loads after first shuffle, so missing piece changes randomly (fix).
         */
        var shuffler = new SlidingPuzzleShuffler(this.state);
        var phase_runner = phase.run_phase(this.state);
        var input_options = await phase_runner.next();

        
        // sync_sleep(1000);
        // console.log("Finished sync sleep")
        // TODO: Factor into "setup"
        var sel_count = 20;
        while (sel_count > 0) {
            console.log("options", input_options)
            console.log("sel_count", sel_count)
            while (input_options.value) {      
                var input_selection = await shuffler.get_input(
                    phase, 
                    input_options.value, 
                    phase.current_inputs,
                );
                input_options = await phase_runner.next(input_selection);
                display_handler.on_selection(input_selection, phase);
            }
            sel_count--;
            phase_runner = phase.run_phase(this.state);
            input_options = await phase_runner.next();
            display_handler.refresh();
        }

        // Note: No Victory Conditions. Go forever.
        display_handler.refresh();
        while (true) {
            display_handler.refresh();
            phase_runner = phase.run_phase(this.state);
            // TODO: lol what a mess
            var input_options = await phase_runner.next();
            // TODO: So simple it was fine running only this internal subphase loop.
            while(input_options.value){
                var input_selection = await input_request(input_options.value);
                input_options = await phase_runner.next(input_selection);
                display_handler.on_selection(input_selection, phase);
            }
            if (this.victory_condition()) {
                console.log("Victory!")
                // NOTE: Don't forget, input_request also influences display state!
                input_request(INPUT_OPTIONS_CLEAR);
                display_handler.on_game_end();
                break;
            }
        }  
    }
    
    // TODO: This and defeat -> ternary enum?
    victory_condition(): boolean {
        var victory = this.state.entities
            .map(e => e.loc == e.original_loc)
            .reduce((l, r) => l && r)
        return victory
    }
}