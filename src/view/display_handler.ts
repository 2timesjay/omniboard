import { TacticsPhase } from "../game/tactics";
import { ISelectable, Stack } from "../model/core";
import { InputSelection } from "../model/input";
import { IPhase } from "../model/phase";
import { BoardState, Action, IState } from "../model/state";
import { DisplayState } from "./display";
import { DisplayMap } from "./input";

export function refreshDisplay(
    context: CanvasRenderingContext2D, 
    display_map: DisplayMap<ISelectable>,
    state: IState,
) {
    // Clear canvas
    var canvas = context.canvas;
    context.clearRect(0, 0, canvas.width, canvas.height);
    // TODO: Just refresh all display_map elements.
    for (let selectable of state.get_selectables()) {
        var display = display_map.get(selectable);
        display.display(context);
    }
}

export class BaseDisplayHandler {
    context: CanvasRenderingContext2D;
    display_map: DisplayMap<ISelectable>;
    state: IState;
    stateful_selectables: Array<ISelectable>;

    constructor(context: CanvasRenderingContext2D, display_map: DisplayMap<ISelectable>, state: IState){
        this.context = context;
        this.display_map = display_map;
        this.state = state;
        this.stateful_selectables = [];
    }

    /**
     * NOTE: Implicitly relies on subtle hack; final confirmation via "confirm click" 
     *     does not change `this.current_input`, so whole set of inputs can be correctly cleared.
     */ 
    on_selection(selection: InputSelection<ISelectable>, phase: IPhase) {
        // TODO: Factor this into BaseDisplayHandler and sanitize
        // TODO: Would be nice to display first loc as "queued".
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
        // TODO: Replace this with generic handling of SequentialInputAcquirer
        var action_inputs = (top_sel instanceof Action) ? top_sel.acquirer.current_input : null;
        var action_inputs_arr = action_inputs instanceof Stack ? action_inputs.to_array() : (
            action_inputs == null ? [] : [action_inputs]
        )
        this.stateful_selectables = current_inputs;
        // TODO: Replace this hackiness with "confirmation"
        // if (selection instanceof Action && selection.text == "End Turn") {
        //     console.log("End Turn Display handling")
        //     this.stateful_selectables.push(selection);
        // }
        this.stateful_selectables.push(...action_inputs_arr);
        for(let stateful_selectable of this.stateful_selectables) {
            var display = this.display_map.get(stateful_selectable);
            display.selection_state = DisplayState.Queue;
        }
        this.refresh();
    }

    refresh(){
        refreshDisplay(this.context, this.display_map, this.state);
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
 export class DisplayHandler extends BaseDisplayHandler{
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

    on_game_end(){
        console.log("Game End");
        // Clear states and clear stateful_selectables
        // TODO: Clumsy Clear
        for (var display of this.display_map.values()) {
            console.log("Clearing ", display);
            display.selection_state = DisplayState.Neutral;
            display.state = DisplayState.Neutral;
        }
        console.log(this.display_map);
        this.refresh();
    }
}