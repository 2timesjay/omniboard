import { TacticsPhase } from "../game/tactics_controller";
import { ISelectable, Stack } from "../model/core";
import { InputSelection } from "../model/input";
import { IPhase } from "../model/phase";
import { BoardState, Action, IState } from "../model/state";
import { DisplayState, Flinch, LinearVisual, UnitDisplay } from "./display";
import { DisplayMap } from "./input";
import { makeLine } from "./rendering";


/**
 * Clears and redraws entire canvas and all AbstractDisplays.
 */
export function refreshDisplay(
    context: CanvasRenderingContext2D, 
    display_map: DisplayMap<ISelectable>,
    state: IState,
) {
    var canvas = context.canvas;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let selectable of state.get_selectables()) {
        var display = display_map.get(selectable);
        display.display(context);
    }
}

/**
 * Handles updating of InputView based on current inputs, and global view refreshes.
 * See DisplayHandler.
 */
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

    on_tick() {
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
    // TODO: Placeholder for handling sequential input displays
    pathy_inputs: Array<ISelectable>;

    /**
     * NOTE: Implicitly relies on subtle hack; final confirmation via "confirm click" 
     *     does not change `this.current_input`, so whole set of inputs can be correctly cleared.
     */ 
    on_selection(selection: InputSelection<ISelectable>, phase: IPhase) {
        console.log(this.stateful_selectables);
        // TODO: Just a placeholder
        if (this.stateful_selectables.length > 0) {
            var unit_display = this.display_map.get(this.stateful_selectables[0]);
            console.log(unit_display); 
            var flinch = new Flinch(Math.random()*20 - 10, Math.random()*20 - 10, 100);
            // @ts-ignore AbstractDisplay; but also can't cast unit_display to Mixin'd UnitDisplay?
            unit_display.interrupt_animation(flinch);
        }

        // TODO: Factor this into BaseDisplayHandler and sanitize
        // TODO: Would be nice to display first loc as "queued".
        var current_inputs = [...phase.current_inputs]; // Shallow Copy
        // Set previous selection_state to neutral;
        for(let stateful_selectable of this.stateful_selectables) {
            var display = this.display_map.get(stateful_selectable);
            display.selection_state = DisplayState.Neutral;
            display.state = DisplayState.Neutral;
        }
        this.stateful_selectables = current_inputs;

        // Update and queue-display selection state
        var top_sel = current_inputs[current_inputs.length - 1];
        // Action_inputs are a special case because they're currently the 
        // application of SequentialInputAcquirer.
        // TODO: Replace this with generic handling of SequentialInputAcquirer
        var action_inputs = (top_sel instanceof Action) ? top_sel.acquirer.current_input : null;
        var action_inputs_arr = action_inputs instanceof Stack ? action_inputs.to_array() : (
            action_inputs == null ? [] : [action_inputs]
        )
        this.pathy_inputs = action_inputs_arr;
        this.stateful_selectables.push(...action_inputs_arr);
        
        for(let stateful_selectable of this.stateful_selectables) {
            var display = this.display_map.get(stateful_selectable);
            display.selection_state = DisplayState.Queue;
        }
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
    }

    on_game_end(){
        console.log("Game End");
        // Clear states and clear stateful_selectables
        // TODO: Clumsy Clear
        for (var display of this.display_map.values()) {
            display.selection_state = DisplayState.Neutral;
            display.state = DisplayState.Neutral;
        }
        console.log(this.display_map);
    }

    refresh(){
        super.refresh();
        this.render_pathy_inputs();
    }

    render_pathy_inputs() {
        // TODO: turn into a function of Action or some object that encapsulates it.
        for (var i = 0; i < this.pathy_inputs.length - 1; i++) {
            var from = this.display_map.get(this.pathy_inputs[i]);
            var to = this.display_map.get(this.pathy_inputs[i+1]);
            // @ts-ignore AbstractDisplay<ISelectable> is not ILocatable - fair
            var line = new LinearVisual(from, to);
            line.display(this.context);
        }
    }
}