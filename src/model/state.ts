import { PlaygroundState } from "../playground/playground_state";
import { BaseDisplayHandler, DisplayHandler } from "../view/display_handler";
import { 
    Stack, 
    Tree, 
    ISelectable, 
    IncrementFn, 
    TerminationFn, 
    bfs,
    OptionFn
} from "./core";
import { Effect } from "../tactics/effect";
import { Entity } from "./entity";

import {
    Confirmation,
    IInputAcquirer,
    InputOptions,
    InputRequest, InputSelection, PreviewMap
} from "./input";
import { Observer } from "./observer";
import { GridSpace, ISpace } from "./space";
import { instanceOfStatusContainer } from "./status";
import { Unit } from "../tactics/unit";

import {Awaited, sleep} from "./utilities";

export const DURATION_MS = 600;
export const DURATION_MS_NO_ANIM = 10;

export interface IState {
    get_selectables: () => Array<ISelectable>;
    process?: (effects: Array<Effect>, display_handler: DisplayHandler) => Promise<IState>; 
};


// TODO: Extend other states from this.
export class BaseState implements IState {
    space: ISpace;
    entities: Array<Entity>;

    // Process shouldn't live on state since it requires display_handler too.
    async process(
        effects: Array<Effect>, display_handler: BaseDisplayHandler
    ): Promise<PlaygroundState> {
        var self = this;
        var execution_promise = sleep(0);
        while (effects.length > 0) {
            var effect = effects.shift();
            // Observers inject pre and post _execute effects
            var observers = this.get_observers();
            observers.forEach(o => o.process(self, effect));

            // Explore "effect tree".
            var has_pre_execute = (
                effect.pre_execute != null && effect.pre_execute.length > 0
            );
            var has_post_execute = (
                effect.pre_execute != null && effect.pre_execute.length > 0
            );
            if (has_pre_execute) { // Add original effects, pre_effects and return to start of loop
                effects.unshift(effect);
                effects.unshift(...effect.pre_execute);
                effect.pre_execute = [];
                continue;
            } else { // Add post_effects and finish loop. 
                if (has_post_execute) {
                    effects.unshift(...effect.post_execute);
                    effect.post_execute = [];
                }
            }
            console.log("Effect: ", effect);
            if (effect.animate != null){
                // TODO: Factor animate and play_sound into methods; use inheritance
                effect.animate(this, display_handler);
                effect.execute(self);
                // TODO: Consistent sleep milliseconds vs frames animation dur.
                // NOTE: Sleep Duration MUST exceed frames duration (#frames * 10) by safe margin.
                await sleep(DURATION_MS);
            } else {
                await sleep(DURATION_MS_NO_ANIM);
                effect.execute(self);
            }
            effects.unshift(...effect.post_execute);
        }
        console.log("Observers: ", self.get_observers())
        return this;
    };

    // TODO: Add actions or handle generically
    get_selectables(): Array<ISelectable> {
        var selectables = [];
        // TODO: selectable order = Draw order - shouldn't be case.
        selectables.push(...this.space.to_array());
        selectables.push(...this.entities);
        // TODO: Generalize adding "children" here and in display
        selectables.push(...this.entities.flatMap(e => e.actions));
        return selectables;
    }

    get_observers(): Array<Observer> {
        return [];
    }
};

export class BoardState extends BaseState {
    _cur_team: number;
    confirmation: Confirmation; // NOTE: Single Confirmation for all cases.

    get grid(): GridSpace {
        //@ts-ignore coerced
        return this.space;
    }

    set grid(grid: GridSpace) {
        this.space = grid;
    }

    get units(): Array<Unit> {
        //@ts-ignore coerced
        return this.entities
    }

    set units(units: Array<Unit>) {
        this.entities = units;
    }

    get cur_team(): number {
        return this._cur_team;
    }

    set cur_team(t: number) {
        this._cur_team = t
    }
    
    async process(
        effects: Array<Effect>, display_handler: DisplayHandler
    ): Promise<BoardState> {
        // @ts-ignore coerce
        return super.process(effects, display_handler);
    }

    // TODO: Add actions or handle generically
    get_selectables(): Array<ISelectable> {
        var selectables = new Array<ISelectable>();
        for (let grid_row of this.grid.locs) {
            for (let grid_loc of grid_row) {
                selectables.push(grid_loc);
            }
        }
        for (let unit of this.units) {
            selectables.push(unit);
            for (let action of unit.actions) {
                selectables.push(action);
            }
        }
        selectables.push(this.confirmation);
        return selectables;
    }

    get_observers(): Array<Observer> {
        var observers = new Array<Observer>();
        for (let selectable of this.get_selectables()) {
            // TODO: More explicit way of checking 'is StatusContainer'
            if (instanceOfStatusContainer(selectable)) {
                var contained_observers = (new Array(...selectable.statuses)).map(s => s.observer);
                observers.push(...contained_observers);
            }
        }
        return observers;
    }
};