import { ISelectable, Stack } from "../model/core";
import { InputOptions, InputRequest, InputSelection } from "../model/input";
import { IPhase } from "../model/phase";
import { GridLocation, GridSpace } from "../model/space";
import { BoardState, Effect, Action } from "../model/state";
import { Unit } from "../model/unit";
import { DisplayState } from "../view/display";
import { DisplayMap } from "../view/input";
import { refreshDisplay } from "./shared";


function is_available(selectable: ISelectable): boolean {
    return true;
}

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
    constructor() {}

    // TODO: Efficient way to represent "sequential state machine" without GOTO
    * run_phase(state: BoardState, cur_team: number
    ): Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        console.log("TacticsPhase.run_phase");
        // var effects = yield *this.run_subphase(state, cur_team);
        var data_dict = new Map<string, any>([["state", state], ["cur_team", cur_team]]);
        var effects = yield *this.run_subphase(data_dict);
        console.log("Effects: ", effects);
        state.process(effects);
        console.log("BoardState: ", state);
        console.log("Units: ", state.units);
    }

    // * run_subphase (
    //     state: BoardState, 
    //     cur_team: number, 
    // ): Generator<InputOptions<ISelectable>, Array<Effect<BoardState>>, InputSelection<ISelectable>> {
    //     // TODO: Handle no available options - gets stuck! Auto-pop?
    //     // TODO: Allow pop from unit and action - sub-gens should return ISelectable|PopSignal/null
    //     // @ts-ignore containing gen sends InputSelection<ISelectable> instead of Unit
    //     var unit: Unit = yield *this.unit_selection(state, cur_team);

    //     // @ts-ignore containing gen sends InputSelection<ISelectable> instead of Action
    //     var action: Action = yield *this.action_selection(unit);
        
    //     // TODO: digest here instead of in final_input_selection
    //     var effects = yield *this.final_input_selection(unit, action);
    //     console.log("TacticsPhase.run_subphase");
    //     return effects
    // }

    // Consumer sees this as
    // unit_options = run_phase.next()
    // Select Unit
    // action_options = run_phase.next(unit_sel)
    // Select Action
    // location_options = run_phase.next(unit_sel)
    // Select Location
    // run_phase.next(location_sel);
    * run_subphase( // TODO: Can this be streamlined? Also, document!
        data_dict: Map<string, any>,
    ): Generator<InputOptions<ISelectable>, Array<Effect<BoardState>>, InputSelection<ISelectable>> {
        // Immutable
        var pending = [
            {
                result_label: "unit",
                args_list: ["state", "cur_team"],
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
        var final_result;
        while (input_pointer < pending.length) {
            var cur_ia_dict = pending[input_pointer];
            var gen_fn = cur_ia_dict.gen_fn;
            var args_list = cur_ia_dict.args_list;
            var data_list = args_list.map((arg) => data_dict.get(arg));
            var result_label = cur_ia_dict.result_label;
            console.log(input_pointer, result_label)
            console.log(gen_fn, result_label, data_dict, data_list);
            var cur_ia = gen_fn.apply(this, data_list);
            var result = yield *cur_ia; // TODO: Harmonize naming w/InputAcquirer
            var REJECT_SIGNAL = result == null;
            if (REJECT_SIGNAL) { // NULL INPUT
                // NOTE: Can't break out of subphase for now.
                input_pointer = Math.max(input_pointer - 1, 0); 
            } else { // VALID INPUT
                data_dict.set(result_label, result);
                input_pointer += 1;
                final_result = result;
            }
        }
        return final_result;
    }

    // TODO: Unify with SimpleInputAcquirer
    * unit_selection (
        state: BoardState, 
        cur_team: number, 
    ): Generator<Array<Unit>, Unit, Unit> {
        var unit_options = state.units.filter((u) => u.team == cur_team).filter(is_available);
        // do {
        //     var unit_sel: Unit = yield unit_options;
        // } while (unit_sel == null);
        var unit_sel: Unit = yield unit_options;
        var unit = unit_sel;
        return unit;
    }

    * action_selection (
        unit: Unit
    ): Generator<Array<Action<ISelectable, BoardState>>, Action<ISelectable, BoardState>, Action<ISelectable, BoardState>> {
        var action_options = unit.actions.filter(is_available);
        // do {
        //     // @ts-ignore InputSelection<ISelectable> instead of InputSelection<Action>
        //     var action_sel: Action = yield action_options;
        // } while (action_sel == null);
        // @ts-ignore InputSelection<ISelectable> instead of InputSelection<Action>
        var action_sel: Action = yield action_options;
        var action = action_sel;
        return action;
    }

    * final_input_selection (
        unit: Unit,
        action: Action<ISelectable, BoardState>,
    ): Generator<InputOptions<ISelectable>, Array<Effect<BoardState>>, InputSelection<ISelectable>> {
        // input_option_generator requires Stack, not just any InputSelection
        var root = null;
        console.log("action: ", action.text);
        // TODO: Use enum or other better action identification
        // TODO: use match syntax or case syntax
        if (action.text == "Move") {
            var location_root = new Stack(unit.loc);
            root = location_root;
        } else if (action.text == "Attack") {
            var unit_root = unit;
            root = unit_root;
        }
        console.log("input option generator root: ", root)
        // TODO: Revise action to simply return selected input stack; handle digest in sub-phase.
        // @ts-ignore Unit | Stack<GridLocation>
        var effects = yield *action.get_final_input_and_effect(root);
        return effects;
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
        this.misc_selectables = []; // TODO: merge with stateful_selectables
        this.stateful_selectables = [];
    }

    on_selection(selection: InputSelection<ISelectable>) {
        // TODO: Factor this into BaseDisplayHandler and sanitize
        // TODO: Would be nice to display first loc as "queued".
        // TODO: UnitDisplay state not actually well-handled right now.
        // Erase old selection_state;
        console.log("stateful_selectables: ", this.stateful_selectables)
        console.log("current selection: ", selection)
        if (selection == null) { // Handle "Pop";
            console.log("Pop")
            for(let stateful_selectable of this.stateful_selectables) {
                var display = this.display_map.get(stateful_selectable);
                display.selection_state = DisplayState.Neutral;
            }
        }
        // pop or ignore pop signal if prev selection too shallow;
        // TODO: Super-pop - pop back to actual prev selection instead decrement.
        if (selection instanceof Stack) {
            // TODO: Clumsy Clear
            for(let stateful_selectable of this.stateful_selectables) {
                var display = this.display_map.get(stateful_selectable);
                display.selection_state = DisplayState.Neutral;
                display.state = DisplayState.Neutral;
            }
            this.stateful_selectables = selection.to_array();
        // @ts-ignore
        } else if (selection instanceof Unit) { // TODO: Distinguish attacker and Target
            this.misc_selectables.push(selection);
            // TODO: Clumsy Clear
            for(let stateful_selectable of this.stateful_selectables) {
                var display = this.display_map.get(stateful_selectable);
                display.selection_state = DisplayState.Neutral;
                display.state = DisplayState.Neutral;
            }
            this.stateful_selectables = [selection];
        // @ts-ignore
        } else if (selection instanceof Action) {
            this.misc_selectables.push(selection);
        } else if (this.stateful_selectables && this.stateful_selectables.length > 1) {
            this.stateful_selectables.pop();
        }
        // WARNING: stateful_selectables are a sort of parallel selection stack.
        for(let stateful_selectable of this.stateful_selectables) {
            var display = this.display_map.get(stateful_selectable);
            display.selection_state = DisplayState.Queue;
        }
        this.refresh();
    }

    on_phase_end(){
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
        for(let misc_selectable of this.misc_selectables) {
            var display = this.display_map.get(misc_selectable);
            display.state = DisplayState.Neutral;
            console.log("Clearing Misc: ", display);
        }
        while(this.misc_selectables.length > 0) {
            this.misc_selectables.pop();
        }
        this.refresh();
    }

    refresh(){
        refreshDisplay(this.context, this.display_map, this.state);
    }
}

/**
 * input_bridge == controller. Calls phases in a loop and requests input
 * then feeds input to display_handler.
 */
export async function tactics_input_bridge(
    phase: TacticsPhase, 
    state: BoardState, 
    input_request: InputRequest<ISelectable>,
    display_handler: TacticsDisplayHander,
) {
    display_handler.on_selection(null); // TODO: Handle "nothing" in on_selection
    while (true) {
        var phase_runner = phase.run_phase(state, 0);
        var input_options = phase_runner.next().value;
        while(input_options){
            var input_selection = await input_request(input_options);
            display_handler.on_selection(input_selection);
            input_options = phase_runner.next(input_selection).value;
        }
        display_handler.on_phase_end();
    }  
}