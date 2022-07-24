import { Action, MOVE } from "../model/action";
import { Stack } from "../model/core";
import { Effect, MoveEffect, ExhaustEffect } from "../model/effect";
import { Entity } from "../model/entity";
import { SequentialInputAcquirer } from "../model/input";
import { Inputs } from "../model/phase";
import { GridLocation, ILocation } from "../model/space";
import { IState } from "../model/state";
import { PlaygroundInputs } from "./playground_controller";
import { PlaygroundMoveEffect } from "./playground_effect";
import { VolumeSpace } from "./playground_space";
import { PlaygroundState } from "./playground_state";

export type PAction = Action<ILocation, PlaygroundState>;

export class EntityMoveAction extends Action<ILocation, PlaygroundState> {
    // @ts-ignore Inheritance-breaking Entity instead of Unit
    source: Entity;

    constructor(source: Entity, state: PlaygroundState) {
        super(MOVE, 1);
        this.source = source;
        var increment_fn = (stack: Stack<GridLocation>): Array<GridLocation> => {
            var entities = state.entities;
            // @ts-ignore
            var space: VolumeSpace = state.space;
            var neighborhood = space.getNaturalNeighborhood(stack.value);
            var occupied = new Set(entities.map((u) => u.loc));
            var options = neighborhood
                .filter(l => !occupied.has(l))
                .filter(l => l.traversable);
            return options;
        };
        var termination_fn = (stack: Stack<GridLocation>): boolean => {
            return stack.depth >= 3; // + 1 because stack starts at root.
        };
        var acquirer = new SequentialInputAcquirer<GridLocation>(
            increment_fn,
            termination_fn,
        );
        this.acquirer = acquirer;
    }

    digest_fn(selection: Stack<GridLocation>): Array<Effect> {
        var locs_arr = selection.to_array();
        // TODO: don't include initial "current" loc as part of locs.
        locs_arr.shift();
        var effects: Array<Effect> = locs_arr.map((loc) => new PlaygroundMoveEffect(this.source, loc));
        return effects;
    }

    // TODO: Update
    // @ts-ignore
    get_root(inputs: PlaygroundInputs): Stack<ILocation> {
        // @ts-ignore: Entity type on input queue end depending on InputState
        var entity: Entity = inputs.peek();
        return new Stack(entity.loc);
    }
}