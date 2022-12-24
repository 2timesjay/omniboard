import { Stack, ISelectable } from "../../model/core";
import { Effect } from "../../model/effect";
import { Entity } from "../../model/entity";
import { IInputStep, IInputAcquirer, SimpleInputAcquirer, isInputSignal, InputStop, IInputNext, InputOptions, InputSelection, InputRequest } from "../../model/input";
import { AbstractBasePhase, BaseInputs } from "../../model/phase";
import { GridLocation } from "../../model/space";
import { IState } from "../../model/state";
import { BaseDisplayHandler } from "../../view/display_handler";
import { ToggleLocationEffect } from "./editor_effect";
import { EditorState } from "./editor_state";

const INPUT_OPTIONS_CLEAR: InputOptions<ISelectable> = [];

/**
 * Building Phase - pre-game creation of a level.
 */
export class ToggleLocationStep implements IInputStep<GridLocation, null> {
    acquirer: IInputAcquirer<GridLocation>;
    player: Player;
    occupied: Set<GridLocation>;
    entities: Array<Entity>;

    constructor(state: EditorState, auto_select: boolean = true) {
        // Restrict to unoccupied neighbors of source entity.
        this.acquirer = new SimpleInputAcquirer(
            () => state.space.to_array(), false, auto_select,
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

    consume_children(next_step: InputStop): Array<Effect> {
        return [new ToggleLocationEffect(this.input)];
    }
    
    get_next_step(state: EditorState): InputStop {
        return new InputStop();
    }
}
 export class EditorPhase extends AbstractBasePhase {
    constructor(state: EditorState) {
        super();
        // TODO: Do I need this? nullish until built in subphase, currently.
        this.current_inputs = new BaseInputs(this.base_step_factory);
        this.current_inputs.reset(state);
    }

    get base_step_factory(): (state: IState) => IInputNext<ISelectable> {
        return (state: EditorState) => new ToggleLocationStep(state);
    }
    
    async * run_phase(
        state: EditorState
    ): AsyncGenerator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        console.log("Running EditorPhase")
        // Make a single "move"
        var inputs: BaseInputs = yield *this.run_subphase(state); 
        var effects = this.digest_inputs();
        this.current_inputs.reset(state);  

        // TODO: Side effect that queue display doesn't clear before effect execution
        await state.process(effects, this.display_handler).then(() => {});
    }
}

/**
 * Repeatedly executes EditorPhase. Key point where we await InputRequest.
 * Also calls various display_handler refresh subroutines, and evaluates gameEnd.
 */
 export class EditorController {
    state: EditorState;

    constructor(state: EditorState) {
        this.state = state;
    }

    /**
     * input_bridge == controller. Calls phases in a loop and requests input
     * then feeds input to display_handler.
     */
    async run(
        phase: EditorPhase,
        input_request: InputRequest<ISelectable>,
        display_handler: BaseDisplayHandler,
    ) {
        // Player input
        display_handler.refresh();
        phase.set_display_handler(display_handler);
        display_handler.on_selection(null, phase);
        
        var phase_runner = phase.run_phase(this.state);

        while (true) {
            display_handler.refresh();
            phase_runner = phase.run_phase(this.state);
            // TODO: lol what a mess
            var input_options = await phase_runner.next();
            // TODO: So simple it was fine running only this internal subphase loop.
            while(input_options.value){
                var input_selection = await input_request(input_options.value);
                input_options = await phase_runner.next(input_selection);
                display_handler.on_selection(input_selection, phase);
            }
            if (this.victory_condition()) {
                console.log("Victory!")
                // NOTE: Don't forget, input_request also influences display state!
                input_request(INPUT_OPTIONS_CLEAR);
                display_handler.on_game_end();
                break;
            }
        }  
    }
    
    // TODO: This and defeat -> ternary enum?
    victory_condition(): boolean {
        return false;
    }
}