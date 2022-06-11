import { DigestFn } from "./action";
import { ISelectable } from "./core";
import { Effect } from "./effect";

type TriggerCond = (e: Effect) => boolean;

class Observer {
    trigger_condition: TriggerCond;
    digest_fn: DigestFn<ISelectable>;

    constructor(trigger_condition: TriggerCond, digest_fn: DigestFn<ISelectable>) {
        this.trigger_condition = trigger_condition;
        this.digest_fn = digest_fn;
    }   
}