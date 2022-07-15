import { Mesh, StaticReadUsage } from "three";
import { ISelectable, Tree } from "../model/core";
import { async_input_getter, CallbackSelectionFn, InputRequest, InputSignal, PreviewMap } from "../model/input";
import { Awaited, Rejection } from "../model/utilities";
import { AbstractDisplay, AbstractDisplay3D, DisplayState } from "./display";
import { BaseDisplayHandler, DisplayHandler } from "./display_handler";
import { DisplayHandler3D } from "./display_handler_three";
import { HitRect2D, IView, IView2D, RenderObject } from "./rendering";
import { IView3D } from "./rendering_three";

export type DisplayMap<T> = Map<T, AbstractDisplay<T>>;
export type DisplayMap3D<T> = Map<T, AbstractDisplay3D<T>>;
export type RenderObjectToDisplayMap<T> = Map<RenderObject, AbstractDisplay<T>>

// TODO: Consistent Style
export interface InputCoordinate {
    x: number;
    y: number;
}

export type OnInputEvent<T extends ISelectable> = (sel: T, type: string) => T | null;
export type inputEventToSelectable = (e: Event, display_handler: BaseDisplayHandler) => ISelectable | null;

export function getMouseCo(canvasDom: HTMLElement, mouseEvent: MouseEvent): InputCoordinate {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    };
}

export function getMouseCo3D(canvasDom: HTMLElement, mouseEvent: MouseEvent): InputCoordinate {
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
    var canvas = display_handler.view.context.canvas;
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
    e: MouseEvent, display_handler: DisplayHandler3D
): ISelectable | null {
    // Raycast to check for hits.
    var canvas = display_handler.view.context.canvas;
    var hit_objects = display_handler.view.getHitObjects(getMouseCo3D(canvas, e));
    for (var hit_object of hit_objects) {
        if (display_handler.render_object_map.has(hit_object)) {
            var hit_display = display_handler.render_object_map.get(hit_object);
            if (hit_display.active) {
                console.log("Hit: ", hit_objects);
                console.log("Hit Display: ", hit_display);
                return hit_display.selectable;
            }
        }
    }
    return null;
}

export function setupOptions(options: Array<AbstractDisplay<ISelectable>>) {
    options.forEach((o) => o.state = DisplayState.Option);
}

export class SelectionBroker {
    resolve: Awaited<ISelectable>;
    reject: Rejection;
    // Organize more efficiently; by input type?
    display_handler: BaseDisplayHandler;
    on_input_events: Array<OnInputEvent<ISelectable>>;
    input_event_to_selectable: inputEventToSelectable;
    mouseover_selection: ISelectable;

    constructor(
        display_handler?: BaseDisplayHandler,
        on_input_events?: Array<OnInputEvent<ISelectable>>, 
        input_event_to_selectable?: inputEventToSelectable,
    ){
        if (display_handler){
            this.display_handler = display_handler;          
        }
        // TODO: Why are the args optional?
        if (on_input_events){
            this.setOnInputEvents(on_input_events);            
        }
        if (input_event_to_selectable){
            this.input_event_to_selectable = input_event_to_selectable;          
        }
    }

    // TODO: Why this special setter?
    setOnInputEvents(on_input_events: Array<OnInputEvent<ISelectable>>) {
        this.on_input_events = on_input_events;
    }

    setPromiseHandlers(resolve: Awaited<ISelectable>, reject: Rejection){
        this.resolve = resolve;
        this.reject = reject;
    }

    onMouseEvent(e: MouseEvent) {
        var hit_selectable = this.input_event_to_selectable(e, this.display_handler);
        this.mouseover_selection = hit_selectable;

        if (e.type == "click") {
            // Fanout clicks to all on_input_events
            var nohits = true;
            for (let on_input_event of this.on_input_events) {
                // Updates InputState display and returns selection if viable option (active).
                var selection = on_input_event(hit_selectable, "click");
                if (selection && nohits) {
                    this.resolve(selection); 
                    nohits = false;
                }
            }
            if (nohits) {
                this.reject();
            }
        } else if (e.type == "mousemove") {
            // Fanout mousemove to all on_input_events
            for (let on_input_event of this.on_input_events) {
                // Updates InputState display.
                on_input_event(hit_selectable, "mousemove");
            }
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
            this.resolve(InputSignal.Confirm);
        }
        if (e.code == ESCAPE) {
            this.resolve(InputSignal.Reject);
        }

        // Enter/Exit
        const E = "KeyE";
        const D = "KeyD";
        if (e.code == E) {
            this.resolve(InputSignal.Enter);
        }
        if (e.code == D) {
            this.resolve(InputSignal.Exit);
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

// CallbackSelectionFn
export function build_broker_callback<T extends ISelectable>(
    selection_broker: SelectionBroker, display_map: DisplayMap<T>, canvas: HTMLCanvasElement
): CallbackSelectionFn<T> {
    // Sets selection_broker's fanout to on_input_events of instances of T in Options.
    return (options: Array<T>, resolve: Awaited<T>, reject: Rejection) => {
        console.log("Setup Selection Callbacks on Canvas: ", options);
        var displays = options.map((o) => display_map.get(o));
        console.log("Display callback targets: ", displays);
        var onclicks = displays.map(
            (d) => d.createOnclick(canvas)
        );
        var onmousemoves =  displays.map(
            (d) => d.createOnmousemove(canvas)
        );
        setupOptions(displays);
        selection_broker.setOnInputEvents([...onclicks, ...onmousemoves]);
        selection_broker.setPromiseHandlers(resolve, reject);
    }
}

/**
 * Broker objects
 */


export interface IBroker {
    input_request: InputRequest<ISelectable>;
    // new(display_handler: IDisplayHandler, view: IView<ICoordinate>): IBroker; // TODO: Doesn't work?
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


// TODO: Fold into SelectionBroker
// TODO: Unify listener setup (since 3 steps here are about that).
// TODO: Ensure this is robust to new Display creation. DisplayBrokerWrapper?
/**
 * ThreeBroker does the following
 * 1) sets up event listeners.
 * 2) configures those listeners to resolve/reject promise states
 *      clicks on SelectableDisplays that are available resolve as
 *      those selectables. Clicks on the unavailable reject.
 * 3) Creates the input_request that makes InputOptions available in 
 *      InputView and then listens for InputResponse.
 * 4) Wires the listeners to actual mouse events.
 */
 export class ThreeBroker implements IBroker {
    input_request: InputRequest<ISelectable>;

    constructor(
        display_handler: DisplayHandler3D, 
        view: IView3D,
    ) {
        // @ts-ignore Incompatible RenderingContexts
        var selection_broker = new SelectionBroker(display_handler, null, inputEventToSelectable3D);
        var display_map = display_handler.display_map;
        // TODO: Error with unset handlers - dummies for now.
        selection_broker.setPromiseHandlers(()=>{console.log("sres")}, ()=>{console.log("srej")});
        // TODO: Move function into broker.
        // @ts-ignore OK with 3d displays
        var brokered_selection_fn = build_broker_callback(selection_broker, display_map, view.context.canvas);
        var input_request = async_input_getter(brokered_selection_fn);
        this.input_request = input_request;
        
        this.addListeners(selection_broker, view);
    }
    
    addListeners(
        selection_broker: SelectionBroker,
        view: IView3D, 
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