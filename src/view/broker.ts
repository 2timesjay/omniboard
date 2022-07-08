import { ISelectable } from "../model/core";
import { InputRequest, async_input_getter } from "../model/input";
import { BoardState, IState } from "../model/state";
import { DisplayHandler, refreshDisplay } from "./display_handler";
import { build_broker_callback, DisplayMap, inputEventToSelectable2D, SelectionBroker } from "./input";
import { IView, IView2D } from "./rendering";

export interface IBroker {
    input_request: InputRequest<ISelectable>;
};

// TODO: Eliminate all generics in this class if possible
// TODO: BoardState -> IState
// TODO: Unify listener setup (since 3 steps here are about that).
// TODO: Ensure this is robust to new Display creation. DisplayBrokerWrapper?
/**
 * Canvas2DBroker does the following
 * 1) sets up event listeners.
 * 2) configures those listeners to resolve/reject promise states
 *      clicks on SelectableDisplays that are available resolve as
 *      those selectables. Clicks on the unavailable reject.
 * 3) Creates the input_request that makes InputOptions available in 
 *      InputView and then listens for InputResponse.
 * 4) Wires the listeners to actual mouse events.
 */
export class Canvas2DBroker implements IBroker {
    input_request: InputRequest<ISelectable>;

    constructor(
        display_handler: DisplayHandler,
        view: IView2D,
    ) {
        var canvas = view.context.canvas;
        var selection_broker = new SelectionBroker(display_handler, null, inputEventToSelectable2D);
        // TODO: Error with unset handlers - dummies for now.
        selection_broker.setPromiseHandlers(()=>{console.log("sres")}, ()=>{console.log("srej")});
        // TODO: Move function into broker.
        var brokered_selection_fn = build_broker_callback(selection_broker, display_handler.display_map, canvas);
        var input_request = async_input_getter(brokered_selection_fn);
        this.input_request = input_request;
        
        this.addCanvasListeners(selection_broker, view);
    }
    
    addCanvasListeners(
        selection_broker: SelectionBroker,
        view: IView2D,
    ) {
        view.context.canvas.onclick = function (event) {
            selection_broker.onMouseEvent(event);
        }
        view.context.canvas.onmousemove = function (event) {
            selection_broker.onMouseEvent(event);
        }
        window.addEventListener(
            "keydown", 
            function (event) {
                selection_broker.onKeyboardEvent(event);
            }, 
            false,
        );
    }
}