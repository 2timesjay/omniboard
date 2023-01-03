import { Glement, Entity } from "../../common/entity";
import { ISelectable } from "../../model/core";
import { GridCoordinate, GridLocation } from "../../model/space";
import { _EntityDisplay, _EntityDisplay3D, AbstractDisplay, EntityDisplay3D, GridLocationDisplay3D, ILocatable, IPathable, LinearVisual3D } from "../../view/display";
import { ActiveRegion, SmartDisplayHandler } from "../../view/display_handler";
import { IView3D, View3D } from "../../view/rendering_three";

export class EditorDisplayHandler extends SmartDisplayHandler {
    view: View3D;
    init_active_region(): void {
        this.active_region = {z: 0};
    }
}

function space_builder(loc: GridLocation): AbstractDisplay<GridLocation> {
    return new GridLocationDisplay3D(loc);
}

function glement_builder(glement: Glement): AbstractDisplay<ISelectable> {
    switch (glement.indicator) { // TODO: Should I use type guard pattern?
        case "Entity":
            return new EntityDisplay3D(glement as Entity);
        default:
            throw new Error("Invalid glement type");
    }
}

export function display_builder(glement: ISelectable): AbstractDisplay<ISelectable> {
    if (glement instanceof GridLocation) {
        return new EditableLocationDisplay3D(glement);
    }
    else if (glement instanceof Entity) {
        return new EntityDisplay3D(glement);
    }
    else {
        throw new Error("Invalid selectable type");
    }
}

export class EditableLocationDisplay3D extends AbstractDisplay<GridLocation> implements ILocatable, IPathable {
    selectable: GridLocation;
    _xOffset: number;
    _yOffset: number;
    _zOffset: number;
    _size: number;
    width: number;
    height: number;

    constructor(loc: GridLocation) {
        super(loc);
        this._zOffset = this.selectable.z != null ? this.selectable.z: 0;
        this._xOffset = this.selectable.x + 0.1;
        this._yOffset = this.selectable.y + 0.1;
        this._size = 1.0;
        this.width = this.size*1.0;
        this.height = this.size*0.2;
    }

    updateActive(active_region?: ActiveRegion): boolean {
        if (active_region == null) {
            this.active = true;
        } else {
            var z_match = active_region.z;
            if (z_match == null) {
                this.active = true;
            } else {
                // TODO: Handle case where this is not an ILocatable
                this.active = (
                    // @ts-ignore
                    this.selectable.loc != null ? 
                    // @ts-ignore
                    this.selectable.loc.z == z_match :
                    // @ts-ignore
                    this.selectable.co.z == z_match
                ) 
            }
        }
        return this.active;
    }

    get xOffset(): number {
        return this._xOffset;
    }

    get yOffset(): number {
        return this._yOffset;
    }

    get zOffset(): number {
        return this._zOffset;
    }

    get co(): GridCoordinate {
        return {x: this.xOffset, y: this.yOffset, z: this.zOffset};
    }

    get size(): number {
        return this._size;
    }

    get traversable(): boolean {
        return this.selectable.traversable;
    }

    render(view: IView3D, clr: string, lfa?: number): THREE.Object3D {
        // TODO: Make this more consistent with 2D
        // NOTE: Don't render if lfa = 0; rendering bug when inside transparent object.
        if (lfa == 0) return;
        var adj_lfa = lfa;
        if (this.traversable && this.active) {
            var adj_lfa = lfa;
        } else if (this.traversable && !this.active) {
            var adj_lfa = 0.8 * lfa;
        } else if (!this.traversable && this.active) {
            var adj_lfa = 0.2 * lfa;
        } else {
            var adj_lfa = 0;
        }
        var co = {x: this.xOffset, y: this.yOffset};
        return view.drawRect(
            {x: this.xOffset, y: this.yOffset, z: this.zOffset}, 
            this.size, this.size, // TODO: Convert to Coord/ThreeVector
            clr, 
            adj_lfa,
        );
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        // TODO: Fix arbitrary "hover"
        return view.drawCircle(
            {x: this.xOffset, y: this.yOffset, z: this.zOffset + this.size*7/8},
            this.size,
            clr,
        );
    }

    neutralDisplay(view: IView3D): THREE.Object3D {
        var lfa = this.selectable.traversable ? 1.0 : 0.0
        return this.render(view, 'lightgrey', lfa);
    }

    optionDisplay(view: IView3D): THREE.Object3D {
        return this.render(view, 'grey', 1);
    }

    previewDisplay(view: IView3D): THREE.Object3D {
        return this.render(view, 'yellow', 1);
    }

    queueDisplay(view: IView3D): THREE.Object3D {
        return this.alt_render(view, 'indianred');
    }

    selectDisplay(view: IView3D): THREE.Object3D {
        return this.render(view, 'red');
    }

    // @ts-ignore
    pathDisplay(view: IView3D, to: IPathable) {
        var from = this;
        var line = new LinearVisual3D(from, to);
        line.display(view);
    }
}