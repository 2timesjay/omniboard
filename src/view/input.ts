import { ISelectable, Tree } from "../model/core";
import { CallbackSelectionFn, PreviewMap } from "../model/input";
import { Awaited, Rejection } from "../model/utilities";
import { AbstractDisplay, DisplayState } from "./display";

export type DisplayMap<T> = Map<T, AbstractDisplay<T>>;

// TODO: Consistent Style
export interface Position {
    x: number;
    y: number;
}

export function getMousePos(canvasDom: HTMLElement, mouseEvent: MouseEvent): Position {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    };
}

export type DisplayHitListener<T extends ISelectable> = (e: MouseEvent) => T

export function setUpOptions(options: Array<AbstractDisplay<ISelectable>>) {
    options.forEach((o) => o.state = DisplayState.Option);
}

export class SelectionBroker<T extends ISelectable> {
    resolve: Awaited<T>;
    reject: Rejection;
    // Organize more efficiently; by input type?
    listeners: Array<DisplayHitListener<T>>;

    constructor(listeners?: Array<DisplayHitListener<T>>){
        if (listeners){
            this.setListeners(listeners);            
        }
    }

    setListeners(listeners: Array<DisplayHitListener<T>>) {
        this.listeners = listeners;
    }

    setPromiseHandlers(resolve: Awaited<T>, reject: Rejection){
        this.resolve = resolve;
        this.reject = reject;
    }

    // TODO: Requirement that all listeners trigger in order to 'de-select' is too complex.
    onclick(e: MouseEvent) { 
        var nohits = true;
        for (let listener of this.listeners) {
            var selection = listener(e);
            if (selection && nohits) {
                this.resolve(selection); 
                nohits = false;
            }
        }
        if (nohits) {
            this.reject();
        }
    }
    
    onmousemove(e: MouseEvent) {
        // TODO: Clean up: No Selection on Mousemove 
        var nohits = true;
        for (let listener of this.listeners) {
            var selection = listener(e);
            // if (selection && nohits) {
            //     this.resolve(selection); 
            //     nohits = false;
            // }
        }
        // if (nohits) {
        //     this.reject();
        // }
    }
}

// CallbackSelectionFn
export function setup_selection_broker<T extends ISelectable>(
    selection_broker: SelectionBroker<T>, display_map: DisplayMap<T>, canvas: HTMLCanvasElement
): CallbackSelectionFn<T> {
    console.log("generating selection broker");
    return (options: Array<T>, resolve: Awaited<T>, reject: Rejection) => {
        var displays = options.map((o) => display_map.get(o));
        // TODO: These aren't really listeners. onClick?
        var click_listeners = displays.map(
            (d) => d.createClickListener(canvas)
        );
        var mousemove_listeners =  displays.map(
            (d) => d.createPreviewListener(canvas)
        );
        setUpOptions(displays);
        selection_broker.setListeners([...click_listeners, ...mousemove_listeners]);
        selection_broker.setPromiseHandlers(resolve, reject);
    }
}