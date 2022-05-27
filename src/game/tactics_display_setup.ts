import { ISelectable } from "../model/core";
import { BoardState } from "../model/state";
import { GLOBAL_CONFIRMATION } from "../model/unit";
import { GridLocationDisplay, UnitDisplay, MenuElementDisplay, AbstractDisplay } from "../view/display";

export function display_setup(
        k: number, state: BoardState, context: CanvasRenderingContext2D
    ): Map<ISelectable, AbstractDisplay<ISelectable>> {
    var units = state.units;
    var grid = state.grid;
    
    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();

    for (let grid_row of grid.locs) {
        for (let grid_loc of grid_row) {
            let grid_display = new GridLocationDisplay(grid_loc);
            display_map.set(grid_loc, grid_display);
            grid_display.display(context);
        }
    }

    for (let unit of units) {
        let unit_display = new UnitDisplay(unit);
        for (let action of unit.actions) {
            let action_display = new MenuElementDisplay(action, unit_display)
            display_map.set(action, action_display);
            action_display.display(context);
        }
        display_map.set(unit, unit_display);
        unit_display.display(context);
    }

    // TODO: Safer Laziness in action construction
    for (let unit of units) {
        let unit_display = new UnitDisplay(unit);
        for (let action of unit.actions) {
            let action_display = new MenuElementDisplay(action, unit_display)
            display_map.set(action, action_display);
            action_display.display(context);
        }
        display_map.set(unit, unit_display);
        unit_display.display(context);
    }

    let global_confirmation_display = new MenuElementDisplay(
        GLOBAL_CONFIRMATION, 
        // @ts-ignore doesn't know this is an ILocatableDisplay
        // TODO: Replace with some kind of "invisible pin" display.
        display_map.get(grid.get(1,1)), 
    )
    display_map.set(GLOBAL_CONFIRMATION, global_confirmation_display);
    return display_map
}