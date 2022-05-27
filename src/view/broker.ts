import { ISelectable } from "../model/core";
import { InputRequest, async_input_getter } from "../model/input";
import { BoardState, IState } from "../model/state";
import { refreshDisplay } from "./display_handler";
import { build_broker_callback, DisplayMap, SelectionBroker } from "./input";

interface IBroker {
    input_request: InputRequest<ISelectable>;
};

// TODO: Eliminate all generics in this class if possible
// TODO: BoardState -> IState
export class Canvas2DBroker implements IBroker {
    input_request: InputRequest<ISelectable>;

    constructor(
        display_map: DisplayMap<ISelectable>, 
        state: BoardState, 
        context: CanvasRenderingContext2D
    ) {
        var canvas = context.canvas;
        var selection_broker = new SelectionBroker<ISelectable>();
        // TODO: Error with unset handlers - dummies for now.
        selection_broker.setPromiseHandlers(()=>{console.log("sres")}, ()=>{console.log("srej")});
        var brokered_selection_fn = build_broker_callback(selection_broker, display_map, canvas);
        var input_request = async_input_getter(brokered_selection_fn);
        this.input_request = input_request;
        
        
        // TODO: Before this will work must rework canvas onclick -> display onclick connection
        this.addCanvasListeners(selection_broker, context, display_map, state);
        // addCanvasListeners(unit_selection_broker, context, display_map, grid, units);
    }
    
    addCanvasListeners(
        selection_broker: SelectionBroker<ISelectable>,
        context: CanvasRenderingContext2D, 
        display_map: DisplayMap<ISelectable>,
        state: BoardState,
    ) {
        context.canvas.onclick = function (event) {
            selection_broker.onclick(event);
            refreshDisplay(context, display_map, state);
        }
        context.canvas.onmousemove = function (event) {
            selection_broker.onmousemove(event);
            refreshDisplay(context, display_map, state);
        }
    }
}