// TODO: Consistent style
import { ISelectable } from "../model/core";
import { IView, IView2D, RenderObject } from "./rendering";
import { GridCoordinate, GridLocation, ICoordinate, Vector } from "../model/space";
import { Entity } from "../common/entity";
import { IView3D } from "./rendering_three";
import { ActiveRegion } from "./display_handler";
import { View2DHudReadOnly } from "./hud_rendering";
import { Animate, BaseAnimationFn } from "./animation";
import {Vector3} from "../common/structures";

export enum DisplayState {
    Neutral,
    Option,
    Preview,
    Select,
    Queue,
}

const DEFAULT_DISPLAY_STATE_COLORS = new Map<DisplayState, string>([
    [DisplayState.Neutral, 'lightgrey'],
    [DisplayState.Option, 'grey'],
    [DisplayState.Preview, 'yellow'],
    [DisplayState.Queue, 'indianred'],
    [DisplayState.Select, 'red'],
]);

const k: number = 4; // TODO: un-hardcode.

// TODO: ILocatable -> ILocatable<ICoordinate>
// TODO: Add size, add center;
export interface ILocatable {
    _offset: Vector3;
    _size: number;
    children: Array<AbstractVisual>;
    get offset(): Vector3;
    get size(): number;
}

// TODO: Consider unifying ILocatable and IPathable
// TODO: Make 3D-safe
export interface IPathable extends ILocatable {
    pathDisplay: (view: IView<ICoordinate>, to: IPathable) => void;
}

export interface IMenuable {// Action<ISelectable>, Confirmation
    index: number;
    text: string;
}


/**
 * Visuals
 */
export class FixedLocatable implements ILocatable, ISelectable {
    // NOTE: A simple virtual location class to parent fixed-loc visuals.
    _offset: Vector3;
    _size: number;
    children: AbstractVisual[];

    constructor(co: GridCoordinate) {
        this._offset = new Vector3(co.x, co.y, co.z);
        this.children = [];
    }

    get offset(): Vector3 {
        return this._offset;
    }

    get size(): number {
        return 1;
    }
}
 
export class AbstractVisual {
    constructor() {
    }

    display(view: IView<ICoordinate>) {
    }
}

export class UnitaryVisual extends AbstractVisual{
    parent: ILocatable;

    constructor(parent: ILocatable) {
        super();
        this.add_parent(parent);
    }

    add_parent(parent: ILocatable) {
        this.parent = parent;
        parent.children.push(this);
    }

    display(view: IView<ICoordinate>) {
        this.render(view, null)
    }

    // TODO: Add to AbstractVisual Interface
    // TODO: Add `co` to ILocatable
    get offset(): Vector3 {
        return this.parent.offset;
    }

    render(view: IView<ICoordinate>, clr: string) {
        throw new Error('Method not implemented.');
    }
}

export class LinearVisual extends AbstractVisual {
    from: ILocatable;
    to: ILocatable;

    constructor(from: ILocatable, to: ILocatable) {
        super();
        this.from = from;
        this.to = to;    
    }

    display(view: IView<ICoordinate>) {
        this.render(view, 'indianred')
    }

    render(view: IView<ICoordinate>, clr: string) {
        var from = this.from;
        var to = this.to;
        var adj_from = from.size * 0.5;
        var adj_to = to.size * 0.5;
        var from_offset = from.offset.add(new Vector3(adj_from, adj_from)); 
        var to_offset = to.offset.add(new Vector3(adj_to, adj_to));
        view.drawLine(
            from_offset, to_offset,
            10, clr)
    }
}


export class LinearVisual3D extends AbstractVisual {
    from: ILocatable;
    to: ILocatable;

    constructor(from: ILocatable, to: ILocatable) {
        super();
        this.from = from;
        this.to = to;    
    }

    // @ts-ignore
    display(view: IView3D) {
        this.render(view, 'indianred')
    }

    render(view: IView3D, clr: string) {
        // TODO: Fix arbitrary z offset determined by Unit sizing
        var from = this.from;
        var to = this.to;
        var adj_from = from.size * 0.5;
        var adj_to = to.size * 0.5;
        var from_offset = from.offset.add(new Vector3(adj_from, adj_from, 0.7)); 
        var to_offset = to.offset.add(new Vector3(adj_to, adj_to, 0.7));
        view.drawLine(
            from_offset, to_offset,
            10, clr)
    }
}

export class VictoryBannerVisual extends UnitaryVisual {
    constructor(parent: ILocatable) {
        super(parent);
        this.add_parent(parent);
    }

    add_parent(parent: ILocatable) {
        this.parent = parent;
        parent.children.push(this);
    }

    display(view: IView2D) {
        this.render(view, null)
    }

    render(view: IView2D, clr: string) {
        // NOTE: Font size multiplied by 100;
        // TODO: drawGUI
        view.drawRect(this.offset, 2.2, -0.5, 'white')
        view.drawText(
            {x: this.offset.x + 0.1, y: this.offset.y - 0.05, z: this.offset.z}, 
            "VICTORY!", 
            0.5, 
            'green'
        );
    }
}

/**
 * Displays
 */
export class AbstractDisplay<T extends ISelectable> {
    selectable: T;
    // TODO: Clean up this crazy state/selection_state
    state: DisplayState;
    selection_state: DisplayState
    children: Array<AbstractVisual>;
    active: boolean;
    display_state_colors: Map<DisplayState, string>;

    constructor(selectable: T) {
        this.display_state_colors = DEFAULT_DISPLAY_STATE_COLORS;
        this.selectable = selectable;
        this.state = DisplayState.Neutral;
        this.selection_state = DisplayState.Neutral;
        this.children = [];
        this.active = true;
    }

    update_pos() {
        throw new Error('Method not implemented.');
    }

    updateActive(active_region?: ActiveRegion): boolean {
        return true;
    }

    // TODO: Fix up inheritance type errors
    // TODO: replace z_match with more general "active region", here or in display_handler.
    display(view: IView<ICoordinate>, active_region?: ActiveRegion): RenderObject {
        // TODO: does this need to move?
        this.updateActive(active_region);

        // TODO: Safe update if animation fails. Offset Also a delegated gen, not just delta?
        if (this.state == DisplayState.Select) {
            var render_object = this.selectDisplay(view);
        } else if (this.state == DisplayState.Preview) {
            var render_object = this.previewDisplay(view);
        } else if (this.state == DisplayState.Option) {
            var render_object = this.optionDisplay(view);
        } else {
            var render_object = this.neutralDisplay(view);
        }

        if (this.selection_state == DisplayState.Queue) {
            this.queueDisplay(view); // Don't use render_object.
        }
        for (var visual of this.children) {
            visual.display(view);
        }

        return render_object;
    }

    render(view: IView<ICoordinate>, clr: string, lfa?: number): RenderObject {
        return null;
    }

    alt_render(view: IView<ICoordinate>, clr: string, lfa?: number): RenderObject {
        return null;
    }

    neutralDisplay(view: IView<ICoordinate>): RenderObject {
        return this.render(view, this.display_state_colors.get(DisplayState.Neutral));
    }

    optionDisplay(view: IView<ICoordinate>): RenderObject {
        return this.render(view, this.display_state_colors.get(DisplayState.Option));
    }

    previewDisplay(view: IView<ICoordinate>): RenderObject {
        return this.render(view, this.display_state_colors.get(DisplayState.Preview));
    }

    queueDisplay(view: IView<ICoordinate>): RenderObject {
        return this.alt_render(view, this.display_state_colors.get(DisplayState.Queue));
    }

    selectDisplay(view: IView<ICoordinate>): RenderObject {
        return this.render(view, this.display_state_colors.get(DisplayState.Select));
    }

    // TODO: Input Mixin?
    isHit(hit_selectable: ISelectable): boolean {
        return this.selectable == hit_selectable;
    }

    onClick(hit_selectable: T | null): T | null {
        // TODO: Clean up this and `SelectionBroker` fanout
        if (this.isHit(hit_selectable)) {
            // self.state = DisplayState.Select;
            return this.selectable;
        } else {
            this.state = DisplayState.Neutral;
            return null;
        }
    }

    onMousemove(hit_selectable: T | null): T | null {
        if (this.state != DisplayState.Select) {
            if (this.isHit(hit_selectable)) {
                this.state = DisplayState.Preview;
                return this.selectable;
            } else {
                this.state = DisplayState.Option;
                return null;
            }
        }
    }

}


export class GridLocationDisplay extends AbstractDisplay<GridLocation> implements ILocatable, IPathable {
    selectable: GridLocation;
    _offset: Vector3;
    _size: number;
    width: number;
    height: number;

    constructor(loc: GridLocation) {
        super(loc);
        var z_offset = this.selectable.z != null ? this.selectable.z: 0;
        var x_offset = this.selectable.x + 0.1;
        var y_offset = this.selectable.y + 0.1;
        this._offset = new Vector3(x_offset, y_offset, z_offset);
        this._size = 0.8;
        this.width = 0.8;
        this.height = 0.8;
    }

    get offset(): Vector3 {
        return this._offset;
    }

    get size(): number {
        return this._size;
    }

    render(view: IView<ICoordinate>, clr: string, lfa?: number) {
        return view.drawRect(this.offset, this.size, this.size, clr, lfa);
    }

    alt_render(view: IView<ICoordinate>, clr: string) {
        return view.drawCircle(this.offset, this.size, clr);
    }

    neutralDisplay(view: IView<ICoordinate>): RenderObject {
        var lfa = this.selectable.traversable ? 1.0 : 0.25
        return this.render(view, 'lightgrey', lfa);
    }

    pathDisplay(view: IView<ICoordinate>, to: IPathable) {
        var from = this;
        var line = new LinearVisual(from, to);
        line.display(view);
    }
}

export class GridLocationDisplay3D extends AbstractDisplay<GridLocation> implements ILocatable, IPathable {
    selectable: GridLocation;
    _offset: Vector3;
    _size: number;
    width: number;
    height: number;

    constructor(loc: GridLocation) {
        super(loc);
        var z_offset = this.selectable.z != null ? this.selectable.z: 0;
        var x_offset = this.selectable.x + 0.1;
        var y_offset = this.selectable.y + 0.1;
        this._offset = new Vector3(x_offset, y_offset, z_offset);
        this._size = 0.8;
        this.width = 0.8;
        this.height = 0.8;
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

    get offset(): Vector3 {
        return this._offset;
    }

    get size(): number {
        return this._size;
    }

    render(view: IView3D, clr: string, lfa?: number): THREE.Object3D {
        // TODO: Make this more consistent with 2D
        // NOTE: Don't render if lfa = 0; rendering bug when inside transparent object.
        if (lfa == 0) return;
        var adj_lfa = this.active ? lfa: 0.2 * lfa
        return view.drawRect(
            this.offset, 
            this.size, this.size, // TODO: Convert to Coord/ThreeVector
            clr, 
            adj_lfa,
        );
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        // TODO: Fix arbitrary "hover"
        var altered_offset = this.offset.add(new Vector3(0, 0, this.size*7/8))
        return view.drawCircle(
            altered_offset,
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

// Share code with _UnitDisplay
export class _EntityDisplay extends AbstractDisplay<Entity> implements ILocatable, IPathable {
    selectable: Entity;
    _offset: Vector3;
    _size: number;
    width: number;
    height: number;

    constructor(entity: Entity) {
        super(entity);
        this.update_pos();
    }

    get offset(): Vector3 {
        return this._offset;
    }

    get size(): number {
        return this._size;
    }

    // TODO: Offsets should be handled in getter methods.
    update_pos() {
        console.log("MOVING ENTITY: ", this.selectable)
        // @ts-ignore Actually GridLocation
        console.log("UPDATED LOC: ", this.selectable.loc.x, this.selectable.loc.y, this.selectable.loc.z);
        // @ts-ignore Actually GridLocation
        this._zOffset = this.selectable.loc.z != null ? this.selectable.loc.z: 0;
        // @ts-ignore Actually GridLocation
        this._xOffset = this.selectable.loc.x + 0.2;
        // @ts-ignore Actually GridLocation
        this._yOffset = this.selectable.loc.y + 0.2;
        this._size = 0.6;
        this.width = 0.6;
        this.height = 0.6;
    }

    render(view: IView<ICoordinate>, clr: string): RenderObject {
        return view.drawRect(this.offset, this.size, this.size, clr);
    }

    alt_render(view: IView<ICoordinate>, clr: string): RenderObject {
        var altered_offset = this.offset.add(new Vector3(0.2*this.size, 0.2*this.size, 0));
        return view.drawRect(altered_offset, this.size*.6, this.size*.6, clr);
    }

    neutralDisplay(view: IView<ICoordinate>): RenderObject {
        return this.render(view, 'orange');
    }

    pathDisplay(view: IView<ICoordinate>, to: IPathable) {
        var from = this;
        var line = new LinearVisual(from, to);
        line.display(view);
    }
}

// TODO: WORKED: Miscellaneous problems. See https://www.typescriptlang.org/docs/handbook/mixins.html. Extend class?
export class EntityDisplay extends Animate(
    _EntityDisplay, 
    BaseAnimationFn,
) {};


export class _EntityDisplay3D extends AbstractDisplay<Entity> implements ILocatable, IPathable {
    selectable: Entity;
    _offset: Vector3;
    _size: number;
    width: number;
    height: number;
    additional_offsets: Vector;

    constructor(entity: Entity, additional_offsets?: Vector) {
        super(entity);
        this.additional_offsets = additional_offsets ? additional_offsets: {x: 0, y: 0, z: 0};
        this.update_pos();
    }

    get offset(): Vector3 {
        return this._offset.add(
            new Vector3(
                this.additional_offsets.x, 
                this.additional_offsets.y, 
                this.additional_offsets.z
            )
        );
    }

    get size(): number {
        return this._size;
    }

    update_pos() {
        console.log("MOVING ENTITY: ", this.selectable)
        // @ts-ignore Actually GridLocation
        console.log("UPDATED LOC: ", this.selectable.loc.x, this.selectable.loc.y, this.selectable.loc.z);
        
        // TODO: Fix to 0.2 * size after I fix offsets for gridLocations
        var margin = 0.1;
        // @ts-ignore Actually GridLocation
        var x_offset = this.selectable.loc.x + margin;
        // @ts-ignore Actually GridLocation
        var y_offset = this.selectable.loc.y + margin;
        var z_offset = (
            // @ts-ignore Actually GridLocation
            this.selectable.loc.z != null ? 
            // @ts-ignore Actually GridLocation
            (this.selectable.loc.z) + 0.6 + margin: 
            margin
        );
        this._offset = new Vector3(x_offset, y_offset, z_offset);
        this._size = 0.6;
        this.width = 0.6;
        this.height = 0.6;
    }

    updateActive(active_region?: ActiveRegion): boolean {
        // TODO: Put "always-active" type behavior into mixin or superclass
        this.active = true;
        return this.active;
    }

    // TODO: Re-add alpha.
    render(view: IView3D, clr: string): THREE.Object3D {
        var lfa = 1.0;
        var adj_lfa = this.active ? lfa: 0.2 * lfa
        return view.drawRect(
            this.offset,
            this.size, this.size, // TODO: Fix 3d rect hack
            clr, adj_lfa,
        );
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        var altered_offset = this.offset.addScalar(0.2 * this.size);
        var reduced_size = 0.6 * this.size;
        return view.drawRect(
            altered_offset,
            reduced_size, reduced_size, // TODO: Fix 3d rect hack
            clr,
        );
    }

    neutralDisplay(view: IView3D): THREE.Object3D {
        return this.render(view, 'orange');
    }

    pathDisplay(view: IView3D, to: IPathable) {
        var from = this;
        var line = new LinearVisual3D(from, to);
        line.display(view);
    }
}

export class EntityDisplay3D extends Animate(
    _EntityDisplay3D, 
    BaseAnimationFn,
) {};

export class MenuElementDisplay extends AbstractDisplay<IMenuable> {
    selectable: IMenuable;
    parent: ILocatable;
    size: number;
    width: number;
    height: number;
    
    constructor(selectable: IMenuable, parent: ILocatable) {
        super(selectable);
        this.parent = parent;
        this.size = 0.4;
        this.width = this.selectable.text.length * 0.5 * this.size + 0.2 * this.size,
        this.height = this.size;
    }

    get offset(): Vector3 {
        return this.parent.offset.add(new Vector3(0,  this.size * this.selectable.index, 0));
    }

    render(view: IView<ICoordinate>, clr: string, lfa?: number): RenderObject {
        var hit_co = this.offset;
        // TODO: Calculate all this in "view.drawText"
        var text_co = this.offset.add(new Vector3(0, this.height, 0));
        var text_size = 0.8 * this.size;
        var render_object = view.drawRect(
            hit_co, this.width, this.height, "white", 0.5
        );
        view.drawText(text_co, this.selectable.text, text_size, clr)
        return render_object;
    }

    // Do not render neutral DisplayState IMenuables
    neutralDisplay(view: IView<ICoordinate>): RenderObject {
        return null;
    }
}

// TODO: Merge with 2D version
export class MenuElementDisplay3D extends AbstractDisplay<IMenuable> {
    selectable: IMenuable;
    parent: ILocatable;
    size: number;
    width: number;
    height: number;
    
    constructor(selectable: IMenuable, parent: ILocatable) {
        super(selectable);
        this.parent = parent;
        this.size = 0.4;
        this.width = this.selectable.text.length * 0.5 * this.size + 0.2 * this.size,
        this.height = this.size;
    }

    get offset(): Vector3 {
        return this.parent.offset.add(
            new Vector3(0, 0,  this.size * this.selectable.index)
        );
    }

    render(view: IView3D, clr: string, lfa?: number): RenderObject {
        var hit_co = this.offset;
        // TODO: Calculate all this in "view.drawText"
        var text_co = this.offset;
        var text_size = 0.8 * this.size;
        var render_object = view.drawText(text_co, this.selectable.text, text_size, clr)
        return render_object;
    }

    // // Do not render neutral DisplayState IMenuables
    neutralDisplay(view: IView3D): RenderObject {
        return null;
    }
}

// TODO: Could derive state from "LinkedDisplay"
// export class _HudEntityDisplay extends _EntityDisplay {
export class HudEntityDisplay extends EntityDisplay {
    // TODO: Pretty messy
    render(view: View2DHudReadOnly, clr: string, lfa?: number): RenderObject {
        var text_size = 0.8 * this.size;
        // @ts-ignore known gridLocation
        var co: GridCoordinate = this.selectable.loc.co
        var co_str = co.x.toString() + ", " + co.y.toString() + ", " + co.z.toString()
        var render_object = view.drawText(co, co_str, text_size, clr)
        // TODO: Do all this in "view.drawText"
        return render_object;
    }
}
