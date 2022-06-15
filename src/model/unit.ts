import { Action, AlterTerrainAction, ATTACK, AttackAction, CHAIN, ChainLightningAction, ChanneledAttackAction, CHANNELED_ATTACK, COUNTER, CounterReadyAction, END, EndTurnAction, MOVE, MoveAction, SHOVE, ShoveAction, TERRAIN } from "./action";
import { ISelectable, Stack } from "./core";
import { AutoInputAcquirer, Confirmation, SequentialInputAcquirer, SimpleInputAcquirer } from "./input";
import { GridLocation, GridSpace, Vector } from "./space";
import { BoardState, IState } from "./state";
import { Status, StatusContainer } from "./status";

export const DURATION_FRAMES = 25

// TODO: Move somewhere more appropriate
export const GLOBAL_CONFIRMATION = new  Confirmation(); 

export function CONSTRUCT_BASIC_ACTIONS(unit: Unit, state: BoardState){
    return construct_actions(unit, state, [MOVE, ATTACK, CHAIN, END])
} 

export function construct_actions(unit: Unit, state: BoardState, action_list: Array<string>){
    var actions = [];
    for (var i = 0; i < action_list.length; i++) {
        // TODO: Pass index to action construction
        var action_str = action_list[i];
        switch(action_str) {
            case MOVE:
                actions.push(new MoveAction(unit, state));
                break;
            case ATTACK:
                actions.push(new AttackAction(unit, state));
                break;
            case CHANNELED_ATTACK:
                actions.push(new ChanneledAttackAction(unit, state));
                break;
            case CHAIN:
                actions.push(new ChainLightningAction(unit, state));
                break;
            case END:
                actions.push(new EndTurnAction(GLOBAL_CONFIRMATION, unit, state));
                break;
            case COUNTER:
                actions.push(new CounterReadyAction(GLOBAL_CONFIRMATION, unit, state));
                break;
            case TERRAIN:
                actions.push(new AlterTerrainAction(unit, state));
                break;
            case SHOVE:
                actions.push(new ShoveAction(unit, state));
                break;
        }
    }
    return actions;
} 

export class Unit implements ISelectable, StatusContainer{
    team: number;
    loc: GridLocation;
    actions: Array<Action<ISelectable, BoardState>>;
    ap: number;
    max_ap: number;
    _hp: Array<number>;
    _max_hp: Array<number>;
    speed: number;
    strength: number;  // Amount of damage attacks deal.
    piercing_strength: number;  // Amount of damage that can spill through shields.
    attack_range: number;
    statuses: Set<Status>;

    constructor(team: number){
        this.team = team;
        
        this._max_hp = [1, 3];
        this._hp = [...this._max_hp];
        
        this.speed = 3;
        this.strength = 5;
        this.piercing_strength = 0;
        this.attack_range = 1;

        this.max_ap = 2;
        this.ap = 2;

        this.statuses = new Set();
    }

    get hp(): number {
        return this._hp[0];
    }

    get all_hp(): Array<number> {
        return this._hp;
    }
    
    // TODO: Do I always want just first max hp?
    get max_hp(): number {
        return this._max_hp[0];
    }
    
    get all_max_hp(): Array<number> {
        return this._max_hp;
    }

    damage(damage_amount: number){
        this.setHp(this._hp[0] - damage_amount)
    }

    setHp(hp: number) {
        this._hp[0] = Math.max(hp, 0);
        // Pop life bar
        if (this._hp[0] == 0 && this._hp.length > 1) {
            this._hp.shift();
            this._max_hp.shift();
        }
    }

    is_alive(): boolean {
        return this.hp > 0;
    }

    is_exhausted(): boolean {
        return this.ap <= 0;
    }

    exhaust_action(action: Action<ISelectable, BoardState>) {
        this.ap -=  1;
        action.enabled = false;
    }

    unexhaust_action(action: Action<ISelectable, BoardState>) {
        this.ap +=  1;
        action.enabled = true;
    }

    reset_actions() {
        this.ap = this.max_ap;
        this.actions.forEach((a) => a.enabled = true);
    }

    setLoc(loc: GridLocation){
        this.loc = loc; 
    }

    setActions(actions: Array<Action<ISelectable, BoardState>>) {
        this.actions = actions;
    }
}