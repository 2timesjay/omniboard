import { ISelectable } from "../../model/core";
import { GridLocationDisplay, UnitDisplay, MenuElementDisplay, AbstractDisplay, HealthVisual, EntityDisplay, GridLocationDisplay3D, EntityDisplay3D, AbstractDisplay3D, MenuElementDisplay3D } from "../../view/display";
import { IView, IView2D } from "../../view/rendering";
import { IView3D } from "../../view/rendering_three";
import { PlaygroundState } from "../playground_state";

/**
 * Create Display elements for every selectable in state.
 */
export function playground_display_setup(
        state: PlaygroundState, view: IView2D,
): Map<ISelectable, AbstractDisplay<ISelectable>> {
    
    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();

    for (let loc of state.space.to_array()) {
        // @ts-ignore Actually a GridLocation in this case.
        let loc_display = new GridLocationDisplay(loc);
        display_map.set(loc, loc_display);
        loc_display.display(view);
    }

    for (let entity of state.entities) {
        let entity_display = new EntityDisplay(entity);
        display_map.set(entity, entity_display);
        entity_display.display(view);
        for (let action of entity.actions) {
            let action_display = new MenuElementDisplay(action, entity_display)
            display_map.set(action, action_display);
            action_display.display(view);
        }
    }

    return display_map
}


// TODO: Separate `display` calls
/**
 * Create Display elements for every selectable in state.
 */
 export function playground_display_setup_3D(
    state: PlaygroundState, view: IView3D,
): Map<ISelectable, AbstractDisplay3D<ISelectable>> {

    // TODO: Derive all Displays from get_selectables. Reqs full info in each sel.
    var display_map = new Map<ISelectable, AbstractDisplay3D<ISelectable>>();

    for (let loc of state.space.to_array()) {
        // @ts-ignore Actually a GridLocation in this case.
        let loc_display = new GridLocationDisplay3D(loc);
        // @ts-ignore fix Display3D inheritance
        display_map.set(loc, loc_display);
        // @ts-ignore
        loc_display.display(view);
    }

    for (let entity of state.entities) {
        let entity_display = new EntityDisplay3D(entity);
        // @ts-ignore fix Display3D inheritance
        display_map.set(entity, entity_display);
        // @ts-ignore
        entity_display.display(view);
        for (let action of entity.actions) {
            let action_display = new MenuElementDisplay3D(action, entity_display)
            display_map.set(action, action_display);
            action_display.display(view);
        }
    }

    return display_map
}