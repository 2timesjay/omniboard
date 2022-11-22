import { ISelectable } from "../model/core";
import { BoardState } from "../model/state";
import { GLOBAL_CONFIRMATION } from "./unit";
import { GridLocationDisplay, UnitDisplay, MenuElementDisplay, AbstractDisplay, HealthVisual } from "../view/display";
import { IView2D } from "../view/rendering";

/**
 * Create Display elements for every selectable in state.
 */
export function display_setup(
        state: BoardState, view: IView2D,
): Map<ISelectable, AbstractDisplay<ISelectable>> {
    var units = state.units;
    var grid = state.grid;
    
    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();

    for (let grid_row of grid.locs) {
        for (let grid_loc of grid_row) {
            let grid_display = new GridLocationDisplay(grid_loc);
            display_map.set(grid_loc, grid_display);
            grid_display.display(view);
        }
    }

    for (let unit of units) {
        let unit_display = new UnitDisplay(unit);
        for (let action of unit.actions) {
            let action_display = new MenuElementDisplay(action, unit_display)
            display_map.set(action, action_display);
            action_display.display(view);
        }
        for (let i = 0; i < unit.all_hp.length; i++) {
            // TODO: Make attachment more explicit instead of hidden in constructor.
            // TODO: Move this into unit_display construction?
            new HealthVisual(unit_display, i);
        }
        display_map.set(unit, unit_display);
        unit_display.display(view);
    }

    let global_confirmation_display = new MenuElementDisplay(
        GLOBAL_CONFIRMATION, 
        // @ts-ignore doesn't know this is an ILocatableDisplay
        // TODO: Replace with some kind of "invisible pin" display.
        display_map.get(grid.get({x: 1, y: 1})), 
    )
    display_map.set(GLOBAL_CONFIRMATION, global_confirmation_display);
    return display_map
}