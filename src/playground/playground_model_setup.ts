import { Entity } from "./playground_entity";
import { LineSpace } from "./playground_space";
import { PlaygroundState } from "./playground_state";

/**
 * Create a KxK grid for Tactics game
 */
export function playground_setup(k: number): PlaygroundState {
    // Space Setup
    const line_space = new LineSpace(8);

    var entity_0 = new Entity(line_space.get({x: 3}));
    var entity_1 = new Entity(line_space.get({x: 5}));

    // State Setup
    var state = new PlaygroundState();
    // TODO: Do I need to assign grid here? Should not be needed. Call grid late in unit.
    state.space = line_space;
    state.entities = [entity_0, entity_1];

    return state
}