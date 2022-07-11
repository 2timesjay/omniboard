import { ISelectable } from "../model/core";
import { Effect } from "../model/effect";
import { Observer } from "../model/observer";
import { ISpace } from "../model/space";
import { DURATION_MS, DURATION_MS_NO_ANIM, IState } from "../model/state";
import { sleep } from "../model/utilities";
import { DisplayHandler } from "../view/display_handler";
import { Entity } from "../model/entity";

export class PlaygroundState implements IState {
    space: ISpace;
    entities: Array<Entity>;

    // Process shouldn't live on state since it requires display_handler too.
    async process(
        effects: Array<Effect>, display_handler: DisplayHandler
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