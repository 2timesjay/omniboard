import { ISelectable, Stack } from "../model/core";
import { InputOptions, InputRequest, InputSelection } from "../model/input";
import { IPhase } from "../model/phase";
import { GridSpace } from "../model/space";
import { Action, BoardState, Effect } from "../model/state";
import { DisplayState } from "../view/display";
import { DisplayMap } from "../view/input";
import { refreshDisplay } from "./shared";

export class PathOnlyPhase implements IPhase {
    * run_phase(
        action: Action<ISelectable>, root_stack: Stack<ISelectable>
    ): Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        console.log("PathOnlyPhase.run_phase");
        var effects = yield *this.run_subphase(action, root_stack);
    }

    * run_subphase (
        action: Action<ISelectable>, root_stack: Stack<ISelectable>
    ): Generator<InputOptions<ISelectable>, Array<Effect<BoardState>>, InputSelection<ISelectable>> {
        // @ts-ignore Expects Stack - here and other places InputSelection was a reach.
        var effects = yield *action.input_option_generator(root_stack);
        console.log("PathOnlyPhase.run_subphase");
        return effects;
    }
}

export class PathOnlyDisplayHander {
    context: CanvasRenderingContext2D;
    display_map: DisplayMap<ISelectable>;
    grid_space: GridSpace;
    prev_selection: Stack<ISelectable>;

    constructor(context: CanvasRenderingContext2D, grid_space: GridSpace, display_map: DisplayMap<ISelectable>){
        this.context = context;
        this.display_map = display_map;
        this.grid_space = grid_space;
        this.prev_selection = null;
    }

    // TODO: Update to re-use TacticsDisplayHandler.on_selection.
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
        refreshDisplay(this.context, this.display_map, this.grid_space);
    }
}

// TODO: I have typed too many damn things.
export async function path_only_input_bridge(
    phase: PathOnlyPhase, 
    action: Action<ISelectable>, 
    root_stack: Stack<ISelectable>, 
    input_request: InputRequest<ISelectable>, 
    display_handler: PathOnlyDisplayHander,
) {
    var phase_runner = phase.run_phase(action, root_stack);
    var input_options = phase_runner.next().value;
    display_handler.on_selection(root_stack);
    while(input_options){
        var input_selection = await input_request(input_options);
        // @ts-ignore input_options potentially overbroad (ISelectable) here?
        display_handler.on_selection(input_selection);
        input_options = phase_runner.next(input_selection).value;
    }
}