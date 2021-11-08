import { ISelectable } from "../model/core";
import { Awaited, Rejection } from "../model/utilities";

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

// TODO: Remove if SelectionBroker sufficient?
// // export type CallbackSelectionFn<T extends ISelectable> = (
// //     arr: Array<T>, resolve: Awaited<T>, reject: Rejection // Awaited from utilities. Replace in ts 4.5
// // ) => void;
// export async function DisplayAndAcquire<T extends ISelectable>(
//     options: Array<T>, resolve: Awaited<T>, reject: Rejection
// ) {
//     // Set all options to selectable.
//     // await clickListener for one of those options to trigger.
//     // On clickListener triggering, resolve.
//     // On any click that does not trigger an option clickListener, reject
// }

export type DisplayHitListener<T extends ISelectable> = (e: MouseEvent) => T

export class SelectionBroker<T extends ISelectable> {
    resolve: Awaited<T>;
    reject: Rejection;
    // Organize more efficiently
    listeners: Array<DisplayHitListener<T>>;

    constructor(listeners: Array<DisplayHitListener<T>>){
        this.listeners = listeners;
    }

    onclick(e: MouseEvent) { 
        for (let listener of this.listeners) {
            var selection = listener(e);
            if (selection) { // find first valid selection
                this.resolve(selection); 
                return;
            }
        }
        this.reject();
    }
    
    onmousemove(e: MouseEvent) { 
        for (let listener of this.listeners) {
            var selection = listener(e);
            if (selection) { // find first valid selection
                this.resolve(selection); 
                return;
            }
        }
    }
}