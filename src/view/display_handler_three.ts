import { View3D } from "./rendering_three";
import { ISelectable } from "../model/core";
import { IState } from "../model/state";
import { DisplayMap } from "./input";
import { InputSelection } from '../model/input';
import { IPhase } from '../model/phase';

/**
 * Clears and redraws entire canvas and all AbstractDisplays.
 */
 export function refreshDisplay3D(
    view: View3D,
    display_map: DisplayMap<ISelectable>,
    state: IState,
) {
    view.clear();
    // console.log(view.scene);
    for (let selectable of state.get_selectables()) {
        var display = display_map.get(selectable);
        // @ts-ignore
        display.display(view);
    }
}

// TODO: Extend BaseDisplayHandler
 export class DisplayHandler3D  {
    view: View3D;
    context: WebGL2RenderingContext;
    display_map: DisplayMap<ISelectable>;
    state: IState;
    stateful_selectables: Array<ISelectable>;


    constructor(view: View3D, display_map: DisplayMap<ISelectable>, state: IState){
        this.view = view;
        this.context = view.context;
        this.display_map = display_map;
        this.state = state;
        this.stateful_selectables = [];
    }

    on_tick() {
        this.refresh();
    }

    refresh(){
        refreshDisplay3D(this.view, this.display_map, this.state);
        this.view.animate();
    }
    
    // TODO: add on_* methods to IGameDisplayHandler interface?
    /**
     * NOTE: Implicitly relies on subtle hack; final confirmation via "confirm click" 
     *     does not change `this.current_input`, so whole set of inputs can be correctly cleared.
     */ 
    on_selection(selection: InputSelection<ISelectable>, phase: IPhase) {
    }

    on_phase_end(phase: IPhase){
    }

    on_game_end(){
    }
}