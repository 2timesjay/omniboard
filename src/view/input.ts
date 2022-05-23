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

export type DisplayHitOnevent = (e: MouseEvent) => ISelectable | null;

export function setupOptions(options: Array<AbstractDisplay<ISelectable>>) {
    options.forEach((o) => o.state = DisplayState.Option);
}

export class SelectionBroker<T extends ISelectable> {
    resolve: Awaited<T>;
    reject: Rejection;
    // Organize more efficiently; by input type?
    onevents: Array<DisplayHitOnevent>;

    constructor(onevents?: Array<DisplayHitOnevent>){
        if (onevents){
            this.setonevents(onevents);            
        }
    }

    setonevents(onevents: Array<DisplayHitOnevent>) {
        this.onevents = onevents;
    }

    setPromiseHandlers(resolve: Awaited<T>, reject: Rejection){
        this.resolve = resolve;
        this.reject = reject;
    }

    // TODO: Requirement that all onevents trigger in order to 'de-select' is too complex.
    onclick(e: MouseEvent) { 
        // Fanout clicks to all onevents
        var nohits = true;
        for (let onevent of this.onevents) {
            var selection = onevent(e);
            if (selection && nohits) {
                // @ts-ignore DisplayHitOnevent returns broad ISelectable. Need safe casting.
                this.resolve(selection); 
                nohits = false;
            }
        }
        if (nohits) {
            this.reject();
        }
    }
    
    onmousemove(e: MouseEvent) {
        // Fanout clicks to all onevents
        var nohits = true;
        for (let onevent of this.onevents) {
            onevent(e); // Ignore Selection output.
        }
    }
}

// CallbackSelectionFn
export function build_broker_callback<T extends ISelectable>(
    selection_broker: SelectionBroker<T>, display_map: DisplayMap<T>, canvas: HTMLCanvasElement
): CallbackSelectionFn<T> {
    // Sets selection_broker's fanout to onevents of instances of T in Options.
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
        selection_broker.setonevents([...onclicks, ...onmousemoves]);
        selection_broker.setPromiseHandlers(resolve, reject);
    }
}