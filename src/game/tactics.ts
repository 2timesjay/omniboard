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

    * run_phase(state: BoardState, cur_team: number
    ): Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        console.log("TacticsPhase.run_phase");
        var effects = yield *this.run_subphase(state, cur_team);
        console.log("Effects: ", effects);
        state.process(effects);
        console.log("BoardState: ", state);
        console.log("Units: ", state.units);
    }

    // Consumer sees this as
    // unit_options = run_phase.next()
    // Select Unit
    // action_options = run_phase.next(unit_sel)
    // Select Action
    // location_options = run_phase.next(unit_sel)
    // Select Location
    // run_phase.next(location_sel);
    * run_subphase (
        state: BoardState, 
        cur_team: number, 
    ): Generator<InputOptions<ISelectable>, Array<Effect<BoardState>>, InputSelection<ISelectable>> { // InputRequest generator
        var unit_options = state.units.filter((u) => u.team == cur_team).filter(is_available);
        do {
            // @ts-ignore InputSelection<ISelectable> instead of InputSelection<Unit>
            var unit_sel: Unit = yield unit_options;
        } while (unit_sel == null);
        var unit = unit_sel;
        var action_options = unit.actions.filter(is_available);
        // @ts-ignore
        do {
            // @ts-ignore InputSelection<ISelectable> instead of InputSelection<Action>
            var action_sel: Action = yield action_options;
        } while (action_sel == null);
        var action = action_sel;
        // input_option_generator requires Stack, not just any InputSelection
        var location_root = new Stack(unit.loc);
        // TODO: Revise action to simply return selected input stack; handle digest in phase.
        // @ts-ignore
        var effects = yield *action.input_option_generator(location_root);
        console.log("TacticsPhase.run_subphase");
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
    grid_space: GridSpace;
    units: Array<Unit>;
    // TODO: Derive stateful_selectables directly from stack.
    misc_selectables: Array<ISelectable>;
    stateful_selectables: Array<ISelectable>;

    constructor(context: CanvasRenderingContext2D, display_map: DisplayMap<ISelectable>, board_state: BoardState){
        this.context = context;
        this.display_map = display_map;
        this.grid_space = board_state.grid;
        this.units = board_state.units;
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
            this.stateful_selectables = selection.to_array();
        // @ts-ignore
        } else if (selection instanceof Unit) {
            this.misc_selectables.push(selection);
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
        refreshDisplay(this.context, this.display_map, this.grid_space, this.units);
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