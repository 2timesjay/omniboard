import { Loader } from "three";
import { Entity } from "../../model/entity";
import { GridCoordinate } from "../../model/space";
import { EntityDisplay, ILocatable, IPathable } from "../../view/display";
import { HitRect2D, IView2D, makeRect, View2D } from "../../view/rendering";
import { IView3D } from "../../view/rendering_three";



// TODO: rename drawModel, move to rendering_three.ts, or an extension
function drawPuzzlePiece(
    co: GridCoordinate, view: IView2D, width: number, height: number, clr?: string, lfa?: number
): HitRect2D {
    var rect = makeRect(co, view.context, width, height, clr, lfa);
    // @ts-ignore
    return rect;
}

export class PuzzlePieceDisplay extends EntityDisplay implements ILocatable, IPathable {

    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#slicing
    constructor(entity: Entity, ref_image, image_slice_x?: number, image_slice_y?: number) {
        super(entity);
        this._size = 0.9;
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
            this.size, this.size, // TODO: Fix 3d rect hack
            clr,
        );
    }

    alt_render(view: IView2D, clr: string): HitRect2D {
        this.render(view, clr);
    }
}