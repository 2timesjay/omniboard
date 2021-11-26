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
export class TacticsPhase implements IPhase {
    constructor() {}

    * run_phase(state: BoardState, cur_team: number
    ): Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        var effects = yield *this.run_subphase(state, cur_team);
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
        // @ts-ignore InputSelection T instead of Stack<T>
        var unit_sel: Unit = yield unit_options;
        var unit = unit_sel;
        var action_options = unit.actions.filter(is_available);
        // @ts-ignore
        // var action_sel: Stack<Action<GridLocation>> = yield action_options;
        // var action = action_sel.value;
        var action_sel = action_options[0];
        var action = action_sel;
        var location_root = new Stack(unit.loc);
        // input_option_generator requires Stack, not just any InputSelection
        // @ts-ignore
        var effects = yield *action.input_option_generator(location_root);
        return effects;
    }
}

export class TacticsDisplayHander {
    context: CanvasRenderingContext2D;
    display_map: DisplayMap<ISelectable>;
    grid_space: GridSpace;
    units: Array<Unit>;
    prev_selection: Stack<ISelectable>;

    constructor(context: CanvasRenderingContext2D, display_map: DisplayMap<ISelectable>, board_state: BoardState){
        this.context = context;
        this.display_map = display_map;
        this.grid_space = board_state.grid;
        this.units = board_state.units;
        this.prev_selection = null;
    }

    on_selection(selection: Stack<ISelectable>) {
        // TODO: Queue State Clearing is incorrect.
        // Erase old selection_state;
        var prev_selection = this.prev_selection;
        if (prev_selection) {
            do {
                var loc = prev_selection.value;
                var display = this.display_map.get(loc);
                display.selection_state = DisplayState.Neutral;
                prev_selection = prev_selection.parent;
            } while(prev_selection);
        }
        // pop or ignore pop signal if prev selection too shallow;
        // TODO: Super-pop - pop back to actual prev selection instead decrement.
        if (selection) {
            this.prev_selection = selection;
        } else if (this.prev_selection && this.prev_selection.depth > 1) {
            selection = this.prev_selection.pop();
        } else {
            selection = this.prev_selection;
        }
        if (selection) {
            do {
                var loc = selection.value;
                var display = this.display_map.get(loc);
                display.selection_state = DisplayState.Queue;
                selection = selection.parent;
            } while(selection);
        }
        refreshDisplay(this.context, this.display_map, this.grid_space, this.units);
    }
}

// TODO: I have typed too many damn things.
type TacticsSelectable = Unit | GridLocation | Action<TacticsSelectable>

export async function tactics_input_bridge(
    phase: TacticsPhase, 
    state: BoardState, 
    input_request: InputRequest<ISelectable>,
    display_handler: TacticsDisplayHander,
) {
    var phase_runner = phase.run_phase(state, 0);
    var input_options = phase_runner.next().value;
    display_handler.on_selection(null); // TODO: Handle "nothing" in on_selection
    while(input_options){
        // @ts-ignore input_options potentially overbroad (ISelectable) here?
        var input_selection_promise = input_request(input_options);
        console.log("isp: ", input_selection_promise);
        var input_selection = await input_selection_promise;
        input_options = phase_runner.next(input_selection).value;
    }
}