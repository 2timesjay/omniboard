import { DisplayHandler } from "../view/display_handler";
import { 
    Stack, 
    Tree, 
    ISelectable, 
    IncrementFn, 
    TerminationFn, 
    bfs,
    OptionFn
} from "./core";
import { Effect } from "./effect";

import {
    Confirmation,
    IInputAcquirer,
    InputOptions,
    InputRequest, InputSelection, PreviewMap
} from "./input";
import { Observer } from "./observer";
import { GridSpace } from "./space";
import { instanceOfStatusContainer } from "./status";
import { Unit } from "./unit";

import {Awaited, sleep} from "./utilities";

export const DURATION_MS = 600;
export const DURATION_MS_NO_ANIM = 10;

export interface IState {
    get_selectables: () => Array<ISelectable>;
};

export class BoardState implements IState {
    grid: GridSpace;
    units: Array<Unit>;
    confirmation: Confirmation; // NOTE: Single Confirmation for all cases.

    // Proces shouldn't live on state since it requires display_handler too.
    async process(
        effects: Array<Effect>, display_handler: DisplayHandler
    ): Promise<BoardState> {
        var self = this;
        // TODO: Handle effect-tree and observers
        console.log("Observers: ", self.get_observers())
        var execution_promise = sleep(0);
        for (var effect of effects) {
            // if (false) {
            if (effect.animate != null){
                effect.animate(this, display_handler);
                effect.execute(self);
                // TODO: Consistent sleep milliseconds vs frames animation dur.
                // NOTE: Sleep Duration MUST exceed frames duration (#frames * 10) by safe margin.
                await sleep(DURATION_MS);
            } else {
                await sleep(DURATION_MS_NO_ANIM);
                effect.execute(self);
            }
        }
        return this;
    };

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