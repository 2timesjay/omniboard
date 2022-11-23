import { Stack, ISelectable } from "../../model/core";
import { Entity } from "../../model/entity";
import { IInputStep, IInputAcquirer, SimpleInputAcquirer, isInputSignal, InputStop, IInputNext, InputOptions, InputSelection } from "../../model/input";
import { AbstractBasePhase, BaseInputs } from "../../model/phase";
import { GridLocation } from "../../model/space";
import { IState } from "../../model/state";
import { ClimberState } from "./climber_state";



export class GridLocationInputStep implements IInputStep<GridLocation, null> {
    acquirer: IInputAcquirer<GridLocation>;

    constructor(state: ClimberState, auto_select: boolean = false) {
        // Restrict to unoccupied neighbors of source entity.
        var player = state.entities[0]; // TODO: Ensure this is correct.
        var occupied = new Set(state.entities.map(e => e.loc));
        var open_neighbor_locs = state.space
            .getGridNeighborhood(player.loc)
            .filter(loc => !occupied.has(loc));
        // TODO: Is this the right place for auto_select?
        this.acquirer = new SimpleInputAcquirer(
            () => open_neighbor_locs, false, auto_select,
        ); 
    }

    get input(): GridLocation {
        var input_response = this.acquirer.current_input;
        if (isInputSignal(input_response)) {
            return null;
        } else if (input_response instanceof Stack) { // TODO: shouldn't have to check this
            return input_response.value;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: InputStop): GridLocation {
        if (InputStop == null) {
            throw new Error("Must pass InputStop to verify Inputs are complete.");
        }
        var input_response = this.acquirer.current_input;
        if (isInputSignal(input_response)) {
            return null;
        } else if (input_response instanceof Stack) { // TODO: shouldn't have to check this
            return input_response.value;
        } else {
            return input_response;
        }
    }
    
    get_next_step(state: ClimberState): InputStop {
        return new InputStop();
    }
}

/**
 * Phase is simplified to allow exploration of input acquisition.
 */
 export class ClimberPhase extends AbstractBasePhase {
    constructor(state: ClimberState) {
        super();
        // TODO: Do I need this? nullish until built in subphase, currently.
        this.current_inputs = new BaseInputs(this.base_step_factory);
        this.current_inputs.reset(state);
    }

    get base_step_factory(): (state: IState) => IInputNext<ISelectable> {
        return (state: ClimberState) => new GridLocationInputStep(state);
    }
    
    async * run_phase(
        state: ClimberState
    ): AsyncGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        console.log("Running ClimberPhase")
        // Make a single "move"
        var inputs: BaseInputs = yield *this.run_subphase(state); 
        var effects = this.digest_inputs();
        this.current_inputs.reset(state);  

        // TODO: Side effect that queue display doesn't clear before effect execution
        await state.process(effects, this.display_handler).then(() => {});
    }
}
