import { Mesh, StaticReadUsage } from "three";
import { ISelectable, Tree } from "../model/core";
import { async_input_getter, CallbackSelectionFn, InputRequest, InputResponse, InputSignal, PreviewMap } from "../model/input";
import { ICoordinate } from "../model/space";
import { Awaited, Rejection } from "../model/utilities";
import { AbstractDisplay, DisplayState } from "./display";
import { BaseDisplayHandler, DisplayHandler } from "./display_handler";
import { HitRect2D, IView, IView2D, RenderObject } from "./rendering";
import { IView3D } from "./rendering_three";

export type DisplayMap = Map<ISelectable, AbstractDisplay<ISelectable>>;
export type RenderObjectToDisplayMap = Map<RenderObject, AbstractDisplay<ISelectable>>

// TODO: Consistent Style
export interface InputCoordinate {
    x: number;
    y: number;
}

export type OnInputEvent<T extends ISelectable> = (sel: T, type: string) => T | null;
export type inputEventToSelectable = (e: Event, display_handler: BaseDisplayHandler) => ISelectable | null;

export function getMouseCo(canvasDom: HTMLCanvasElement, mouseEvent: MouseEvent): InputCoordinate {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    };
}

export function getMouseCo3D(canvasDom: HTMLCanvasElement, mouseEvent: MouseEvent): InputCoordinate {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1,
        y: - ((mouseEvent.clientY - rect.top) / rect.height) * 2 + 1,
    };
}


// TODO: Sycnhronize with Selectable3D Merge into SelectionBroker
export function inputEventToSelectable2D(
    e: MouseEvent, display_handler: DisplayHandler,
): ISelectable | null {    
    // Pseudo-Raycast (2D) to check for hits.
    var canvas = display_handler.view.context.canvas as HTMLCanvasElement;
    // TODO: Resolve typeerror from making everything in Display IView.
    // @ts-ignore Has getHitObjects when it when it counts
    var hit_objects = display_handler.view.getHitObjects(
        getMouseCo(canvas, e), 
        Array.from(display_handler.render_object_map.keys()),
    );
    for (var hit_object of hit_objects) {
        if (display_handler.render_object_map.has(hit_object)) {
            var hit_display = display_handler.render_object_map.get(hit_object);
            if (hit_display.state != DisplayState.Neutral) {
                return hit_display.selectable;
            }
        }
    }
    return null;
}

export function inputEventToSelectable3D(
    e: MouseEvent, display_handler: DisplayHandler
): ISelectable | null {
    // Raycast to check for hits.
    var canvas = display_handler.view.context.canvas;
    // @ts-ignore Requires DisplayHandler have View3D 
    var hit_objects = display_handler.view.getHitObjects(getMouseCo3D(canvas, e));
    for (var hit_object of hit_objects) {
        if (display_handler.render_object_map.has(hit_object)) {
            var hit_display = display_handler.render_object_map.get(hit_object);
            if (hit_display.active) {
                return hit_display.selectable;
            }
        }
    }
    return null;
}

export class SelectionBroker {
    resolve: Awaited<ISelectable>;
    reject: Rejection;
    // Organize more efficiently; by input type?
    display_handler: BaseDisplayHandler;
    on_input_events: Array<OnInputEvent<ISelectable>>;
    input_event_to_selectable: inputEventToSelectable;
    mouseover_selection: ISelectable;
    options: Array<AbstractDisplay<ISelectable>>;

    constructor(
        display_handler: BaseDisplayHandler,
        input_event_to_selectable: inputEventToSelectable,
    ){
        this.display_handler = display_handler;          
        this.input_event_to_selectable = input_event_to_selectable;   
        this.options = [];       
    }

    setPromiseHandlers(resolve: Awaited<ISelectable>, reject: Rejection){
        this.resolve = resolve;
        this.reject = reject;
    }

    setOptions(options: Array<AbstractDisplay<ISelectable>>) {
        console.log("Setting Options: " + options);
        options.forEach((o) => o.state = DisplayState.Option);
        this.options = options;
    }

    onClick(e: MouseEvent) {
        var hit_selectable = this.input_event_to_selectable(e, this.display_handler);
        this.mouseover_selection = hit_selectable;
        for (let display of this.options) {
            display.onClick(hit_selectable);
        }
        if (hit_selectable != null) {
            this.resolve(hit_selectable);
        } else {
            this.reject();
        }
    }

    onMousemove(e: MouseEvent) {
        var hit_selectable = this.input_event_to_selectable(e, this.display_handler);
        this.mouseover_selection = hit_selectable;
        for (let display of this.options) {
            display.onMousemove(hit_selectable);
        }   
    }

    onKeyboardEvent (e: KeyboardEvent) {
        // Confirm/Reject
        const ENTER = "Enter";
        const C = "KeyC";
        const ESCAPE = "Escape";
        const X = "KeyX";

        // Select/"Null-reject";
        if (
            (e.code == C) &&
            (this.mouseover_selection != null) 
        ) {
            this.resolve(this.mouseover_selection);
        }
        if (e.code == X) {
            // this.resolve(InputSignal.Reject);
            this.reject();
        }

        // Confirm/Reject
        if (e.code == ENTER) {
            this.resolve(new InputResponse(null, InputSignal.Confirm));
        }
        if (e.code == ESCAPE) {
            this.resolve(new InputResponse(null, InputSignal.Reject));
        }

        // Enter/Exit
        const E = "KeyE";
        const D = "KeyD";
        if (e.code == E) {
            this.resolve(new InputResponse(null, InputSignal.Enter));
        }
        if (e.code == D) {
            this.resolve(new InputResponse(null, InputSignal.Exit));
        }
        
        // View Controls
        // TODO: Move into a more specific input handler mixin?
        if (this.display_handler.active_region != null) {
            const W = "KeyW";
            const S = "KeyS";
            if (e.code == W) {
                // @ts-ignore
                this.display_handler.active_region.z += 1;
            }
            if (e.code == S) {
                // @ts-ignore
                this.display_handler.active_region.z -= 1;
            }
        }
    }
}

/**
 * Broker objects
 */
export interface IBroker {
    input_request: InputRequest<ISelectable>;
    // new(display_handler: IDisplayHandler, view: IInputView<ICoordinate>): IBroker; // TODO: Doesn't work?
    addListeners: (selection_broker: SelectionBroker, view: IView<ICoordinate>) => void;
};

export enum DisplayDim {
    Two = 2,
    Three = 3,
}

function broker_selection_callback<T extends ISelectable>(
    selection_broker: SelectionBroker, display_map: DisplayMap
): CallbackSelectionFn<T> {
    // Sets selection_broker's fanout to on_input_events of instances of T in Options.
    return (options: Array<T>, resolve: Awaited<T>, reject: Rejection) => {
        // TODO: Have this filtering happen in a more legible place as part of refactor.
        var displays = options.map((o) => display_map.get(o)).filter((d) => d != null);
        selection_broker.setOptions(displays);
        selection_broker.setPromiseHandlers(resolve, reject);
    }
}

// TODO: Merge with SelectionBroker
// TODO: Unify listener setup (since 3 steps here are about that).
/**
 * Broker does the following
 * 1) sets up event listeners.
 * 2) configures those listeners to resolve/reject promise states
 *      clicks on SelectableDisplays that are available resolve as
 *      those selectables. Clicks on the unavailable reject.
 * 3) Creates the input_request that makes InputOptions available in 
 *      InputView and then listens for InputResponse.
 * 4) Wires the listeners to actual mouse events.
 */
 export class Broker implements IBroker {
    input_request: InputRequest<ISelectable>;

    constructor(
        display_handler: DisplayHandler,
        view: IView<ICoordinate>,
        display_dim: DisplayDim,
        broker_class?: typeof SelectionBroker,
    ) {
        if (display_dim === DisplayDim.Two) {
            var input_event_to_selectable = inputEventToSelectable2D;
        } else {
            var input_event_to_selectable = inputEventToSelectable3D;
        }
        if (broker_class === undefined) {
            broker_class = SelectionBroker
        }
        // @ts-ignore Incompatible RenderingCon
        var selection_broker = new broker_class(display_handler, input_event_to_selectable);
        // TODO: Error with unset handlers - dummies for now.
        selection_broker.setPromiseHandlers(()=>{console.log("sres")}, ()=>{console.log("srej")});
        // TODO: Move function into broker.
        // @ts-ignore OK with 3d displays
        var broker_selection_fn = broker_selection_callback(selection_broker, display_handler.display_map);
        var input_request = async_input_getter(broker_selection_fn);
        this.input_request = input_request;
        
        this.addListeners(selection_broker, view);
    }
    
    addListeners(
        selection_broker: SelectionBroker,
        view: IView<ICoordinate>,
    ) {
        // @ts-ignore No OffscreenCanvas
        view.context.canvas.onclick = function (event: MouseEvent) {
            selection_broker.onClick(event);
        }
        // @ts-ignore No OffscreenCanvas
        view.context.canvas.onmousemove = function (event: MouseEvent) {
            selection_broker.onMousemove(event);
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