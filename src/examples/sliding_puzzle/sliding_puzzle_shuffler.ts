import { BaseAutomation } from "../../model/automation";
import { ISelectable } from "../../model/core";
import { InputRequest, synthetic_input_getter, InputOptions, InputResponse, isInputStep } from "../../model/input";
import { BaseInputs } from "../../model/phase";
import { GridLocation } from "../../model/space";
import { GridLocationInputStep, PieceInputStep, SlidingPuzzlePhase } from "./sliding_puzzle_controller";
import { Piece, SlidingPuzzleState } from "./sliding_puzzle_state";

export class SlidingPuzzleShuffler extends BaseAutomation {
    state: SlidingPuzzleState;
    piece_getter: InputRequest<Piece>;
    location_getter: InputRequest<GridLocation>;
    inputs: BaseInputs;
    prev_piece: Piece;

    constructor(state: SlidingPuzzleState) {
        super(state);
        // TODO: A mess - operate directly on tactics_input.
        this.piece_getter = this._build_getter(this._select_piece);
        this.location_getter = this._build_getter(this._select_location);
        this.prev_piece = null;
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
        var self = this;
        arr = arr.filter(p => p != self.prev_piece);
        var random_piece = arr[Math.floor(Math.random()*arr.length)];
        this.prev_piece = random_piece;
        return random_piece;
    }

    _select_location(arr: Array<GridLocation>): GridLocation {
        return arr[Math.floor(Math.random()*arr.length)];
    }
}
