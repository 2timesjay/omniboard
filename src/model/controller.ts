import { BaseDisplayHandler } from "../view/display_handler";
import { ISelectable } from "./core";
import { InputRequest } from "./input";
import { AbstractBasePhase, Inputs, IPhase } from "./phase";
import { BaseState } from "./state";


/**
 * Repeatedly executes TacticsPhases. Key point where we await InputRequest.
 * Also calls various display_handler refresh subroutines, and evaluates gameEnd.
 */
export class BaseController {
    state: BaseState;

    constructor(state: BaseState) {
        this.state = state;
    }

    /**
     * input_bridge == controller. Calls phases in a loop and requests input
     * then feeds input to display_handler.
     */
    async run(
        phase: AbstractBasePhase, 
        input_request: InputRequest<ISelectable>,
        display_handler: BaseDisplayHandler,
    ) {
        display_handler.refresh();
        phase.set_display_handler(display_handler);
        display_handler.on_selection(null, phase);
        // Note: No Victory Conditions. Go forever.
        display_handler.refresh();
        while (true) {
            display_handler.refresh();
            var phase_runner = phase.run_phase(this.state);
            // TODO: lol what a mess
            var input_options = await phase_runner.next();
            while(input_options.value){
                var input_selection = await input_request(input_options.value);
                input_options = await phase_runner.next(input_selection);
                display_handler.on_selection(input_selection, phase);
            }
        }  
    }
}