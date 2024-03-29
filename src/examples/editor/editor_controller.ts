import { Stack, ISelectable } from "../../model/core";
import { Effect } from "../../model/effect";
import { Entity, EntityFactory } from "../../common/entity";
import { IInputStep, IInputAcquirer, SimpleInputAcquirer, isInputSignal, InputStop, IInputNext, InputOptions, InputRequest, InputResponse, InputSignal, DragInputAcquirer } from "../../model/input";
import { AbstractBasePhase, BaseInputs } from "../../model/phase";
import { GridLocation } from "../../model/space";
import { IState } from "../../model/state";
import { BaseDisplayHandler } from "../../view/display_handler";
import { EntityDeleteEffect, EntityPlaceEffect, ToggleLocationEffect } from "./editor_effect";
import { EditorState } from "./editor_state";
import { VolumeSpace } from "../../common/space";

const INPUT_OPTIONS_CLEAR: InputOptions<ISelectable> = [];

type MultiInput = GridLocation | EntityFactory | Entity;

// TODO: Create UnionStep, which can take any two steps with disjoint inputs.
export class MultiStep implements IInputStep<MultiInput, MultiInput> {
    acquirer: IInputAcquirer<MultiInput>;

    constructor(state: EditorState, auto_select: boolean = true) {
        // @ts-ignore get_extras is too broadly typed.
        this.acquirer = new SimpleInputAcquirer(
            () => state.get_extras().concat(state.space.to_array()).concat(state.get_entities()), 
            false, 
            auto_select,
        ); 
    }

    get input(): InputResponse<MultiInput> {
        var input_response = this.acquirer.current_input;
        if (input_response.signal == InputSignal.Reject) {
            return null;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: IInputStep<MultiStep, null>): Array<Effect> {
        // @ts-ignore Get InputSelection, require singleton.
        return next_step.effects;
    }
    
    get_next_step(state: EditorState): IInputStep<MultiInput, null> {
        var selection = this.input.selection;
        var signal = this.input.signal;
        if (signal == InputSignal.DragStart && selection instanceof GridLocation) {
            console.log("MultiStep Drag Placeholder");
            return new ToggleLocationAreaStep(state, true, selection); // "Accelerates" through step.
        } else if (selection instanceof GridLocation) {
            return new ToggleLocationStep(state, true, selection); // "Accelerates" through step.
        } else if (selection instanceof EntityFactory) {
            return new PaletteSelectionStep(state, true, selection); // "Accelerates" through step.
        } else if (selection instanceof Entity) {
            return new DeleteFromLocationStep(state, false, selection); // Await confirmation for deletion.
        }
    }
}

/**
 * Building Phase - pre-game creation of a level.
 */
 export class PaletteSelectionStep implements IInputStep<EntityFactory, GridLocation> {
    acquirer: IInputAcquirer<EntityFactory>;
    effects: Array<Effect>;

    constructor(state: EditorState, auto_select: boolean = true, pre_select: EntityFactory) {
        var options = pre_select ? [pre_select] : state.get_extras();
        // @ts-ignore get_extras is too broadly typed.
        this.acquirer = new SimpleInputAcquirer(
            () => options, false, auto_select,
        ); 
    }

    get input(): InputResponse<EntityFactory> {
        var input_response = this.acquirer.current_input;
        if (input_response.signal == InputSignal.Reject) {
            return null;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: IInputStep<GridLocation, null>): Array<Effect> {
        // @ts-ignore Get InputSelection, require singleton.
        this.effects = [new EntityPlaceEffect(this.input.selection, next_step.input.selection)];
        return this.effects;
    }
    
    get_next_step(state: EditorState): IInputStep<GridLocation, null> {
        return new AddToLocationStep(state);
    }
}

export class AddToLocationStep implements IInputStep<GridLocation, null> {
    acquirer: IInputAcquirer<GridLocation>;
    occupied: Set<GridLocation>;
    entities: Array<Entity>;

    constructor(state: EditorState, auto_select: boolean = true) {
        // TODO: Restrict to unoccupied
        this.acquirer = new SimpleInputAcquirer(
            () => state.space.to_array(), false, auto_select,
        ); 
    }

    get input(): InputResponse<GridLocation> {
        var input_response = this.acquirer.current_input;
        if (input_response.signal == InputSignal.Reject) {
            return null;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: InputStop): GridLocation {
        return this.input.selection;
    }
    
    get_next_step(state: EditorState): InputStop {
        return new InputStop();
    }
}

export class ToggleLocationStep implements IInputStep<GridLocation, null> {
    acquirer: IInputAcquirer<GridLocation>;
    occupied: Set<GridLocation>;
    entities: Array<Entity>;
    effects: Array<Effect>;

    constructor(state: EditorState, auto_select: boolean = true, pre_select: GridLocation) {
        // Restrict to unoccupied neighbors of source entity.
        var options = pre_select ? [pre_select] : state.space.to_array();
        this.acquirer = new SimpleInputAcquirer(
            () => options, false, auto_select,
        ); 
    }

    get input(): InputResponse<GridLocation> {
        var input_response = this.acquirer.current_input;
        if (input_response.signal == InputSignal.Reject) {
            return null;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: InputStop): Array<Effect> {
        this.effects = [new ToggleLocationEffect(this.input.selection)];
        return this.effects;
    }
    
    get_next_step(state: EditorState): InputStop {
        return new InputStop();
    }
}


export class ToggleLocationAreaStep implements IInputStep<GridLocation, null> {
    acquirer: DragInputAcquirer<GridLocation>;
    occupied: Set<GridLocation>;
    space: VolumeSpace;
    entities: Array<Entity>;
    effects: Array<Effect>;

    constructor(state: EditorState, auto_select: boolean = true, pre_select: GridLocation) {
        // Restrict to unoccupied neighbors of source entity.
        this.space = state.space;
        var options = pre_select ? [pre_select] : this.space.to_array();
        this.acquirer = new DragInputAcquirer(
            () => options, false, auto_select,
        ); 
    }

    get input(): InputResponse<GridLocation> {
        var input_response = this.acquirer.current_input;
        if (input_response.signal == InputSignal.Reject) {
            return null;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: InputStop): Array<Effect> {
        console.log("Drag input: ", this.acquirer);
        var start = this.acquirer.start.selection;
        var end = this.acquirer.end.selection;
        var x_min = Math.min(start.x, end.x);
        var x_max = Math.max(start.x, end.x);
        var y_min = Math.min(start.y, end.y);
        var y_max = Math.max(start.y, end.y);
        var z_min = Math.min(start.z, end.z);
        var z_max = Math.max(start.z, end.z);
        this.effects = [];
        for (var x = x_min; x <= x_max; x++) {
            for (var y = y_min; y <= y_max; y++) {
                for (var z = z_min; z <= z_max; z++) {
                    var loc = this.space.locs[x][y][z];
                    this.effects.push(new ToggleLocationEffect(loc));
                }
            }
        }
        return this.effects;
    }
    
    get_next_step(state: EditorState): InputStop {
        return new InputStop();
    }
}

export class DeleteFromLocationStep implements IInputStep<Entity, null> {
    acquirer: IInputAcquirer<Entity>;
    occupied: Set<GridLocation>;
    entities: Array<Entity>;
    effects: Array<Effect>;

    constructor(state: EditorState, auto_select: boolean = true, pre_select: Entity) {
        // Restrict to unoccupied neighbors of source entity.
        var options = pre_select ? [pre_select] : state.get_entities();
        this.acquirer = new SimpleInputAcquirer(
            () => options, false, auto_select,
        ); 
    }

    get input(): InputResponse<Entity> {
        var input_response = this.acquirer.current_input;
        if (input_response.signal == InputSignal.Reject) {
            return null;
        } else {
            return input_response;
        }
    }

    consume_children(next_step: InputStop): Array<Effect> {
        this.effects = [new EntityDeleteEffect(this.input.selection)];
        return this.effects;
    }
    
    get_next_step(state: EditorState): InputStop {
        return new InputStop();
    }
}

export class EditorPhase extends AbstractBasePhase {
    display_handlers: Array<BaseDisplayHandler>;

    constructor(state: EditorState) {
        super();
        // TODO: Do I need this? nullish until built in subphase, currently.
        this.current_inputs = new BaseInputs(this.base_step_factory);
        this.current_inputs.reset(state);
    }

    set_display_handlers(display_handlers: Array<BaseDisplayHandler>) {
        this.display_handlers = display_handlers;
    }

    get base_step_factory(): (state: IState) => IInputNext<ISelectable> {
        return (state: EditorState) => new MultiStep(state);
    }
    
    async *  run_phase(
        state: EditorState
    ): AsyncGenerator<InputOptions<ISelectable>, void, ISelectable> {
        console.log("Running EditorPhase")
        // Make a single "move"
        var inputs: BaseInputs = yield *this.run_subphase(state); 
        var effects = this.digest_inputs();
        this.current_inputs.reset(state);  

        // TODO: Side effect that queue display doesn't clear before effect execution
        for (var display_handler of this.display_handlers) {
            await state.process(effects, this.display_handler).then(() => {});
        }
    }
}

/**
 * Repeatedly executes EditorPhase. Key point where we await InputRequest.
 * Also calls various display_handler refresh subroutines, and evaluates gameEnd.
 */
 export class EditorController {  // TODO: Inherit from BaseController
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
        canvas_input_request: InputRequest<ISelectable>,
        canvas_display_handler: BaseDisplayHandler,
        palette_input_request: InputRequest<ISelectable>,
        palette_display_handler: BaseDisplayHandler,
    ) {
        // Player input
        canvas_display_handler.refresh();
        palette_display_handler.refresh();
        phase.set_display_handlers([canvas_display_handler, palette_display_handler]);
        canvas_display_handler.on_selection(null, phase);
        palette_display_handler.on_selection(null, phase);
        
        var phase_runner = phase.run_phase(this.state);

        while(true) {
            canvas_display_handler.refresh();
            palette_display_handler.refresh();
            phase_runner = phase.run_phase(this.state);
            // TODO: lol what a mess
            var input_options = await phase_runner.next();
            // TODO: So simple it was fine running only this internal subphase loop.
            while(input_options.value){
                var input_options_value = input_options.value;
                // @ts-ignore we know it's an array
                var canvas_input_selection = canvas_input_request(input_options_value);
                // TODO: Fix hard-coded palette options.
                var palette_input_selection = palette_input_request(input_options_value);
                var input_selection = await Promise.race([canvas_input_selection, palette_input_selection]);
                input_options = await phase_runner.next(input_selection);
                canvas_display_handler.on_selection(input_selection, phase);
                palette_display_handler.on_selection(input_selection, phase);
            }
            if (this.victory_condition()) {
                console.log("Victory!")
                // NOTE: Don't forget, input_request also influences display state!
                canvas_input_request(INPUT_OPTIONS_CLEAR);
                palette_input_request(INPUT_OPTIONS_CLEAR);
                canvas_display_handler.on_game_end();
                palette_display_handler.on_game_end();
                break;
            }
        }
    }
    
    // TODO: This and defeat -> ternary enum?
    victory_condition(): boolean {
        return false;
    }
}