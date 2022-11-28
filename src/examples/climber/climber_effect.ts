import { EffectKernel, AbstractEffect } from "../../model/effect";
import { GridLocation, Vector } from "../../model/space";
import { ChainableMove } from "../../view/animation";
import { DisplayHandler } from "../../view/display_handler";
import { PlayerDisplay } from "./climber_display";
import { Player, ClimberState } from "./climber_state";


const STEP = new Audio('/assets/sound_effects/footstep.wav');
// TODO: Move into setup?
const DURATION_MS = 300;

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