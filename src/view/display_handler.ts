import { TacticsPhase } from "../tactics/tactics_controller";
import { Action } from "../model/action";
import { ISelectable, Stack } from "../model/core";
import { InputResponse } from "../model/input";
import { IPhase } from "../model/phase";
import { BoardState, IState } from "../model/state";
import { AbstractDisplay, DisplayState, Flinch, LinearVisual, Move, UnitDisplay } from "./display";
import { DisplayMap, RenderObjectToDisplayMap } from "./broker";
import { IInputView, IView, IView2D, makeLine, RenderObject } from "./rendering";
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
    view: IInputView<ICoordinate>;
    display_map: DisplayMap<ISelectable>;
    state: IState;
    render_object_map: RenderObjectToDisplayMap<ISelectable>;
    stateful_selectables: Array<ISelectable>;
    active_region: ActiveRegion;
    // TODO: Placeholder for handling sequential input displays
    pathy_inputs: Array<ISelectable>;

    constructor(view: IInputView<ICoordinate>, display_map: DisplayMap<ISelectable>, state: IState){
        this.view = view;
        this.display_map = display_map;
        this.state = state;
        this.stateful_selectables = [];
        this.active_region = null;
        this.render_object_map = new Map<RenderObject, AbstractDisplay<ISelectable>>();
    }

    on_tick() {
        this.refresh();
    }    

    /**
     * NOTE: Implicitly relies on subtle hack; final confirmation via "confirm click" 
     *     does not change `this.current_input`, so whole set of inputs can be correctly cleared.
     */ 
    // TODO: add on_* methods to IGameDisplayHandler interface?
     on_selection(selection: InputResponse<ISelectable>, phase: IPhase) {
        this.clear_queued();

        // TODO: Update to reflect phase.current_inputs change to `Input` object-like
        var current_inputs = [...Object.values(phase.current_inputs)]; // Shallow Copy
        var pending_inputs = phase.pending_inputs;
        this.stateful_selectables = current_inputs;

        // TODO: Validate pending_inputs
        var pending_inputs_arr = pending_inputs instanceof Stack ? pending_inputs.to_array() : (
            pending_inputs == null ? [] : [pending_inputs]
        )
        this.pathy_inputs = pending_inputs_arr;
        this.update_queued(pending_inputs_arr);

        this.stateful_selectables.push(...pending_inputs_arr);
    }


    update_queued(pending_inputs: Array<ISelectable>) { 
        for(let pending_selectable of pending_inputs) {
            if (!(pending_selectable instanceof Action)) {
                var display = this.display_map.get(pending_selectable);
                display.selection_state = DisplayState.Queue;
            }
        }
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
    
    _refresh() {
        this.view.clear();
        delete this.render_object_map;
        this.render_object_map = new Map<RenderObject, AbstractDisplay<ISelectable>>()
        for (let selectable of this.state.get_selectables()) {
            var display = this.display_map.get(selectable);
            // @ts-ignore
            var render_object = display.display(this.view, this.active_region);
            if (render_object != null) { // Can only select rendered elements. 
                this.render_object_map.set(render_object, display);
            }
        }
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

    constructor(view: IView2D, display_map: DisplayMap<ISelectable>, state: IState) {
        super(view, display_map, state);
        this.pathy_inputs = [];
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
        this.clear_queued();
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

    // TODO: Not working right now; synchronize with display_handler_three impl.
    render_pathy_inputs() {
        // TODO: turn into a function of Action or some object that encapsulates it.
        for (var i = 0; i < this.pathy_inputs.length - 1; i++) {
            // @ts-ignore TODO: Add type guard
            var from: IPathable = this.display_map.get(this.pathy_inputs[i]);
            // @ts-ignore TODO: Add type guard
            var to: IPathable = this.display_map.get(this.pathy_inputs[i+1]);
            from.pathDisplay(this.view, to);
        }
    }
}