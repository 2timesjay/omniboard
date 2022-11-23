// TODO: Consistent style
import { ISelectable } from "../model/core";
import { IView, RenderObject } from "./rendering";
import { getMouseCo, InputCoordinate, OnInputEvent } from "./broker";
import { Awaited } from "../model/utilities";
import { GridCoordinate, GridLocation, ICoordinate, Vector } from "../model/space";
import { Unit } from "../examples/tactics/unit";
import { createWatchCompilerHost } from "typescript";
import { Entity } from "../model/entity";
import { IView3D, View3D } from "./rendering_three";
import { Event, Mesh, Object3D } from "three";
import { ActiveRegion } from "./display_handler";
import { View2DHudReadOnly } from "./hud_rendering";
import { Animate, BaseAnimation, CircleInPlace } from "./animation";

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
    _xOffset: number;
    _yOffset: number;
    _zOffset: number
    _size: number;
    children: Array<AbstractVisual>;
    get xOffset(): number;
    get yOffset(): number;
    get zOffset(): number;
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
    _xOffset: number;
    _yOffset: number;
    _zOffset: number;
    _size: number;
    children: AbstractVisual[];

    constructor(co: GridCoordinate) {
        this._xOffset = co.x;
        this._yOffset = co.y;
        this._zOffset = co.z;
        this.children = [];
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
    get co() {
        return {
            x: this.parent.xOffset, y: this.parent.yOffset, z: this.parent.zOffset
        }
    }

    render(view: IView<ICoordinate>, clr: string) {
        throw new Error('Method not implemented.');
    }
}

export class HealthVisual extends UnitaryVisual {
    parent: _UnitDisplay;
    index: number;
    color: string;

    constructor(parent: _UnitDisplay, index: number) {
        super(parent);
        this.index = index;
    }

    display(view: IView<ICoordinate>) {
        this.render(view, this.color)
    }

    get num_health_bars(): number {
        return this.parent.selectable.all_max_hp.length;
    }

    // See https://www.rapidtables.com/web/color/html-color-codes.html
    get_health_color(): string {
        switch (this.num_health_bars - this.index - 1) {
            case 0: return 'teal';
            case 1: return 'lightseagreen';
            case 2: return 'mediumturquoise';
            case 3: return 'turquoise';
            default: return 'cyan';
        }
    }

    render(view: IView<ICoordinate>, clr: string) {
        const RADIUS_INCR = 0.05;
        var radius_delta: number = (this.num_health_bars - this.index) * RADIUS_INCR;

        var parent = this.parent;
        var x = parent.xOffset - radius_delta;
        var y = parent.yOffset - radius_delta;
        var size = parent.size + 2 * radius_delta;
        var max = this.parent.selectable.all_max_hp[this.index];
        var cur = this.parent.selectable.all_hp[this.index];
        var frac_filled = cur/max
        var co = {x: x, y: y};
        view.drawArc(
            co, size, frac_filled, this.get_health_color(),
        );
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
        // @ts-ignore
        var adj_from = from.size * 0.5;
        // @ts-ignore
        var adj_to = to.size * 0.5;
        var x_from = from.xOffset + adj_from;
        var y_from = from.yOffset + adj_from;
        var x_to = to.xOffset + adj_to;
        var y_to = to.yOffset + adj_to;
        var co_from = {x: x_from, y: y_from};
        var co_to = {x: x_to, y: y_to};
        view.drawLine(
            co_from, co_to,
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
        var co_from = {x: this.from.xOffset, y: this.from.yOffset, z: this.from.zOffset + 0.7};
        var co_to = {x: this.to.xOffset, y: this.to.yOffset, z: this.to.zOffset + 0.7};
        view.drawLine(
            co_from, co_to, 10, clr,
        )
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

    createOnclick(canvas: HTMLCanvasElement): OnInputEvent<T> {
        // Select by click - clicks off this element de-select.
        let self = this;
        let trigger = function (hit_selectable: T | null, type: string): T | null {
            // TODO: Clean up this and `SelectionBroker` fanout
            if (type != "click") {
                return null;
            }
            // TODO: Clean up this vs. isHit to allow full inheritance. See inputs.ts
            if (self.selectable == hit_selectable) {
                // self.state = DisplayState.Select;
                return self.selectable;
            } else {
                self.state = DisplayState.Neutral;
                return null;
            }
        }
        return trigger;
    }

    createOnmousemove(canvas: HTMLCanvasElement) {
        // Preview if not selected.
        let self = this;
        let trigger = function (hit_selectable: T | null, type: string): T | null {
            if (type != "mousemove") {
                return null;
            }
            if (self.state != DisplayState.Select) {
                if (self.selectable == hit_selectable) {
                    self.state = DisplayState.Preview;
                    return self.selectable;
                } else {
                    self.state = DisplayState.Option;
                    return null;
                }
            }
        }
        return trigger;
    }

}

export class AbstractDisplay3D<T extends ISelectable> extends AbstractDisplay<T> {
    selectable: T;
    // TODO: Clean up this crazy state/selection_state
    state: DisplayState;
    selection_state: DisplayState
    children: Array<AbstractVisual>;

    constructor(selectable: T) {
        super(selectable);
    }

    createOnclick(canvas: HTMLCanvasElement): OnInputEvent<T> {
        // Select by click - clicks off this element de-select.
        let self = this;
        let trigger = function (hit_selectable: T | null, type: string): T | null {
            // TODO: Clean up this and `SelectionBroker` fanout
            if (type != "click") {
                return null;
            }
            if (self.isHit(hit_selectable)) {
                // self.state = DisplayState.Select;
                return self.selectable;
            } else {
                self.state = DisplayState.Neutral;
                return null;
            }
        }
        return trigger;
    }

    createOnmousemove(canvas: HTMLCanvasElement) {
        // Preview if not selected.
        let self = this;
        let trigger = function (hit_selectable: T | null, type: string): T | null {
            if (type != "mousemove") {
                return null;
            }
            if (self.state != DisplayState.Select) {
                if (self.isHit(hit_selectable)) {
                    self.state = DisplayState.Preview;
                    return self.selectable;
                } else {
                    self.state = DisplayState.Option;
                    return null;
                }
            }
        }
        return trigger;
    }

}

export class GridLocationDisplay extends AbstractDisplay<GridLocation> implements ILocatable, IPathable {
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
        this._size = 0.8;
        this.width = 0.8;
        this.height = 0.8;
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

    render(view: IView<ICoordinate>, clr: string, lfa?: number) {
        return view.drawRect(this.co, this.size, this.size, clr, lfa);
    }

    alt_render(view: IView<ICoordinate>, clr: string) {
        return view.drawCircle(this.co, this.size, clr);
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

export class GridLocationDisplay3D extends AbstractDisplay3D<GridLocation> implements ILocatable, IPathable {
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

    render(view: IView3D, clr: string, lfa?: number): THREE.Object3D {
        // TODO: Make this more consistent with 2D
        // NOTE: Don't render if lfa = 0; rendering bug when inside transparent object.
        if (lfa == 0) return;
        var adj_lfa = this.active ? lfa: 0.2 * lfa
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

// Share code with _UnitDisplay
export class _EntityDisplay extends AbstractDisplay<Entity> implements ILocatable, IPathable {
    selectable: Entity;
    _xOffset: number;
    _yOffset: number;
    _zOffset: number;
    _size: number;
    width: number;
    height: number;

    constructor(entity: Entity) {
        super(entity);
        this.update_pos();
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
        return view.drawRect(this.co, this.size, this.size, clr);
    }

    alt_render(view: IView<ICoordinate>, clr: string): RenderObject {
        var offset = 0.2 * this.size;
        var co = {x: this.co.x + offset, y: this.co.y + offset, z: this.co.z};
        return view.drawRect(co, this.size*.6, this.size*.6, clr);
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
// export const EntityDisplay = Animate(_EntityDisplay, JumpInPlace);
export class EntityDisplay extends Animate(_EntityDisplay, BaseAnimation) {};


export class _EntityDisplay3D extends AbstractDisplay3D<Entity> implements ILocatable, IPathable {
    selectable: Entity;
    _xOffset: number;
    _yOffset: number;
    _zOffset: number;
    _size: number;
    width: number;
    height: number;
    additional_offsets: Vector;

    constructor(entity: Entity, additional_offsets?: Vector) {
        super(entity);
        this.additional_offsets = additional_offsets ? additional_offsets: {x: 0, y: 0, z: 0};
        this.update_pos();
    }

    get xOffset(): number {
        return this._xOffset + this.additional_offsets.x;
    }

    get yOffset(): number {
        return this._yOffset + this.additional_offsets.y;
    }

    get zOffset(): number {
        return this._zOffset + this.additional_offsets.z;
    }

    get co(): GridCoordinate {
        return {x: this.xOffset, y: this.yOffset, z: this.zOffset};
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
        this._xOffset = this.selectable.loc.x + margin;
        // @ts-ignore Actually GridLocation
        this._yOffset = this.selectable.loc.y + margin;
        this._zOffset = (
            // @ts-ignore Actually GridLocation
            this.selectable.loc.z != null ? 
            // @ts-ignore Actually GridLocation
            (this.selectable.loc.z) + 0.6 + margin: 
            margin
        );
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
            {x: this.xOffset, y: this.yOffset, z: this.zOffset}, 
            this.size, this.size, // TODO: Fix 3d rect hack
            clr, adj_lfa,
        );
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        var offset = 0.2 * this.size;
        var reduced_size = 0.6 * this.size;
        return view.drawRect(
            {x: this.xOffset + offset, y: this.yOffset + offset, z: this.zOffset + offset}, 
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


export class EntityDisplay3D extends Animate(_EntityDisplay3D, BaseAnimation) {}


class _UnitDisplay extends AbstractDisplay<Unit> implements ILocatable, IPathable {
    selectable: Unit;
    _xOffset: number;
    _yOffset: number;
    _zOffset: number;
    _size: number;
    width: number;
    height: number;

    constructor(unit: Unit) {
        super(unit);
        this.update_pos();
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

    update_pos() {
        console.log("MOVING UNIT: ", this.selectable)
        console.log("UPDATED LOC: ", this.selectable.loc.co.x, this.selectable.loc.y, this.selectable.loc.z);
        this._zOffset = this.selectable.loc.z != null ? this.selectable.loc.z : 0;
        this._xOffset = this.selectable.loc.x + 0.2;
        this._yOffset = this.selectable.loc.y + 0.2;
        this._size = 0.6;
        this.width = 0.6;
        this.height = 0.6;
    }

    render(view: IView<ICoordinate>, clr: string): RenderObject {
        var unit: Unit = this.selectable;
        var unit_alpha = (
            unit.all_max_hp.length == 1 ? 
            0.2 + 0.8 * unit.hp / unit.max_hp :
            1
        );
        return view.drawRect(this.co, this.size,  this.size, clr, unit_alpha);
    }

    alt_render(view: IView<ICoordinate>, clr: string): RenderObject {
        var offset = 0.2 * this.size;
        var co = {x: this.co.x + offset, y: this.co.y + offset, z: this.co.z};
        return view.drawRect(co, this.size*.6, this.size*.6, clr);
    }

    neutralDisplay(view: IView<ICoordinate>): RenderObject {
        return this.render(view, this.selectable.team == 0 ? 'orange' : 'blue');
    }

    pathDisplay(view: IView<ICoordinate>, to: IPathable) {
        var from = this;
        var line = new LinearVisual(from, to);
        line.display(view);
    }
}

export class UnitDisplay extends Animate(_UnitDisplay, CircleInPlace) {};

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

    get xOffset() {
        return this.parent._xOffset;
    }

    get yOffset() {
        return this.parent._yOffset + this.size * this.selectable.index;
    }

    get zOffset() {
        return this.parent._zOffset;
    }

    get co(): GridCoordinate {
        return {x: this.xOffset, y: this.yOffset, z: this.zOffset};
    }


    render(view: IView<ICoordinate>, clr: string, lfa?: number): RenderObject {
        var hit_co = this.co
        var text_co = {x: this.co.x, y: this.co.y + this.height, z: this.co.z};
        var text_size = 0.8 * this.size;
        var render_object = view.drawRect(
            hit_co, this.width, this.height, "white", 0.5
        );
        view.drawText(text_co, this.selectable.text, text_size, clr)
        // TODO: Do all this in "view.drawText"
        return render_object;
    }

    // Do not render neutral DisplayState IMenuables
    neutralDisplay(view: IView<ICoordinate>): RenderObject {
        return null;
    }
}

// TODO: Merge with 2D version
export class MenuElementDisplay3D extends AbstractDisplay3D<IMenuable> {
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

    get xOffset() {
        return this.parent._xOffset;
    }

    get yOffset() {
        return this.parent._yOffset;
    }

    get zOffset() {
        return this.parent._zOffset + this.size * this.selectable.index;
    }

    get co(): GridCoordinate {
        return {x: this.xOffset, y: this.yOffset, z: this.zOffset};
    }

    render(view: IView3D, clr: string, lfa?: number): RenderObject {
        var hit_co = {x: this.xOffset, y: this.yOffset, z: this.zOffset};
        var text_co = {x: this.xOffset, y: this.yOffset, z: this.zOffset};
        var text_size = 0.8 * this.size;
        // var render_object = view.drawRect(
        //     hit_co, this.width, this.height, "white", 0.5
        // );
        var render_object = view.drawText(text_co, this.selectable.text, text_size, clr)
        // TODO: Do all this in "view.drawText"
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
