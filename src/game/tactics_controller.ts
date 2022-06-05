import { Action } from "../model/action";
import { ISelectable, Stack } from "../model/core";
import { Confirmation, InputOptions, InputRequest, InputSelection, SimpleInputAcquirer } from "../model/input";
import { IPhase } from "../model/phase";
import { GridLocation, GridSpace } from "../model/space";
import { BoardState, IState } from "../model/state";
import { ATTACK, CHAIN, CHANNELED_ATTACK, END, MOVE, Unit } from "../model/unit";
import { DisplayState } from "../view/display";
import { DisplayHandler } from "../view/display_handler";
import { DisplayMap } from "../view/input";

const INPUT_OPTIONS_CLEAR: InputOptions<ISelectable> = [];

export type InputGenerator<T> = Generator<InputOptions<T>, InputSelection<T>, InputSelection<T>>

// TODO: Clean up
/**
 * Phase is same as typical board game sense.
 * Tactics phase proceeds as follows for a given team:
 *  1) Select a team member
 *  2) Select a action
 *  3) follow action's input requests
 *  4) execute action's effects
 *  5) repeat 2 until team member's actions are exhausted
 *  6) repeat 1 until all team members have moved.
 * Alternative:
 *  Re-selection allowed - 5 loops to 1.
 */
export class TacticsPhase implements IPhase {
    current_inputs: Array<InputSelection<ISelectable>>;
    display_handler: DisplayHandler;

    constructor() {
        this.current_inputs = []
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
        while(Array.from(team_units).filter((u) => !u.is_exhausted()).length) {
            var data_dict = new Map<string, any>([["state", state]]);
            // TODO: Mutable data_dict is someone messy; hidden here.
            var data_dict = yield *this.run_subphase(data_dict);

            // TODO: Should "exhaust" be control or Effect? Latter eventually.
            // TODO: Destroyed type info with this approach - fix.
            var unit = data_dict.get("unit");
            var action = data_dict.get("action");
            var final = data_dict.get("final");
            var effects = action.digest_fn(final);

            console.log("Effects: ", effects);

            // TODO: Side effect that queue display doesn't clear before effect execution
            await state.process(effects, this.display_handler).then(() => {});
            this.current_inputs.length = 0;
            console.log("BoardState: ", state);
            console.log("Units: ", state.units);
            // TODO: yield a special "subphase end" signal.
        }
        team_units.forEach((u) => u.reset_actions());
    }

    // TODO: Looks like type checking completely breaks down here. Replace with State Machine.
    * run_subphase( // TODO: Can this be streamlined? Also, document!
        data_dict: Map<string, any>,
    ): Generator<InputOptions<ISelectable>, Map<string, any>, InputSelection<ISelectable>> {
        // Immutable
        var pending = [
            {
                result_label: "unit",
                args_list: ["state"],
                gen_fn: this.unit_selection,
            },
            {
                result_label: "action",
                args_list: ["unit"],
                gen_fn: this.action_selection,
            },
            {
                result_label: "final",
                args_list: ["unit", "action"],
                gen_fn: this.final_input_selection,
            }
        ]
        var input_pointer = 0;
        while (input_pointer < pending.length) {
            var cur_ia_dict = pending[input_pointer];
            var gen_fn = cur_ia_dict.gen_fn;
            var args_list = cur_ia_dict.args_list;
            var data_list = args_list.map((arg) => data_dict.get(arg));
            var result_label = cur_ia_dict.result_label;
            var cur_ia = gen_fn.apply(this, data_list);
            var result = yield *cur_ia; // TODO: Harmonize naming w/InputAcquirer
            var REJECT_SIGNAL = result == null;
            if (REJECT_SIGNAL) { // NULL INPUT
                console.log("Subphase Backward")
                // NOTE: data_dict isn't cleared - may be important
                input_pointer = Math.max(input_pointer - 1, 0); 
                this.current_inputs.pop();
            } else { // VALID INPUT
                // TODO: Can I fully render current_input (including in-progress) here?
                console.log("Subphase Forward")
                data_dict.set(result_label, result);
                this.current_inputs.push(result);
                input_pointer += 1;
            }
        }
        return data_dict;
    }

    // TODO: Unify with SimpleInputAcquirer
    * unit_selection (
        state: BoardState,
    ): Generator<Array<Unit>, Unit, Unit> {
        var unit_options = state.units
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

    * final_input_selection (
        unit: Unit,
        action: Action<ISelectable, BoardState>,
    ): Generator<InputOptions<ISelectable>, InputSelection<ISelectable>, InputSelection<ISelectable>> {
        // input_option_generator requires Stack, not just any InputSelection
        var root = null;
        // TODO: Use enum or other better action identification
        // TODO: Handle as data that's part of action?
        // TODO: use match syntax or case syntax
        if (action.text == MOVE) {
            var location_stack_root = new Stack(unit.loc);
            root = location_stack_root;
        } else if (action.text == ATTACK) {
            var unit_root = unit;
            root = unit_root;
        } else if (action.text == CHANNELED_ATTACK) {
            var unit_stack_root = new Stack(unit);
            root = unit_stack_root;
        } else if (action.text == CHAIN) {
            var unit_stack_root = new Stack(unit);
            root = unit_stack_root;
        } else if (action.text == END) {
            var confirmation_root = new Confirmation();
            root = confirmation_root;
        }
        // TODO: Revise action to simply return selected input stack; handle digest in sub-phase.
        // @ts-ignore Unit | Stack<GridLocation>
        var final_inputs = yield *action.get_final_input(root);
        return final_inputs;
    }
}

/**
 * Repeatedly executes TacticsPhases. Key point where we await InputRequest.
 * Also calls various display_handler refresh subroutines, and evaluates gameEnd.
 */
export class TacticsController {
    state: BoardState;

    constructor(state: BoardState) {
        this.state = state;
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
            while(input_options.value){
                var input_selection = await input_request(input_options.value);
                input_options = await phase_runner.next(input_selection);
                display_handler.on_selection(input_selection, phase);
            }
            display_handler.on_phase_end(phase);
            if (this.victory_condition(team)) {
                console.log("VICTORY!!!");
                break;
            } else if (this.defeat_condition(team)) {
                console.log("DEFEAT!!!");
                break;
            }
            // TODO: Enemy becomes selectable after this for some reason?
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
        console.log("Num ally: ", ally_units.length)
        return ally_units.length == 0;
    }
}