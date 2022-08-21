import { Action } from "../model/action";
import { ISelectable, Stack } from "../model/core";
import { Confirmation, IInputAcquirer, IInputNext, IInputStep, InputOptions, InputRequest, InputResponse, InputSelection, InputStop, isInputSignal, SimpleInputAcquirer } from "../model/input";
import { AbstractBasePhase, BaseInputs, Inputs, IPhase } from "../model/phase";
import { GridLocation, GridSpace } from "../model/space";
import { BoardState, IState } from "../model/state";
import { Unit } from "../model/unit";
import { DisplayState } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { DisplayMap } from "../view/broker";
import { AI } from "./tactics_ai";
import { Effect } from "../model/effect";

const INPUT_OPTIONS_CLEAR: InputOptions<ISelectable> = [];

export type InputGenerator<T> = Generator<InputOptions<T>, InputResponse<T>, InputResponse<T>>

// TODO: Replace everywhere
export type BoardAction = Action<ISelectable, BoardState>;

export class UnitInputStep implements IInputStep<Unit, BoardAction> { 
    acquirer: IInputAcquirer<Unit>;

    constructor(state: BoardState) {
        var cur_team = state.cur_team;
        var unit_options = state.units
            .filter((u) => u.team == cur_team)
            .filter((u) => u.is_alive())
            .filter((u) => !u.is_exhausted());
        this.acquirer = new SimpleInputAcquirer<Unit>(() => unit_options, false);
    }

    get input(): Unit {
        var input_response = this.acquirer.current_input;
        if (isInputSignal(input_response)) {
            return null;
        } else if (input_response instanceof Stack) { // TODO: shouldn't have to check this
            return input_response.value;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: ActionInputStep): Array<Effect> {
        var a = next_step.input;
        // TODO: ???
        return a.digest_fn(next_step.input.acquirer.current_input);
    };
    
    get_next_step(state: BoardState): ActionInputStep {
        return new ActionInputStep(state, this.input);
    }
}

export class ActionInputStep implements IInputStep<BoardAction, ISelectable> {
    acquirer: IInputAcquirer<BoardAction>;
    
    constructor(state: BoardState, source: Unit) {
        var action_options = source.actions
            .filter((a) => a.enabled);
        this.acquirer = new SimpleInputAcquirer<Action<ISelectable, BoardState>>(
            () => action_options, false
        );
    }

    get input(): BoardAction {
        var input_response = this.acquirer.current_input;
        if (isInputSignal(input_response)) {
            return null;
        } else if (input_response instanceof Stack) { // TODO: shouldn't have to check this
            return input_response.value;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: TargetInputStep): null {
        return null;
    }

    get_next_step(state: BoardState): TargetInputStep {
        return new TargetInputStep(this.input.acquirer);
    }

}

export class TargetInputStep implements IInputStep<ISelectable, null> {
    acquirer: IInputAcquirer<ISelectable>;
    
    constructor(acquirer: IInputAcquirer<ISelectable>) {
        this.acquirer = acquirer
    }

    get input(): ISelectable {
        var input_response = this.acquirer.current_input;
        if (isInputSignal(input_response)) {
            return null;
        } else if (input_response instanceof Stack) { // TODO: shouldn't have to check this
            return input_response.value;
        } else {
            return input_response;
        }
    }
    

    consume_children(next_step: InputStop): ISelectable {
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
    
    get_next_step(state: BoardState): InputStop {
        return new InputStop();
    }
}


export class TacticsPhase extends AbstractBasePhase {
    constructor(state: BoardState) {
        super();
        console.log("BoardState team: ", state.cur_team)
        // TODO: Do I need this? nullish until built in subphase, currently.
        this.current_inputs = new BaseInputs(this.base_step_factory);
        this.current_inputs.reset(state);
    }

    get base_step_factory(): (state: IState) => IInputNext<ISelectable> {
        return (state: BoardState) => new UnitInputStep(state);
    }
}


/**
 * Repeatedly executes TacticsPhases. Key point where we await InputRequest.
 * Also calls various display_handler refresh subroutines, and evaluates gameEnd.
 */
export class TacticsController {
    state: BoardState;
    ai: AI;

    constructor(state: BoardState) {
        this.state = state;
        this.state.cur_team = 0;
        // Set up enemy team (team 1) AI
        this.ai = new AI(1, state);
    }

    /**
     * input_bridge == controller. Calls phases in a loop and requests input
     * then feeds input to display_handler.
     */
    async run(
        phase: TacticsPhase, 
        input_request: InputRequest<ISelectable>,
        display_handler: DisplayHandler,
    ) {
        phase.set_display_handler(display_handler);
        display_handler.on_selection(null, phase);
        var team = 0;
        while (true) {
            // TODO: Handle more elegantly
            this.state.cur_team = team;
            var phase_runner = phase.run_phase(this.state);
            // TODO: lol what a mess
            var input_options = await phase_runner.next();

            if (team != this.ai.team) { // Human
                while(input_options.value){
                    var input_selection = await input_request(input_options.value);
                    input_options = await phase_runner.next(input_selection);
                    display_handler.on_selection(input_selection, phase);
                }
            } else if (team == this.ai.team) { // AI
                while (input_options.value) {      
                    var input_selection = await this.ai.get_input(
                        phase, 
                        input_options.value, 
                        phase.current_inputs,
                    );
                    input_options = await phase_runner.next(input_selection);
                    display_handler.on_selection(input_selection, phase);
                }
            } 

            display_handler.on_phase_end(phase);
            if (this.victory_condition(team)) {
                console.log("VICTORY!!!: ", team);
                break;
            } else if (this.defeat_condition(team)) {
                console.log("DEFEAT!!! ", team);
                break;
            }
            team = (team + 1) % 2; // Switch teams
        }  
        // NOTE: Don't forget, input_request also influences display state!
        input_request(INPUT_OPTIONS_CLEAR);
        display_handler.on_game_end();
    }

    // TODO: This and defeat -> ternary enum?
    victory_condition(team: number): boolean {
        var other_team = (team + 1) % 2;
        var enemy_units = this.state.units
            .filter((u) => u.team == other_team)
            .filter((u) => u.is_alive());
        console.log("Num enemy: ", enemy_units.length)
        return enemy_units.length == 0;
    }

    defeat_condition(team: number): boolean {
        var ally_units = this.state.units
            .filter((u) => u.team == team)
            .filter((u) => u.is_alive());
        console.log("Num ally: ", ally_units.length);
        return ally_units.length == 0;
    }
}