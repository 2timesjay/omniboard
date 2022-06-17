import { ISelectable } from "../model/core";
import { BoardState } from "../model/state";
import { GLOBAL_CONFIRMATION, Unit } from "../model/unit";
import { GridLocationDisplay, UnitDisplay, MenuElementDisplay, AbstractDisplay, HealthVisual, EntityDisplay } from "../view/display";
import { PlaygroundState } from "./playground_state";

/**
 * Create Display elements for every selectable in state.
 */
export function playground_display_setup(
        state: PlaygroundState, context: CanvasRenderingContext2D
): Map<ISelectable, AbstractDisplay<ISelectable>> {
    
    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();

    for (let loc of state.space.to_array()) {
        // @ts-ignore Actually a GridLocation in this case.
        let loc_display = new GridLocationDisplay(loc);
        display_map.set(loc, loc_display);
        loc_display.display(context);
    }

    for (let entity of state.entities) {
        let entity_display = new EntityDisplay(entity);
        display_map.set(entity, entity_display);
        entity_display.display(context);
    }

    return display_map
}