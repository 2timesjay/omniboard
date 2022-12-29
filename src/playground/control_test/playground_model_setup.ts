import { Entity } from "../../common/entity";
import { EntityMoveAction } from "../playground_action";
import { LineSpace, VolumeSpace } from "../playground_space";
import { PlaygroundState } from "../playground_state";

/**
 * Create a KxK grid for Tactics game
 */
export function playground_model_setup(k: number, d: number): PlaygroundState {
    var state = new PlaygroundState();

    // Space Setup
    const volume_space = new VolumeSpace(k, k, d);
    for (var loc of volume_space.to_array()) {
        if (loc.co.z > 0) { loc.traversable = false}
    }
    if (d >= 2) {
        console.log("Volume: ", volume_space);
        volume_space.get({x: 0, y: 0, z: 1}).traversable = true;
        volume_space.get({x: 1, y: 0, z: 1}).traversable = true;
        volume_space.get({x: 2, y: 0, z: 1}).traversable = true;
    }
    if (d >= 3) {
        console.log("Volume: ", volume_space);
        volume_space.get({x: 0, y: 0, z: 2}).traversable = true;
    }

    // TODO: Have to pass state for Action construction? Circular?
    var entity_0 = new Entity(volume_space.get({x: 1, y: 2, z: 0}));
    // @ts-ignore
    entity_0.setActions([new EntityMoveAction(entity_0, state)])
    var entity_1 = new Entity(volume_space.get({x: 2, y: 2, z: 0}));
    // @ts-ignore
    entity_1.setActions([new EntityMoveAction(entity_1, state)])

    // State Setup
    // TODO: Construct state with space and entities instead of later assignment.
    state.space = volume_space;
    state.entities = [entity_0, entity_1];

    return state
}