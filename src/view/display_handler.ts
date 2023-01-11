import { ISelectable, Stack } from "../model/core";
import { InputResponse } from "../model/input";
import { IPhase } from "../model/phase";
import { IState } from "../model/state";
import { AbstractDisplay, AbstractVisual, DisplayState, FixedLocatable, VictoryBannerVisual } from "./display";
import { DisplayMap, RenderObjectToDisplayMap } from "./broker";
import { IView, IView2D, RenderObject } from "./rendering";
import { ICoordinate } from "../model/space";
import { Glement } from "../common/entity";

// TODO: Add other ActiveRegion types
export interface ZMatch {z: number}
export type ActiveRegion = ZMatch 

/**
 * Clears and redraws entire canvas and all AbstractDisplays.
 */
export function refreshDisplay(
    view: IView2D, 
    display_map: DisplayMap,
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
    display_map: DisplayMap;
    state: IState;
    render_object_map: RenderObjectToDisplayMap;
    active_region: ActiveRegion;
    // TODO: Placeholder for handling sequential input displays
    pending_inputs: Array<ISelectable>;
    visuals: Array<AbstractVisual>;

    constructor(view: IView<ICoordinate>, display_map: DisplayMap, state: IState){
        this.view = view;
        this.display_map = display_map;
        this.state = state;
        this.pending_inputs = [];
        this.active_region = null;
        this.render_object_map = new Map<RenderObject, AbstractDisplay<ISelectable>>();
        this.visuals = [];
    }

    attach(selectable: ISelectable, display: AbstractDisplay<ISelectable>): void {
        this.display_map.set(selectable, display);
    }

    attach_visual(visual: AbstractVisual): void {
        this.visuals.push(visual);
    }

    update_queued(pending_inputs: Array<ISelectable>) { 
        for(let pending_selectable of pending_inputs) {
            // TODO: Whether to display as queued or not is context dependent
            var display = this.display_map.get(pending_selectable);
            if (display != null) { // May be null if from different View
                display.selection_state = DisplayState.Queue;
            }
        }
    }

    clear_queued() {
        for (var display of this.display_map.values()) {
            display.selection_state = DisplayState.Neutral;
            display.state = DisplayState.Neutral;
        }
    }
    
    _refresh() {
        this.view.clear();
        delete this.render_object_map;
        this.render_object_map = new Map<RenderObject, AbstractDisplay<ISelectable>>()
        // Display Selectables
        for (let selectable of this.state.get_selectables()) {
            var display = this.display_map.get(selectable);
            if (display == undefined) {
                continue;
            }
            var render_object = display.display(this.view, this.active_region);
            if (render_object != null) { // Can only select rendered elements. 
                this.render_object_map.set(render_object, display);
            }
        }
        // Display Unattached visuals
        for (let visual of this.visuals) {
            visual.display(this.view);
        }
    }

    refresh(){
    }

    render_pending_inputs() {
        // TODO: turn into a function of Action or some object that encapsulates it.
        for (var i = 0; i < this.pending_inputs.length - 1; i++) {
            // @ts-ignore TODO: Add type guard
            var from: IPathable = this.display_map.get(this.pending_inputs[i]);
            // @ts-ignore TODO: Add type guard
            var to: IPathable = this.display_map.get(this.pending_inputs[i+1]);
            from.pathDisplay(this.view, to);
        }
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

        // TODO: Validate pending_inputs
        var pending_inputs = phase.pending_inputs;
        var pending_inputs_arr = pending_inputs instanceof Stack ? pending_inputs.to_array() : (
            pending_inputs == null ? [] : [pending_inputs]
        )
        // TODO: Remove assumption that pending inputs are always sequential
        this.pending_inputs = pending_inputs_arr;
        this.update_queued(pending_inputs_arr);
    }

    on_phase_end(phase: IPhase){
        console.log("Phase End");
        // Clear states
        this.clear_queued();
    }

    on_game_end(){
        console.log("building banner");
        var banner_parent = new FixedLocatable({x: 0, y: 2, z: 0});
        var banner = new VictoryBannerVisual(banner_parent);
        this.attach_visual(banner);
        console.log("Game End");
        // Clear states
        // TODO: Clumsy Clear
        this.clear_queued();
        for (var display of this.display_map.values()) {
            display.selection_state = DisplayState.Neutral;
            display.state = DisplayState.Neutral;
        }
        console.log(this.display_map);
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
    view: IView<ICoordinate>;

    constructor(view: IView<ICoordinate>, display_map: DisplayMap, state: IState) {
        super(view, display_map, state);
        this.pending_inputs = [];
    }

    refresh(){
        this._refresh();
        this.render_pending_inputs();
    }
}

/**
 * SmartDisplayHandler handles refreshes and updates to the display list.
 * It accepts a DisplayMapManager, which handles changes in the list of Displays.
 * It also accepts a RefreshManager, which handles specifics of View and Refresh.
 */
export class SmartDisplayHandler extends BaseDisplayHandler {
    view: IView<ICoordinate>;
    display_map_manager: DisplayMapManager;

    constructor(
        view: IView<ICoordinate>, 
        state: IState,
        display_builder: DisplayBuilder,
    ){
        var display_map_manager = new DisplayMapManager(state, display_builder);
        super(view, display_map_manager.display_map, state);
        this.init_active_region();
        this.display_map_manager = display_map_manager;
        this.pending_inputs = [];
    }

    init_active_region() {
    }

    on_tick() {
        // TODO: Clean up since this is handled by requestAnimationFrame in View3D.
        this.refresh();
    }

    refresh(){
        this.display_map_manager.update();
        this._refresh();
        this.render_pending_inputs();
        this.view.update();
    }

    on_phase_end(phase: IPhase){
        console.log("Phase End");
        // Clear states
        this.clear_queued();
    }
}


export type DisplayBuilder = (sel: ISelectable) => AbstractDisplay<ISelectable>;

export class DisplayMapManager {
    display_map: DisplayMap;
    display_builder: DisplayBuilder;
    state: IState;

    constructor(state: IState, display_builder: DisplayBuilder) {
        this.state = state;
        this.display_builder = display_builder;
        this.display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();
        for (var loc of state.get_locations()) {
            try {
               this.display_map.set(loc, this.display_builder(loc));
            } catch (error) {
                console.log(error);
            }
        }
        for (var element of state.get_selectables()) {
            try {
               this.display_map.set(element, this.display_builder(element));
            } catch (error) {
                console.log(error);
            }
        }
        for (var element of state.get_extras()) {
            try {
               var display = this.display_builder(element)
               this.display_map.set(element, display);
               console.log(this.display_map);
            } catch (error) {
                console.log(error);
            }
        }
    }

    update() {
        console.log(this.get_added().length);
        for (var added of this.get_added()) {
            // @ts-ignore subtyping problem; Glement not of type T
            this.display_map.set(added, this.display_builder(added));
        }
        for (var removed in this.get_removed()) {
            this.display_map.delete(removed);
        }
    }

    get_added(): Array<ISelectable> {
        var state_elements = new Set<ISelectable>(this.state.get_selectables());
        var display_elements = new Set<ISelectable>(this.display_map.keys());
        var added = [...state_elements].filter(x => !display_elements.has(x));
        return added;
    }

    get_removed(): Set<ISelectable> {
        var state_elements = new Set<ISelectable>(this.state.get_selectables());
        var display_elements = new Set<ISelectable>(this.display_map.keys());
        var removed = new Set<ISelectable>([...display_elements].filter(x => !state_elements.has(x)));
        return removed;
    }
}