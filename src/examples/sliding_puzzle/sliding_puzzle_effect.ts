import { EffectKernel, AbstractEffect } from "../../model/effect";
import { GridLocation, Vector } from "../../model/space";
import { ChainableMove } from "../../view/animation";
import { EntityDisplay } from "../../view/display";
import { DisplayHandler } from "../../view/display_handler";
import { PuzzlePieceDisplay } from "./sliding_puzzle_display";
import { Piece, SlidingPuzzleState } from "./sliding_puzzle_state";


const CLACK = new Audio('/assets/sound_effects/quick_clack.ogg');
// TODO: Move into setup?
const DURATION_MS = 300;

class SlidingPuzzleMoveKernel implements EffectKernel {
    source: Piece;
    loc: GridLocation;

    _prev_loc: GridLocation;

    constructor(source: Piece, loc: GridLocation) {
        this.source = source;
        this.loc = loc;
    }

    execute(state: SlidingPuzzleState): SlidingPuzzleState {
        console.log("Executing Move: ", this.loc);
        this._prev_loc = this.source.loc;
        this.source.setLoc(this.loc);
        return state;
    };

    // TODO: Not needed. Reversability and separate kernel and animations should be componentized.
    reverse(state: SlidingPuzzleState): SlidingPuzzleState {
        // @ts-ignore
        this.source.setLoc(this._prev_loc);
        return state;
    }
}

// TODO: Factor this and other Moves into BaseMoveEffect
export class SlidingPuzzleMoveEffect extends AbstractEffect {
    source: Piece;
    loc: GridLocation;

    kernel: SlidingPuzzleMoveKernel;
    description: string;

    constructor(source: Piece, loc: GridLocation) {
        super();
        this.source = source;
        this.loc = loc;
        this.kernel = new SlidingPuzzleMoveKernel(source, loc);
        this.description = "Move Piece to new Location";
    }

    execute(state: SlidingPuzzleState): SlidingPuzzleState {
        return this.kernel.execute(state);
    }

    animate(state: SlidingPuzzleState, display_handler: DisplayHandler) {   
        var source = this.source;
        var loc = this.loc;
        var vector: Vector = state.space.getVector(source.loc, loc);
        console.log("Vector: ", vector)
        // TODO: Avoid coercion or do it differently?
        var source_display = display_handler.display_map.get(source) as PuzzlePieceDisplay;
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
        CLACK.load();
        CLACK.play();
    }
}