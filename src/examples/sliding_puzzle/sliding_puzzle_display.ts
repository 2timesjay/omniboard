import { GridCoordinate } from "../../model/space";
import { EntityDisplay, ILocatable, IPathable } from "../../view/display";
import { HitRect2D, IView2D, makeRect, View2D } from "../../view/rendering";
import { Piece } from "./sliding_puzzle_state";



// TODO: rename drawImage, move to rendering.ts, or an extension
function drawPuzzlePiece(
    co: GridCoordinate, view: IView2D, image: CanvasImageSource, image_co: GridCoordinate, size: number, clr?: string,
): HitRect2D {
    // TODO: Generalize below assumptions
    // NOTE: assumes image_dim = 552, k = 3
    var slice_size = 552/3;
    var size_factor = 100; // TODO: inconsistent with other `size`\size_factor vars
    var draw_size = size*size_factor;
    const color = clr == undefined ? "#000000" : clr;
    const context = view.context;

    context.drawImage(
        image, 
        image_co.x*slice_size, image_co.y*slice_size, slice_size, slice_size, 
        co.x*size_factor, co.y*size_factor, draw_size, draw_size
    )
    context.strokeStyle = color;
    context.lineWidth = 4;
    context.strokeRect(
        co.x*size_factor, co.y*size_factor, draw_size, draw_size
    ); 
    context.strokeStyle = 'black';
    context.stroke();
    // @ts-ignore
    return new HitRect2D(co, {x: size, y: size});
}

export class PuzzlePieceDisplay extends EntityDisplay implements ILocatable, IPathable {
    // TODO: Store in Piece.
    original_co: GridCoordinate;
    ref_image: CanvasImageSource;

    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#slicing
    constructor(
        piece: Piece, 
        ref_image: CanvasImageSource,
    ) {
        super(piece);
        this._size = 0.9;
        // NOTE: Set now; won't change.
        this.original_co = {x: piece.original_loc.x, y: piece.original_loc.y}
        this.ref_image = ref_image
    }

    update_pos() {
        console.log("MOVING ENTITY: ", this.selectable)
        // @ts-ignore Actually GridLocation
        console.log("UPDATED LOC: ", this.selectable.loc.x, this.selectable.loc.y, this.selectable.loc.z);
        // @ts-ignore Actually GridLocation
        this._zOffset = this.selectable.loc.z != null ? this.selectable.loc.z: 0;
        // @ts-ignore Actually GridLocation
        this._xOffset = this.selectable.loc.x + 0.05;
        // @ts-ignore Actually GridLocation
        this._yOffset = this.selectable.loc.y + 0.05;
        this._size = 0.9;
        this.width = 0.9;
        this.height = 0.9; 
    }


    // TODO: Re-add alpha.
    render(view: IView2D, clr: string): HitRect2D {
        return drawPuzzlePiece(
            {x: this.xOffset, y: this.yOffset, z: this.zOffset}, 
            view,
            this.ref_image,
            this.original_co,
            this.size, // TODO: Fix 3d rect hack
            clr,
        );
    }

    alt_render(view: IView2D, clr: string): HitRect2D {
        return this.render(view, clr);
    }
}