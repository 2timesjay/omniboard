import { ISelectable } from "../model/core";
import { GridSpace } from "../model/space";
import { Unit } from "../model/unit";
import { DisplayMap } from "../view/input";


export function refreshDisplay(
    context: CanvasRenderingContext2D, 
    display_map: DisplayMap<ISelectable>, 
    grid_space: GridSpace, 
    units?: Array<Unit> | null
) {
    // Clear canvas
    var canvas = context.canvas;
    context.clearRect(0, 0, canvas.width, canvas.height);
    // TODO: Just refresh all display_map elements.
    for (let grid_row of grid_space.locs) {
        for (let grid_loc of grid_row) {
            var grid_display = display_map.get(grid_loc);
            grid_display.display(context);
        }
    }
    if (units) {
        for (let unit of units) {
            var unit_display = display_map.get(unit);
            unit_display.display(context);
            for (let action of unit.actions) {
                var action_display = display_map.get(action);
                action_display.display(context);
            }
        }
    }
}