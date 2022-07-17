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

    constructor(view: View3D, display_map: DisplayMap3D<ISelectable>, state: IState){
        super(view, display_map, state);
        this.active_region = {z: 0};
        this.stateful_selectables = [];
        this.pathy_inputs = [];
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

    on_phase_end(phase: IPhase){
        console.log("Phase End");
        // Clear states and clear stateful_selectables
        this.clear_queued();
    }
}