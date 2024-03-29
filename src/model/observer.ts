import { DigestFn } from "../examples/tactics/action";
import { ISelectable } from "./core";
import { DamageEffect, Effect } from "../examples/tactics/effect";
import { BoardState, IState } from "./state";
import { Status, StatusType } from "./status";
import { Unit } from "../examples/tactics/unit";

type TriggerCond = (state: IState, effect: Effect) => boolean;

// TODO: Make private implementer of Status
export interface Observer {
    trigger_condition: TriggerCond;
    digest_fn: DigestFn<ISelectable>;
    process: (state: IState, effect: Effect) => void;
    status: Status;
    enabled: boolean;
    enable: () => void;
    disable: () => void;
}

class AbstractObserver implements Observer {
    trigger_condition: TriggerCond;
    digest_fn: DigestFn<ISelectable>;
    status: Status;
    enabled: boolean;

    constructor(trigger_condition: TriggerCond, digest_fn: DigestFn<ISelectable>, status: Status) {
        this.trigger_condition = trigger_condition;
        this.digest_fn = digest_fn;
        this.status = status;
        this.enable();
    }   

    /**
     * 
     * @param effect Effect to edit with additional pre and post-effects.
     */
    // TODO: Separate pre_effect and post_effect processing
    process(state: IState, effect: Effect) {
        throw new Error('Method not implemented.');
    }

    disable() { // NOTE: Called from observer.disable()
        this.enabled = false;
        delete this.status;
    }

    enable() {
        this.enabled = true;
    }
}

export class CounterAttackObserver extends AbstractObserver{

    constructor(unit: Unit, status: Status) {
        // Trigger when damage cause by an adjacent unit (DamageEffect).
        // I guess you could counter yourself, or a teammate.
        var trigger_condition = function(state: BoardState, effect: Effect): boolean {
            if (effect instanceof DamageEffect) {
                var distance = state.grid.getDistance(unit.loc, effect.source.loc);
                return effect.target == unit && distance <= 1; 
            } else {
                return false;
            }
        }
        // Create damage effect to hit attacking unit.
        var digest_fn = function(counter_target: Unit) {
            return [new DamageEffect(unit, counter_target)];
        }
        super(trigger_condition, digest_fn, status);
    }   

    process(state: BoardState, effect: Effect) {
        if (this.trigger_condition(state, effect) && this.enabled) {
            console.log("Adding counter post effect to : ", effect);
            // @ts-ignore trigger_condition guarantees effect.source is a Unit.
            effect.post_execute.push(...this.digest_fn(effect.source));
            // TODO: Depend too much on this behavior right now.
            this.status.clear();
        }
    }
}