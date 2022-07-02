import { ISelectable } from "../model/core";
import { InputRequest, async_input_getter } from "../model/input";
import { IState } from "../model/state";
import { IBroker } from "./broker";
import { build_broker_callback, DisplayMap, SelectionBroker } from "./input";
import { IView } from "./rendering";
import { IView3D } from "./rendering_three";

// TODO: Eliminate all generics in this class if possible
// TODO: BoardState -> IState
// TODO: Unify listener setup (since 3 steps here are about that).
// TODO: Ensure this is robust to new Display creation. DisplayBrokerWrapper?
/**
 * ThreeBroker does the following
 * 1) sets up event listeners.
 * 2) configures those listeners to resolve/reject promise states
 *      clicks on SelectableDisplays that are available resolve as
 *      those selectables. Clicks on the unavailable reject.
 * 3) Creates the input_request that makes InputOptions available in 
 *      InputView and then listens for InputSelection.
 * 4) Wires the listeners to actual mouse events.
 */
export class ThreeBroker implements IBroker {
    input_request: InputRequest<ISelectable>;

    constructor(
        display_map: DisplayMap<ISelectable>, 
        state: IState, // TODO: Remove
        view: IView3D,
    ) {
        var selection_broker = new SelectionBroker<ISelectable>();
        // TODO: Error with unset handlers - dummies for now.
        selection_broker.setPromiseHandlers(()=>{console.log("sres")}, ()=>{console.log("srej")});
        // TODO: Move function into broker.
        // @ts-ignore OK with 3d displays
        var brokered_selection_fn = build_broker_callback(selection_broker, display_map, view);
        var input_request = async_input_getter(brokered_selection_fn);
        this.input_request = input_request;
        
        // TODO: !!! Reinstate adding listeners
        // this.addListeners(selection_broker, view);
    }
    
    addListeners(
        selection_broker: SelectionBroker<ISelectable>,
        view: IView3D, 
    ) {
        view.context.canvas.onclick = function (event) {
            selection_broker.onclick(event);
        }
        view.context.canvas.onmousemove = function (event) {
            selection_broker.onmousemove(event);
        }
        window.addEventListener(
            "keydown", 
            function (event) {
                selection_broker.onkeyboardevent(event);
            }, 
            false,
        );
    }
}