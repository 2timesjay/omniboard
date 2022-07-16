import { ISelectable } from "../../model/core";
import { AbstractDisplay, AbstractDisplay3D, EntityDisplay3D, GridLocationDisplay3D, HudEntityDisplay, MenuElementDisplay3D } from "../../view/display";
import { View2DHudReadOnly } from "../../view/hud_rendering";
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
        display_map.set(loc, loc_display);
    }

    for (let entity of state.entities) {
        let entity_display = new CarDisplay3D(entity);
        display_map.set(entity, entity_display);
        for (let action of entity.actions) {
            let action_display = new MenuElementDisplay3D(action, entity_display)
            display_map.set(action, action_display);
        }
    }

    return display_map
}

export function car_hud_display_setup(
    state: PlaygroundState, view: View2DHudReadOnly
) {

    // TODO: Nicer way of handling display-only-entities character of HUD?
    // NOTE: Basically, HUD shows a completely different render. Hence diff display, same entity.
    //     Therefore it will not share displayState.
    var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();
    for (let entity of state.entities) {
        let entity_display = new HudEntityDisplay(entity);
        display_map.set(entity, entity_display);
    }

}