import { ISelectable } from "../model/core";
import { Awaited, Rejection } from "../model/utilities";

// TODO: Consistent Style
export interface Position {
    x: number;
    y: number;
}

// TODO: correct types
export function getMousePos(canvasDom: HTMLElement, mouseEvent: MouseEvent): Position {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    };
}

// export type CallbackSelectionFn<T extends ISelectable> = (
//     arr: Array<T>, resolve: Awaited<T>, reject: Rejection // Awaited from utilities. Replace in ts 4.5
// ) => void;
export async function DisplayAndAcquire<T extends ISelectable>(
    options: Array<T>, resolve: Awaited<T>, reject: Rejection
) {
    // Set all options to selectable.
    // await clickListener for one of those options to trigger.
    // On clickListener triggering, resolve.
    // On any click that does not trigger an option clickListener, reject
}