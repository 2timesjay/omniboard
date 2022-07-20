import { Loader } from "three";
import { Entity } from "../../model/entity";
import { EntityDisplay, ILocatable, IPathable } from "../../view/display";
import { IView3D } from "../../view/rendering_three";

export class PuzzlePieceDisplay extends EntityDisplay implements ILocatable, IPathable {
    loader: Loader;

    constructor(entity: Entity) {
        super(entity);
        this.loader = new Loader();
    }

    // TODO: Re-add alpha.
    render(view: IView3D, clr: string): THREE.Object3D {
        return drawPuzzlePiece(this.co, view, this.loader, clr);
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        return drawPuzzlePiece(this.co, view, this.loader, clr);
    }
}