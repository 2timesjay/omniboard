import { TacticsPhase } from "../tactics/tactics_controller";
import { Action } from "../model/action";
import { ISelectable, Stack } from "../model/core";
import { InputResponse } from "../model/input";
import { IPhase } from "../model/phase";
import { BoardState, IState } from "../model/state";
import { DisplayState, Flinch, LinearVisual, Move, UnitDisplay } from "./display";
import { DisplayMap } from "./input";
import { IView, IView2D, makeLine } from "./rendering";
import { ICoordinate } from "../model/space";


// TODO: Add other ActiveRegion types
export interface ZMatch {z: number}
export type ActiveRegion = ZMatch 

/**
 * Clears and redraws entire canvas and all AbstractDisplays.
 */
export function refreshDisplay(
    view: IView2D, 
    display_map: DisplayMap<ISelectable>,
    state: IState,
) {
    var context = view.context;
    var canvas = context.canvas;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let selectable of state.get_selectables()) {
        var display = display_map.get(selectable);
        display.display(view, this.active_region);
    }
}

// TODO: Refactor appropriately - needed for now to join in DisplayHandler3D
export interface IDisplayHandler {}

/**
 * Handles updating of InputView based on current inputs, and global view refreshes.
 * See DisplayHandler.
 */
export class BaseDisplayHandler implements IDisplayHandler {
    view: IView<ICoordinate>;
    display_map: DisplayMap<ISelectable>;
    state: IState;
    stateful_selectables: Array<ISelectable>;
    active_region: ActiveRegion;

    constructor(view: IView<ICoordinate>, display_map: DisplayMap<ISelectable>, state: IState){
        this.view = view;
        this.display_map = display_map;
        this.state = state;
        this.stateful_selectables = [];
        this.active_region = null;
    }

    on_tick() {
        this.refresh();
    }

    refresh(){
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
 export class DisplayHandler extends BaseDisplayHandler {
    view: IView2D;
    // TODO: Placeholder for handling sequential input displays
    pathy_inputs: Array<ISelectable>;

    constructor(view: IView2D, display_map: DisplayMap<ISelectable>, state: IState) {
        super(view, display_map, state);
        this.pathy_inputs = [];
    }

    /**
     * NOTE: Implicitly relies on subtle hack; final confirmation via "confirm click" 
     *     does not change `this.current_input`, so whole set of inputs can be correctly cleared.
     */ 
    on_selection(selection: InputResponse<ISelectable>, phase: IPhase) {
        // TODO: pass partial acquirer inputs to DisplayHandler 
        // TODO: Factor this into BaseDisplayHandler and sanitize
        // TODO: Would be nice to display first loc as "queued".
        // TODO: Rework with "SelectionView", outlined in Notebook.
        this.clear_queued();

        // TODO: Update to reflect phase.current_inputs change to `Input` object-like
        var current_inputs = [...Object.values(phase.current_inputs)]; // Shallow Copy
        this.stateful_selectables = current_inputs;

        // Update and queue-display selection state
        var top_sel = current_inputs[current_inputs.length - 1];
        // Action_input is a special case because they're currently the 
        // only application of SequentialInputAcquirer.
        // TODO: Replace this with generic handling of SequentialInputAcquirer
        var acquirer = (top_sel instanceof Action) ? top_sel.acquirer : null;
        var acquirer_inputs = acquirer == null ? null : acquirer.current_input ;
        var acquirer_inputs_arr = acquirer_inputs instanceof Stack ? acquirer_inputs.to_array() : (
            acquirer_inputs == null ? [] : [acquirer.current_input]
        )
        console.log(acquirer_inputs);
        this.pathy_inputs = acquirer_inputs_arr;

        this.stateful_selectables.push(...acquirer_inputs_arr);
    }

    on_phase_end(phase: IPhase){
        console.log("Phase End");
        // Clear states and clear stateful_selectables
        this.clear_queued();
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

    clear_queued() {
        for (var display of this.display_map.values()) {
            display.selection_state = DisplayState.Neutral;
            display.state = DisplayState.Neutral;
        }
        while(this.stateful_selectables.length > 0) {
            this.stateful_selectables.pop();
        }
    }

    refresh(){
        this._refresh();
        this.render_pathy_inputs();
    }

    _refresh() {   
        var context = this.view.context;
        var canvas = context.canvas;
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let selectable of this.state.get_selectables()) {
            var display = this.display_map.get(selectable);
            display.display(this.view, this.active_region);
        }
    }

    // TODO: Not working right now; synchronize with display_handler_three impl.
    render_pathy_inputs() {
        // TODO: turn into a function of Action or some object that encapsulates it.
        for (var i = 0; i < this.pathy_inputs.length - 1; i++) {
            // @ts-ignore TODO: Add type guard
            var from: IPathable = this.display_map.get(this.pathy_inputs[i]);
            // @ts-ignore TODO: Add type guard
            var to: IPathable = this.display_map.get(this.pathy_inputs[i+1]);
            from.pathDisplay(this.view.context, to);
        }
    }
}