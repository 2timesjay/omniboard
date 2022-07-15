import { ISelectable } from "../../model/core";
import { AbstractDisplay3D, EntityDisplay3D, GridLocationDisplay3D, MenuElementDisplay3D } from "../../view/display";
import { IView3D } from "../../view/rendering_three";
import { PlaygroundState } from "../playground_state";
import { CarDisplay3D } from "./car_display";

/**
 * Create Display elements for every selectable in state.
 */
 export function car_display_setup(
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
        // let entity_display = new EntityDisplay3D(entity);
        let entity_display = new CarDisplay3D(entity);
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