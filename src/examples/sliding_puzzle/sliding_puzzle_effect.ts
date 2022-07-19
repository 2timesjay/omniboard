import { EffectKernel, AbstractEffect } from "../../model/effect";
import { GridLocation } from "../../model/space";
import { IState } from "../../model/state";
import { DisplayHandler } from "../../view/display_handler";
import { Piece } from "./sliding_puzzle_state";

class SlidingPuzzleMoveKernel implements EffectKernel {
    source: Piece;
    loc: GridLocation;

    _prev_loc: GridLocation;

    constructor(source: Piece, loc: GridLocation) {
        this.source = source;
        this.loc = loc;
    }

    execute(state: IState): IState {
        console.log("Executing Move: ", this.loc);
        this._prev_loc = this.source.loc;
        this.source.setLoc(this.loc);
        return state;
    };

    // TODO: Not needed. Reversability and separate kernel and animations should be componentized.
    reverse(state: IState): IState {
        // @ts-ignore
        this.source.setLoc(this._prev_loc);
        return state;
    }
}

// TODO: Factor this and other Moves into BaseMoveEffect
export class SlidingPuzzleMoveEffect extends AbstractEffect {
    source: Piece;
    loc: GridLocation;

    kernel: EffectKernel;
    description: string;

    constructor(source: Piece, loc: GridLocation) {
        super();
        this.source = source;
        this.loc = loc;
        this.kernel = new SlidingPuzzleMoveKernel(source, loc);
        this.description = "Move Piece to new Location";
    }

    execute(state: IState): IState {
        return this.kernel.execute(state);
    }

    animate(state: IState, display_handler: DisplayHandler) {   
        var source = this.source;
        var loc = this.loc;
        // @ts-ignore
        var vector: Vector = state.space.getVector(source.loc, loc);
        console.log("Vector: ", vector)
        var source_display = display_handler.display_map.get(source);
        // @ts-ignore Doesn't know Piece_display is a PieceDisplay
        var animation = new Move(vector, DURATION_FRAMES, source_display);
        // @ts-ignore Can't even use PieceDisplay as a normal type.
        source_display.interrupt_animation(animation)
    }
}