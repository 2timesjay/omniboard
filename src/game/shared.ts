import { ISelectable } from "../model/core";
import { GridSpace } from "../model/space";
import { DisplayMap } from "../view/input";


export function refreshDisplay(context: CanvasRenderingContext2D, grid_space: GridSpace, display_map: DisplayMap<ISelectable>){
    for (let grid_row of grid_space.locs) {
        for (let grid_loc of grid_row) {
            var grid_display = display_map.get(grid_loc);
            grid_display.display(context);
        }
    }
}