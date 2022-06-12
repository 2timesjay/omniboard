import { DigestFn } from "./action";
import { ISelectable } from "./core";
import { DamageEffect, Effect } from "./effect";
import { BoardState, IState } from "./state";
import { StatusType } from "./status";
import { Unit } from "./unit";

type TriggerCond = (state: IState, effect: Effect) => boolean;

class AbstractObserver {
    trigger_condition: TriggerCond;
    digest_fn: DigestFn<ISelectable>;

    constructor(trigger_condition: TriggerCond, digest_fn: DigestFn<ISelectable>) {
        this.trigger_condition = trigger_condition;
        this.digest_fn = digest_fn;
    }   

    /**
     * 
     * @param effect Effect to edit with additional pre and post-effects.
     */
    process(state: IState, effect: Effect) {
        throw new Error('Method not implemented.');
    }
}

export class CounterAttackObserver extends AbstractObserver{

    constructor(unit: Unit) {
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
        super(trigger_condition, digest_fn);
    }   

    process(state: BoardState, effect: Effect) {
        if (this.trigger_condition(state, effect)) {
            // @ts-ignore trigger_condition guarantees effect.source is a Unit.
            this.post_execute.push(this.digest_fn(effect.source));
        }
    }
}