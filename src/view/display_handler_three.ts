import { View3D } from "./rendering_three";
import { ISelectable, Stack } from "../model/core";
import { IState } from "../model/state";
import { DisplayMap, DisplayMap3D, MeshToDisplayMap } from "./input";
import { InputResponse } from '../model/input';
import { IPhase } from '../model/phase';
import { AbstractDisplay, AbstractDisplay3D, DisplayState } from "./display";
import { Action } from "../model/action";
import { ActiveRegion, BaseDisplayHandler, IDisplayHandler } from "./display_handler";

// TODO: Extend BaseDisplayHandler
 export class DisplayHandler3D extends BaseDisplayHandler {
    view: View3D;
    context: WebGL2RenderingContext;
    display_map: DisplayMap3D<ISelectable>;
    mesh_map: MeshToDisplayMap<ISelectable>;
    state: IState;
    stateful_selectables: Array<ISelectable>;
    pathy_inputs: Array<ISelectable>;
    active_region: ActiveRegion;


    constructor(view: View3D, display_map: DisplayMap3D<ISelectable>, state: IState){
        super(view, display_map, state);
        this.view = view;
        this.context = view.context;
        this.display_map = display_map;
        this.state = state;
        this.stateful_selectables = [];
        this.pathy_inputs = [];
        this.mesh_map = new Map<number, AbstractDisplay3D<ISelectable>>()
        this.active_region = {z: 0};
    }

    on_tick() {
        // TODO: Clean up since this is handled by requestAnimationFrame in View3D.
        this.refresh();
    }

    refresh(){
        this._refresh();
        this.render_pathy_inputs();
        this.view.animate();
    }

    _refresh(
    ) {
        this.view.clear();
        delete this.mesh_map;
        this.mesh_map = new Map<number, AbstractDisplay3D<ISelectable>>();
        for (let selectable of this.state.get_selectables()) {
            var display = this.display_map.get(selectable);
            // @ts-ignore
            var mesh = display.display(this.view, this.active_region);
            if (mesh != null) { // Can only select rendered elements. 
                this.mesh_map.set(mesh.id, display);
            }
        }
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
    
    // TODO: add on_* methods to IGameDisplayHandler interface?
    /**
     * NOTE: Implicitly relies on subtle hack; final confirmation via "confirm click" 
     *     does not change `this.current_input`, so whole set of inputs can be correctly cleared.
     */ 
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
        this.update_queued(pending_inputs_arr);
        this.pathy_inputs = pending_inputs_arr;

        this.stateful_selectables.push(...pending_inputs_arr);
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
}