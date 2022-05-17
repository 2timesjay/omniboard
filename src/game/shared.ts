import { ISelectable } from "../model/core";
import { GridSpace } from "../model/space";
import { BoardState } from "../model/state";
import { Unit } from "../model/unit";
import { DisplayMap } from "../view/input";


export function refreshDisplay(
    context: CanvasRenderingContext2D, 
    display_map: DisplayMap<ISelectable>,
    state: BoardState,
) {
    // Clear canvas
    var canvas = context.canvas;
    context.clearRect(0, 0, canvas.width, canvas.height);
    // TODO: Just refresh all display_map elements.
    for (let selectable of state.get_selectables()) {
        var display = display_map.get(selectable);
        display.display(context);
    }
}