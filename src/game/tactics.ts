import { ISelectable, Stack } from "../model/core";
import { InputOptions, InputRequest, InputSelection } from "../model/input";
import { IPhase } from "../model/phase";
import { GridLocation, GridSpace } from "../model/space";
import { BoardState, Effect, Action, IState } from "../model/state";
import { Unit } from "../model/unit";
import { DisplayState } from "../view/display";
import { DisplayMap } from "../view/input";
import { refreshDisplay } from "./shared";

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
    available_units: Set<Unit>;
    available_actions: Set<Action<ISelectable, BoardState>>;
    current_inputs: Array<InputSelection<ISelectable>>;

    constructor() {
        this.current_inputs = []
    }

    // TODO: Replace with a BoardState solution.
    update_exhausted(unit: Unit, action: Action<ISelectable, BoardState>) {
        // TODO: If can't attack, need "End Turn" option. Otherwise phase can't end.
        this.available_actions.delete(action);
        this.available_units.delete(unit);
    }

    // TODO: Efficient way to represent "sequential state machine" without GOTO
    * run_phase(state: BoardState, cur_team: number
    ): Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        console.log("TacticsPhase.run_phase");
        var team_units = state.units
            .filter((u) => u.team == cur_team)
            .filter((u) => u.is_alive());
        this.available_units = new Set(team_units); 
        this.available_actions = new Set(team_units.flatMap((u) => u.actions));       
        while(this.available_units.size) {
            // var effects = yield *this.run_subphase(state, cur_team);
            var data_dict = new Map<string, any>([["state", state]]);
            // TODO: Mutable data_dict is someone messy; hidden here.
            var data_dict = yield *this.run_subphase(data_dict);

            // TODO: Should "exhaust" be control or Effect? Latter eventually.
            // TODO: Destroyed type info with this approach - fix.
            var unit = data_dict.get("unit");
            var action = data_dict.get("action");
            var final = data_dict.get("final");
            var effects = action.digest_fn(final);
            this.update_exhausted(unit, action);

            console.log("Effects: ", effects);
            state.process(effects);
            this.current_inputs.length = 0;
            console.log("BoardState: ", state);
            console.log("Units: ", state.units);
            // TODO: yield a special "subphase end" signal.
        }
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
            .filter((u) => this.available_units.has(u));
        var unit_sel: Unit = yield unit_options;
        var unit = unit_sel;
        return unit;
    }

    * action_selection (
        unit: Unit
    ): Generator<Array<Action<ISelectable, BoardState>>, Action<ISelectable, BoardState>, Action<ISelectable, BoardState>> {
        var action_options = unit.actions.filter((a) => this.available_actions.has(a));
        var action_sel: Action<ISelectable, BoardState> = yield action_options;
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
        // TODO: use match syntax or case syntax
        if (action.text == "Move") {
            var location_root = new Stack(unit.loc);
            root = location_root;
        } else if (action.text == "Attack") {
            var unit_root = unit;
            root = unit_root;
        }
        // TODO: Revise action to simply return selected input stack; handle digest in sub-phase.
        // @ts-ignore Unit | Stack<GridLocation>
        var final_inputs = yield *action.get_final_input(root);
        return final_inputs;
    }
}

/**
 * DisplayHandler combines handling input's effect on display and executing refreshes.
 * Input, via new selections fed in through the InputBridge, affect the stack.
 * The stack is used to update DisplayState of certain elements.
 * Every Selectable in State is in the DisplayMap, which is literally a lookup map.
 * Context is the actual display
 * grid_space and units are for convenient iteration.
 */
export class TacticsDisplayHander {
    context: CanvasRenderingContext2D;
    display_map: DisplayMap<ISelectable>;
    state: BoardState;
    // TODO: Derive stateful_selectables directly from stack.
    misc_selectables: Array<ISelectable>;
    stateful_selectables: Array<ISelectable>;

    constructor(context: CanvasRenderingContext2D, display_map: DisplayMap<ISelectable>, state: BoardState){
        this.context = context;
        this.display_map = display_map;
        this.state = state;
        this.stateful_selectables = [];
    }

    on_selection(selection: InputSelection<ISelectable>, phase: IPhase) {
        // TODO: Factor this into BaseDisplayHandler and sanitize
        // TODO: Would be nice to display first loc as "queued".
        // TODO: UnitDisplay state not actually well-handled right now.
        var current_inputs = [...phase.current_inputs]; // Shallow Copy
        // Set previous selection_state to neutral;
        for(let stateful_selectable of this.stateful_selectables) {
            var display = this.display_map.get(stateful_selectable);
            display.selection_state = DisplayState.Neutral;
            display.state = DisplayState.Neutral;
        }

        // Update and queue-display selection state
        var top_sel = current_inputs[current_inputs.length - 1];
        // Action_inputs are a special case because they're currently the 
        // application of SequentialInputAcquirer.
        var action_inputs = (top_sel instanceof Action) ? top_sel.acquirer.current_input : null;
        var action_inputs_arr = action_inputs instanceof Stack ? action_inputs.to_array() : (
            action_inputs == null ? [] : [action_inputs]
        )
        this.stateful_selectables = current_inputs ;
        this.stateful_selectables.push(...action_inputs_arr);
        for(let stateful_selectable of this.stateful_selectables) {
            var display = this.display_map.get(stateful_selectable);
            display.selection_state = DisplayState.Queue;
        }
        this.refresh();
    }

    on_phase_end(phase: TacticsPhase){
        console.log("Phase End");
        // Clear states and clear stateful_selectables
        // TODO: Clumsy Clear
        for(let stateful_selectable of this.stateful_selectables) {
            var display = this.display_map.get(stateful_selectable);
            display.selection_state = DisplayState.Neutral;
            display.state = DisplayState.Neutral;
        }
        while(this.stateful_selectables.length > 0) {
            this.stateful_selectables.pop();
        }
        this.refresh();
    }

    refresh(){
        refreshDisplay(this.context, this.display_map, this.state);
    }
}


export class TacticsController {
    state: BoardState;

    constructor(state: BoardState) {
        this.state = state;
    }

    /**
     * input_bridge == controller. Calls phases in a loop and requests input
     * then feeds input to display_handler.
     */
    async tactics_input_bridge(
        phase: TacticsPhase, 
        input_request: InputRequest<ISelectable>,
        display_handler: TacticsDisplayHander,
    ) {
        display_handler.on_selection(null, phase);
        var team = 0;
        while (true) {
            var phase_runner = phase.run_phase(this.state, team);
            var input_options = phase_runner.next().value;
            while(input_options){
                var input_selection = await input_request(input_options);
                input_options = phase_runner.next(input_selection).value;
                display_handler.on_selection(input_selection, phase);
            }
            display_handler.on_phase_end(phase);
            // TODO: Enemy becomes selectable after this for some reason?
            if (this.victory_condition(team)) {
                console.log("VICTORY!!!");
                break;
            } else if (this.defeat_condition(team)) {
                console.log("DEFEAT!!!");
                break;
            }
            team = (team + 1) % 2; // Switch teams
        }  
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