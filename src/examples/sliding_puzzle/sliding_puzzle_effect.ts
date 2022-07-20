import { EffectKernel, AbstractEffect } from "../../model/effect";
import { GridLocation, Vector } from "../../model/space";
import { IState } from "../../model/state";
import { DURATION_FRAMES } from "../../model/unit";
import { EntityDisplay, Move } from "../../view/display";
import { DisplayHandler } from "../../view/display_handler";
import { Piece, SlidingPuzzleState } from "./sliding_puzzle_state";

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
        var source_display = display_handler.display_map.get(source) as EntityDisplay;
        var animation = new Move(vector, DURATION_FRAMES, source_display);
        source_display.interrupt_animation(animation)
    }
}