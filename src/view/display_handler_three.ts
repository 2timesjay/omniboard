import { View3D } from "./rendering_three";
import { ISelectable } from "../model/core";
import { IState } from "../model/state";
import { DisplayMap } from "./broker";
import { IPhase } from '../model/phase';
import { AbstractDisplay } from "./display";
import { BaseDisplayHandler } from "./display_handler";

// TODO: Remove this. All 3D elements can live in view; active_region is slightly tricky though it applies to PseudoZ
 export class DisplayHandler3D extends BaseDisplayHandler {
    view: View3D;

    constructor(view: View3D, display_map: DisplayMap, state: IState){
        super(view, display_map, state);
        this.active_region = {z: 0};
        this.pending_inputs = [];
    }

    on_tick() {
        // TODO: Clean up since this is handled by requestAnimationFrame in View3D.
        this.refresh();
    }

    refresh(){
        this._refresh();
        this.render_pending_inputs();
        this.view.camera_update();
    }

    on_phase_end(phase: IPhase){
        console.log("Phase End");
        // Clear states
        this.clear_queued();
    }
}