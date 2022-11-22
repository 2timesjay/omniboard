import { BaseDisplayHandler } from "../view/display_handler";
import { IState } from "./state";

export interface EffectKernel {
    execute: (state: IState) => IState;
    reverse: (state: IState) => IState;
}

export interface Effect {
    execute: (state: IState) => IState;
    pre_execute?: Array<Effect>;
    post_execute?: Array<Effect>;
    description?: string;
    animate?: (state: IState, display_handler: BaseDisplayHandler) => void;
};

export class AbstractEffect implements Effect{
    pre_execute: Array<Effect>;
    post_execute: Array<Effect>;
    
    constructor () {
        this.pre_execute = [];
        this.post_execute = [];
    }

    execute(state: IState): IState {
        throw new Error('Method not implemented.');
    }

}
