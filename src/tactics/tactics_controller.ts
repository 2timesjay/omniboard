import { Action } from "../model/action";
import { ISelectable, Stack } from "../model/core";
import { Confirmation, InputOptions, InputRequest, InputSelection, SimpleInputAcquirer } from "../model/input";
import { Inputs, IPhase } from "../model/phase";
import { GridLocation, GridSpace } from "../model/space";
import { BoardState, IState } from "../model/state";
import { Unit } from "../model/unit";
import { DisplayState } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { DisplayMap } from "../view/input";
import { AI } from "./tactics_ai";

const INPUT_OPTIONS_CLEAR: InputOptions<ISelectable> = [];

export type InputGenerator<T> = Generator<InputOptions<T>, InputSelection<T>, InputSelection<T>>

// TODO: Replace everywhere
export type BoardAction = Action<ISelectable, BoardState>;

export enum InputState {
    NoneSelected = 0,
    UnitSelected = 1,
    ActionSelected = 2,
    ActionInputSelected = 3,
}

export interface TacticsInputs extends Inputs {
    unit?: Unit,
    action?: Action<ISelectable, BoardState>,
    action_input?: InputSelection<ISelectable>,
}

/**
 * Phase is same as typical board game sense.
 * Tactics phase proceeds as follows for a given team:
 *  1) Select a team member
 *  2) Select a action
 *  3) follow action's input requests
 *  4) execute action's effects
 *  5) repeat 1 until team member's actions are exhausted.
 */
export class TacticsPhase implements IPhase {
    current_inputs: TacticsInputs;
    input_state: InputState;
    display_handler: DisplayHandler;

    constructor() {
        this.current_inputs = {}
        this.input_state = InputState.NoneSelected;
    }

    set_display_handler(display_handler: DisplayHandler) {
        this.display_handler = display_handler;
    }

    // TODO: Efficient way to represent "sequential state machine" without GOTO
    async * run_phase(state: BoardState, cur_team: number
    ): AsyncGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        console.log("TacticsPhase.run_phase");
        var team_units = state.units
            .filter((u) => u.team == cur_team)
            .filter((u) => u.is_alive());
        // NOTE: Clear statuses on turn start.
        team_units.forEach((u) => u.update_statuses());
        // NOTE: Re-confirm u.is_alive since unit can die while un-exhausted.
        while(Array.from(team_units).filter((u) => !u.is_exhausted() && u.is_alive()).length) {
            // TODO: yield a special "subphase end" signal.
            var inputs: TacticsInputs = yield *this.run_subphase(state, cur_team);
            console.log("Inputs: ", inputs);

            var action: Action<ISelectable, BoardState> = inputs.action;
            var action_input = inputs.action_input;
            var effects = action.digest_fn(action_input);

            console.log("Effects: ", effects);

            // TODO: Side effect that queue display doesn't clear before effect execution
            await state.process(effects, this.display_handler).then(() => {});
            // TODO: Slightly messy to couple this with state.
            this.current_inputs = {};
            console.log("BoardState: ", state);
            console.log("Units: ", team_units, " Team: ", cur_team);
        }
        team_units.forEach((u) => u.reset_actions());
    }

    // TODO: Explicit and well-typed, but some generic patterns could be abstracted. 
    * run_subphase(
        state: BoardState, cur_team: number
    ): Generator<InputOptions<ISelectable>, TacticsInputs, InputSelection<ISelectable>> {
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
            // Note: Fine to hit these all in one loop
            if (this.input_state == InputState.NoneSelected){
                // @ts-ignore
                var unit = yield *this.unit_selection(state, cur_team);
                if (unit != null) {
                    this.current_inputs.unit = unit;
                    this.increment_state();
                } else {
                    delete this.current_inputs.unit;
                    this.decrement_state();
                }
            }
            if (this.input_state == InputState.UnitSelected){
                // @ts-ignore
                var action = yield *this.action_selection(unit);
                if (action != null) {
                    this.current_inputs.action = action;
                    this.increment_state();
                } else {
                    delete this.current_inputs.action;
                    this.decrement_state();
                }
            }
            if (this.input_state == InputState.ActionSelected){
                var action_input = yield *this.action_input_selection(this.current_inputs, action);
                if (action_input != null) {
                    this.current_inputs.action_input = action_input;
                    this.increment_state();
                } else {
                    delete this.current_inputs.action_input;
                    this.decrement_state();
                }
            }
            if (this.input_state == InputState.ActionInputSelected) {
                break;
            }
        }
        this.reset_state();
        return this.current_inputs;
    }

    reset_state() {
        this.input_state = 0;
    }

    increment_state() {
        this.input_state += 1;
        this.input_state = Math.min(3, this.input_state);
    }

    decrement_state() {
        this.input_state -= 1;
        this.input_state = Math.max(0, this.input_state);
    }

    // TODO: Unify with SimpleInputAcquirer
    * unit_selection (
        state: BoardState, cur_team: number
    ): Generator<Array<Unit>, Unit, Unit> {
        var unit_options = state.units
            .filter((u) => u.team == cur_team)
            .filter((u) => u.is_alive())
            .filter((u) => !u.is_exhausted());
        var acquirer = new SimpleInputAcquirer<Unit>(() => unit_options, false);
        var unit_sel = yield *acquirer.input_option_generator();
        var unit = unit_sel;
        return unit;
    }

    * action_selection (
        unit: Unit
    ): Generator<Array<Action<ISelectable, BoardState>>, Action<ISelectable, BoardState>, Action<ISelectable, BoardState>> {
        var action_options = unit.actions
            .filter((a) => a.enabled);
        var acquirer = new SimpleInputAcquirer<Action<ISelectable, BoardState>>(() => action_options, false);
        var action_sel = yield *acquirer.input_option_generator();
        var action = action_sel;
        return action;
    }

    * action_input_selection (
        tactics_inputs: TacticsInputs,
        action: Action<ISelectable, BoardState>,
    ): Generator<InputOptions<ISelectable>, InputSelection<ISelectable>, InputSelection<ISelectable>> {
        var action_input = yield *action.get_action_input(action.get_root(tactics_inputs));
        return action_input;
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
            var phase_runner = phase.run_phase(this.state, team);
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