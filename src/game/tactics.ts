import { ISelectable, Stack } from "../model/core";
import { InputOptions, InputRequest, InputSelection } from "../model/input";
import { IPhase } from "../model/phase";
import { GridLocation } from "../model/space";
import { BoardState, Effect, Action } from "../model/state";
import { Unit } from "../model/unit";


function is_available(selectable: ISelectable): boolean {
    return true;
}

// TODO: Clean up
export class TacticsPhase implements IPhase {
    constructor() {}

    * run_phase(state: BoardState, cur_team: number
    ): Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        var effects = yield *this.run_subphase(state, cur_team);
    }

    // Consumer sees this as
    // unit_options = run_phase.next()
    // Select Unit
    // action_options = run_phase.next(unit_sel)
    // Select Action
    // location_options = run_phase.next(unit_sel)
    // Select Location
    // run_phase.next(location_sel);
    * run_subphase (
        state: BoardState, 
        cur_team: number, 
    ): Generator<InputOptions<ISelectable>, Array<Effect<BoardState>>, InputSelection<ISelectable>> { // InputRequest generator
        var unit_options = state.units.filter((u) => u.team == cur_team).filter(is_available);
        // @ts-ignore
        var unit_sel: Stack<Unit> = yield unit_options;
        var unit = unit_sel.value; // TODO: Clunky with null root?
        var action_options = unit.actions.filter(is_available);
        // @ts-ignore
        // var action_sel: Stack<Action<GridLocation>> = yield action_options;
        // var action = action_sel.value;
        var action_sel = action_options[0];
        var action = action_sel;
        var location_root = new Stack(unit.loc);
        // input_option_generator requires Stack, not just any InputSelection
        // @ts-ignore
        var effects = yield *action.input_option_generator(location_root);
        return effects;
    }
}


// --- Tactics ---

// TODO: I have typed too many damn things.
type TacticsSelectable = Unit | GridLocation | Action<TacticsSelectable>

export async function tactics_input_bridge(phase: TacticsPhase, state: BoardState, input_requests: Array<InputRequest<TacticsSelectable>>) {
    var [unit_request, action_request, location_request] = input_requests;
    var phase_runner = phase.run_phase(state, 0);
    var input_options = phase_runner.next().value;
    while(input_options){
        // @ts-ignore input_options potentially overbroad (ISelectable) here?
        var input_selection = await tactics_input_wrangler(input_options, unit_request, action_request, location_request);
        input_options = phase_runner.next(input_selection).value;
    }
}

function isInputOptionsUnit(o: any): o is InputOptions<Unit> {
    return (!!o.value && o.value instanceof Unit) || o instanceof Unit
} 
// TODO: Have to take "TacticsSelectable" on faith - should this be part of Action?
function isInputOptionsAction(o: any): o is InputOptions<Action<TacticsSelectable>> {
    return (!!o.value && o.value instanceof Action) || o instanceof Action
} 
function isInputOptionsGridLocation(o: any): o is InputOptions<GridLocation> {
    return (!!o.value && o.value instanceof GridLocation) || o instanceof GridLocation
} 

export async function tactics_input_wrangler(
    input_options: InputOptions<TacticsSelectable>, 
    unit_request: InputRequest<Unit>,
    action_request: InputRequest<Action<TacticsSelectable>>,
    location_request: InputRequest<GridLocation>,
) {
    if (isInputOptionsUnit(input_options)) {
        return unit_request(input_options);
    } else if (isInputOptionsAction(input_options)) {
        return action_request(input_options);
    } else if (isInputOptionsGridLocation(input_options)) {
        return location_request(input_options);
    }
}