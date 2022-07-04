import { StaticReadUsage } from "three";
import { ISelectable, Tree } from "../model/core";
import { CallbackSelectionFn, PreviewMap } from "../model/input";
import { Awaited, Rejection } from "../model/utilities";
import { AbstractDisplay, DisplayState } from "./display";
import { BaseDisplayHandler, DisplayHandler } from "./display_handler";
import { DisplayHandler3D } from "./display_handler_three";
import { IView } from "./rendering";

export type DisplayMap<T> = Map<T, AbstractDisplay<T>>;

// TODO: Consistent Style
export interface InputCoordinate {
    x: number;
    y: number;
}

export type OnInputEvent = (sel: ISelectable) => ISelectable | null;
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

export function inputEventToSelectable2D(
    e: MouseEvent, display_handler: DisplayHandler,
): ISelectable | null {    
    // Fanout mouse input to all Displays to check for hits.
    var nohits = true;
    var canvas = display_handler.context.canvas;
    for (var display of display_handler.display_map.values()) {
        var selectable = display.isHit(getMouseCo(canvas, e));
        if (selectable && nohits) {
            nohits = false;
            return selectable;
        }
    }
    if (nohits) {
        return null;
    }
}
export function inputEventToSelectable3D(
    e: MouseEvent, display_handler: DisplayHandler3D
): ISelectable | null {
    // Raycast to check for hits.
    var nohits = true;
    var canvas = display_handler.context.canvas;
    var hit_object3D = display_handler.view.getHitObject(getMouseCo3D(canvas, e));
    console.log("Hit: ", hit_object3D);

    for (var display of display_handler.display_map.values()) {
        // var selectable = display.isHit(getMouseCo(canvas, e));
        var selectable = null;
        if (selectable && nohits) {
            // @ts-ignore DisplayHitOnevent returns broad ISelectable. Need safe casting.
            return selectable;
            nohits = false;
        }
    }
    if (nohits) {
        return null;
    }
}

export function setupOptions(options: Array<AbstractDisplay<ISelectable>>) {
    options.forEach((o) => o.state = DisplayState.Option);
}

export class SelectionBroker {
    resolve: Awaited<ISelectable>;
    reject: Rejection;
    // Organize more efficiently; by input type?
    display_handler: BaseDisplayHandler;
    on_input_events: Array<OnInputEvent>;
    input_event_to_selectable: inputEventToSelectable;
    mouseover_selection: ISelectable;

    constructor(
        display_handler?: BaseDisplayHandler,
        on_input_events?: Array<OnInputEvent>, 
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
    setOnInputEvents(on_input_events: Array<OnInputEvent>) {
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
                var selection = on_input_event(hit_selectable);
                if (selection && nohits) {
                    this.resolve(selection); 
                    nohits = false;
                }
            }
            if (nohits) {
                this.reject();
            }
        } else if (e.type == "mouseover") {
            // Fanout mousemove to all on_input_events
            for (let on_input_event of this.on_input_events) {
                // Updates InputState display.
                on_input_event(e);
            }
        }        
    }

    onKeyboardEvent (e: KeyboardEvent) {
        const ENTER = "Enter";
        const C = "KeyC";
        const ESCAPE = "Escape";
        const X = "KeyX";
        if (
            (e.code == ENTER || e.code == C) &&
            (this.mouseover_selection != null) 
        ) {
            this.resolve(this.mouseover_selection);
        }
        if (e.code == ESCAPE || e.code == X) {
            console.log(this);
            this.reject();
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