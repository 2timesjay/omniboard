import { ISelectable } from "../../model/core";
import { InputRequest, synthetic_input_getter, InputOptions, InputResponse, isInputStep } from "../../model/input";
import { BaseInputs } from "../../model/phase";
import { GridLocation } from "../../model/space";
import { GridLocationInputStep, PieceInputStep, SlidingPuzzlePhase } from "./sliding_puzzle_controller";
import { Piece, SlidingPuzzleState } from "./sliding_puzzle_state";

export class SlidingPuzzleShuffler {
    state: SlidingPuzzleState;
    piece_getter: InputRequest<Piece>;
    location_getter: InputRequest<GridLocation>;
    inputs: BaseInputs;

    constructor(state: SlidingPuzzleState) {
        this.state = state;
        // TODO: A mess - operate directly on tactics_input.
        this.piece_getter = synthetic_input_getter<Piece>(this._select_piece.bind(this));
        this.location_getter = synthetic_input_getter<GridLocation>(this._select_location.bind(this));
    }

    get_input(
        phase: SlidingPuzzlePhase, 
        input_options: InputOptions<ISelectable>, 
        inputs: BaseInputs,
    ): Promise<InputResponse<ISelectable>> {
        this.inputs = inputs;
        var input_step = this.inputs.peek(); 
        // TODO: Better to test "InputState" another way. Can we avoid doing it explicitly?
        if (input_step instanceof PieceInputStep){
            // @ts-ignore
            return this.piece_getter(input_options);
        }
        else if (input_step instanceof GridLocationInputStep){
            // @ts-ignore
            return this.location_getter(input_options);
        }
        else if (!isInputStep(inputs.peek())) {
            console.log("SHOULD NOT REACH");
        }
        return null;
    }

    _select_piece(arr: Array<Piece>): Piece {
        return arr[Math.floor(Math.random()*arr.length)];
    }

    _select_location(arr: Array<GridLocation>): GridLocation {
        return arr[Math.floor(Math.random()*arr.length)];
    }
}
