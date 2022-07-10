import { View3D } from "./rendering_three";
import { ISelectable, Stack } from "../model/core";
import { IState } from "../model/state";
import { DisplayMap, DisplayMap3D, RenderObjectToDisplayMap } from "./broker";
import { InputResponse } from '../model/input';
import { IPhase } from '../model/phase';
import { AbstractDisplay, AbstractDisplay3D, DisplayState } from "./display";
import { Action } from "../model/action";
import { ActiveRegion, BaseDisplayHandler, IDisplayHandler } from "./display_handler";
import { RenderObject } from "./rendering";

// TODO: Extend BaseDisplayHandler
 export class DisplayHandler3D extends BaseDisplayHandler {
    view: View3D;
    display_map: DisplayMap3D<ISelectable>;
    state: IState;
    stateful_selectables: Array<ISelectable>;
    pathy_inputs: Array<ISelectable>;
    active_region: ActiveRegion;


    constructor(view: View3D, display_map: DisplayMap3D<ISelectable>, state: IState){
        super(view, display_map, state);
        this.view = view;
        this.display_map = display_map;
        this.state = state;
        this.stateful_selectables = [];
        this.pathy_inputs = [];
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