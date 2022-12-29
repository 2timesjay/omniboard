import { EffectKernel, AbstractEffect } from "../../model/effect";
import { Entity } from "../../common/entity";
import { GridLocation, Vector } from "../../model/space";
import { ChainableMove } from "../../view/animation";
import { DisplayHandler } from "../../view/display_handler";
import { BoxDisplay, PlayerDisplay } from "./climber_display";
import { Player, ClimberState, Box } from "./climber_state";


const STEP = new Audio('/assets/sound_effects/footstep.wav');
const SCRAPE = new Audio('/assets/sound_effects/wood_scrape.mp3');
// TODO: Move into setup?
const DURATION_MS = 300;



// TODO: No Kernel
export class ToggleLocationEffect extends AbstractEffect {
    loc: GridLocation;
    description: string;

    constructor(loc: GridLocation) {
        super();
        this.loc = loc;
        this.description = "Toggle terrain at a location.";
    }

    execute(state: ClimberState): ClimberState {
        state.space.toggle(this.loc);
        return state;
    }

    animate(state: ClimberState, display_handler: DisplayHandler) {   
    }

    play_sound() {
    }
}

// TODO: Refactor into a base MoveKernel - Excessively similar to SlidingPuzzleMoveKernel
class ClimberMoveKernel implements EffectKernel {
    source: Player;
    loc: GridLocation;

    _prev_loc: GridLocation;

    constructor(source: Player, loc: GridLocation) {
        this.source = source;
        this.loc = loc;
    }

    execute(state: ClimberState): ClimberState {
        console.log("Executing Move: ", this.loc);
        this._prev_loc = this.source.loc;
        this.source.setLoc(this.loc);
        return state;
    };

    // TODO: Not needed. Reversability and separate kernel and animations should be componentized.
    reverse(state: ClimberState): ClimberState {
        // @ts-ignore
        this.source.setLoc(this._prev_loc);
        return state;
    }
}

// TODO: Factor this and other Moves into BaseMoveEffect
export class ClimberMoveEffect extends AbstractEffect {
    source: Player;
    loc: GridLocation;

    kernel: ClimberMoveKernel;
    description: string;

    constructor(source: Player, loc: GridLocation) {
        super();
        this.source = source;
        this.loc = loc;
        this.kernel = new ClimberMoveKernel(source, loc);
        this.description = "Move Player to new Location";
    }

    execute(state: ClimberState): ClimberState {
        return this.kernel.execute(state);
    }

    animate(state: ClimberState, display_handler: DisplayHandler) {   
        var source = this.source;
        var loc = this.loc;
        var vector: Vector = state.space.getVector(source.loc, loc);
        console.log("Vector: ", vector)
        // TODO: Avoid coercion or do it differently?
        var source_display = display_handler.display_map.get(source) as PlayerDisplay;
        var on_gen_finish = () => {
            source_display.update_pos();
            this.play_sound();
        }
        var animation = new ChainableMove(vector, DURATION_MS, on_gen_finish);
        // TODO: UpdatePos
        console.log("Interrupt")
        source_display.interrupt_chainable_animation(animation)
        // TODO: Play on animation completion
    }

    play_sound() {
        console.log("PLAYING SOUND");
        STEP.load();
        STEP.play();
    }
}

class BoxShoveKernel implements EffectKernel {
    source: Player;
    target: Box;

    _prev_loc: GridLocation;

    constructor(source: Player, target: Box) {
        this.source = source;
        this.target = target;
    }

    execute(state: ClimberState): ClimberState {
        var UP = {x: 0, y: 0, z: 1}
        var source = this.source;
        var target = this.target;
        this._prev_loc = target.loc;
        var vector: Vector = state.space.getVector(source.loc, target.loc);
        // TODO: Not implemented for space.
        var destination = state.space.getSimpleRelativeGridCoordinate(target.loc, vector);
        // TODO: Also check if occupied. Can overlap units now.
        if (destination != null && destination.traversable) {
            // TODO: Change traversability above the box
            var above_target = state.space.getSimpleRelativeGridCoordinate(target.loc, UP);
            var above_destination = state.space.getSimpleRelativeGridCoordinate(destination, UP);
            state.space.get(above_target).traversable = false;
            state.space.get(above_destination).traversable = true;
            target.setLoc(destination);
            console.log(this._prev_loc, destination);
        }
        // TODO: Else, damage somehow.
        return state;
    };

    reverse(state: ClimberState): ClimberState {
        this.target.setLoc(this._prev_loc);
        return state;
    }
}

// TODO: Factor this and other Moves into BaseMoveEffect
export class BoxShoveEffect extends AbstractEffect {
    source: Player;
    target: Box;

    kernel: BoxShoveKernel;
    description: string;

    constructor(source: Player, target: Box) {
        super();
        this.source = source;
        this.target = target
        this.kernel = new BoxShoveKernel(source, target);
        this.description = "Shove Box to new location";
    }

    execute(state: ClimberState): ClimberState {
        return this.kernel.execute(state);
    }

    animate(state: ClimberState, display_handler: DisplayHandler) {   
        var source = this.source;
        var source_display = display_handler.display_map.get(source) as PlayerDisplay;
        var target = this.target;
        var target_display = display_handler.display_map.get(target) as BoxDisplay;
        var vector: Vector = state.space.getVector(source.loc, target.loc);
        var on_gen_finish = () => {
            target_display.update_pos();
            this.play_sound();
        }
        var animation = new ChainableMove(vector, DURATION_MS, on_gen_finish);
        // TODO: UpdatePos
        console.log("Interrupt")
        target_display.interrupt_chainable_animation(animation)
        // TODO: Play on animation completion
        // source_display.update_pos();
        // var target_display = display_handler.display_map.get(source) as BoxDisplay;
        // target_display.update_pos();
        // var target_display = display_handler.display_map.get(target);
        // // @ts-ignore Doesn't know unit_display is a UnitDisplay
        // var animation = new Move(vector, DURATION_FRAMES, target_display);
        // // @ts-ignore Can't even use UnitDisplay as a normal type.
        // target_display.interrupt_animation(animation);
    }

    play_sound() {
        console.log("PLAYING SOUND");
        SCRAPE.load();
        SCRAPE.play();
    }
}