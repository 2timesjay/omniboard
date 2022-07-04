import { View3D } from "./rendering_three";
import { ISelectable, Stack } from "../model/core";
import { IState } from "../model/state";
import { DisplayMap, DisplayMap3D, MeshToSelectableMap } from "./input";
import { InputSelection } from '../model/input';
import { IPhase } from '../model/phase';
import { DisplayState } from "./display";
import { Action } from "../model/action";

// TODO: Extend BaseDisplayHandler
 export class DisplayHandler3D  {
    view: View3D;
    context: WebGL2RenderingContext;
    display_map: DisplayMap3D<ISelectable>;
    mesh_map: MeshToSelectableMap<ISelectable>;
    state: IState;
    stateful_selectables: Array<ISelectable>;
    pathy_inputs: Array<ISelectable>;


    constructor(view: View3D, display_map: DisplayMap3D<ISelectable>, state: IState){
        this.view = view;
        this.context = view.context;
        this.display_map = display_map;
        this.state = state;
        this.stateful_selectables = [];
        this.pathy_inputs = [];
        this.mesh_map = new Map<number, ISelectable>()
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
        this.mesh_map = new Map<number, ISelectable>();
        for (let selectable of this.state.get_selectables()) {
            var display = this.display_map.get(selectable);
            // @ts-ignore
            var mesh = display.display(this.view);
            if (mesh != null) { // Can only select rendered elements. 
                this.mesh_map.set(mesh.id, selectable);
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
            from.pathDisplay(this.context, to);
        }
    }
    
    // TODO: add on_* methods to IGameDisplayHandler interface?
    /**
     * NOTE: Implicitly relies on subtle hack; final confirmation via "confirm click" 
     *     does not change `this.current_input`, so whole set of inputs can be correctly cleared.
     */ 
    on_selection(selection: InputSelection<ISelectable>, phase: IPhase) {
        this.clear_queued();
        // TODO: pass partial acquirer inputs to DisplayHandler 
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