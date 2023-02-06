import { Vector3 } from "three";
import { Glement, Entity, EntityFactory } from "../../common/entity";
import { ISelectable } from "../../model/core";
import { GridCoordinate, GridLocation, ICoordinate } from "../../model/space";
import { IState } from "../../model/state";
import { Animatable, Animate, Animation, AnimationFn, BaseAnimationFn, build_base_mixer, CircleInPlaceAnimationFn } from "../../view/animation";
import { _EntityDisplay, _EntityDisplay3D, AbstractDisplay, EntityDisplay3D, GridLocationDisplay3D, ILocatable, IPathable, LinearVisual3D, DisplayState } from "../../view/display";
import { ActiveRegion, DisplayBuilder, SmartDisplayHandler } from "../../view/display_handler";
import { IView, RenderObject, View2D } from "../../view/rendering";
import { IView3D, View3D } from "../../view/rendering_three";


function build_explode_animation(display_handler: EditorDisplayHandler, display: Animatable): AnimationFn {
    var explode = display_handler.explode;
    return function (f: number): Vector3 {
        // @ts-ignore
        var display_loc = display._offset;
        // TODO: Apply as curve. Enable the transition.
        var f = 1; 
        var x = explode.x > display_loc.x ? -1 * f : 0;
        var y = explode.y > display_loc.y ? -1 * f : 0;
        var z = explode.z > display_loc.z ? -1 * f : 0;
        return new Vector3(x, y, z);
    }
}

export class EditorDisplayHandler extends SmartDisplayHandler {
    view: View3D;
    explode: Vector3;

    constructor(
        view: IView<ICoordinate>, 
        state: IState,
        display_builder: DisplayBuilder,
    ){
        super(view, state, display_builder);
        // TODO: More elegant way to add animations in to mixer.
        this.explode = new Vector3(0, 0, 0);
        for (let display of this.display_map_manager.display_map.values()) {
            if (display instanceof EditableLocationDisplay) {
                // @ts-ignore Mixin breaks ILocatable
                var animation = new Animation(build_explode_animation(this, display), 1000, true);
                animation.start();
                display._mixer.add_animation(
                    animation
                )
            }
        }
    }

    init_active_region(): void {
        this.active_region = {z: 0};
    }
} 
    
export class EditorMenuDisplayHandler extends SmartDisplayHandler {
    view: View2D;

    constructor(
        view: IView<ICoordinate>, 
        state: IState,
        display_builder: DisplayBuilder,
    ){
        super(view, state, display_builder);
    }

    refresh(){
        // TODO: Fix - get_selectables-based diffing doesn't work for menu items.
        // this.display_map_manager.update();
        this._refresh();
        this.render_pending_inputs();
        this.view.update();
    }
   
    _refresh() {
        this.view.clear();
        delete this.render_object_map;
        this.render_object_map = new Map<RenderObject, AbstractDisplay<ISelectable>>()
        // Display Selectables
        for (let selectable of this.state.get_extras()) {
            var display = this.display_map.get(selectable);
            if (display == undefined) {
                continue;
            }
            var render_object = display.display(this.view, this.active_region);
            if (render_object != null) { // Can only select rendered elements. 
                this.render_object_map.set(render_object, display);
            }
        }
        // Display Unattached visuals
        for (let visual of this.visuals) {
            visual.display(this.view);
        }
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

export function canvas_display_builder(glement: ISelectable): AbstractDisplay<ISelectable> {
    if (glement instanceof GridLocation) {
        return new EditableLocationDisplay(glement);
    }
    else if (glement instanceof Entity) {
        return new EntityDisplay3D(glement);
    }
    else {
        throw new Error("Canvas Display builder cannot handle: " + glement);
    }
}

export function palette_display_builder(glement: ISelectable): AbstractDisplay<ISelectable> {
    if (glement instanceof EntityFactory) {
        console.log("Entity Factory: ", glement);
        // TODO: Remove hardcoding
        if (glement.entity_type.indicator == "UNIT") {
            return new PaletteDisplay(glement, {x: 0, y: 0, z: 0});
        } else if (glement.entity_type.indicator == "BOX") {
            return new PaletteDisplay(glement, {x: 0, y: 1, z: 0});
        }
    }
    else {
        throw new Error("Palette Display builder cannot handle: " + glement);
    }
}


class _EditableLocationDisplay extends GridLocationDisplay3D implements ILocatable, IPathable {
    selectable: GridLocation;
    _offset: Vector3;
    _size: number;
    width: number;
    height: number;

    constructor(loc: GridLocation) {
        super(loc);
        // overriding size, width, and height
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

    get offset(): Vector3 {
        return this._offset;
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
            var adj_lfa = 1.0 * lfa;
        } else if (this.state == DisplayState.Preview && this.active) {
            var adj_lfa = 1.0 * lfa;
        } else if (!this.traversable && this.active) {
            var adj_lfa = 0.0 * lfa;
        } else {
            var adj_lfa = 0;
        }
        return super.render(view, clr, adj_lfa);
    }
}

export class EditableLocationDisplay extends Animate(
    _EditableLocationDisplay, 
    BaseAnimationFn,
) {};

// TODO: Sprite: https://github.com/2timesjay/omniboard/blob/pre-cull-milestone/src/examples/sliding_puzzle/sliding_puzzle_display.ts
export class PaletteDisplay extends AbstractDisplay<EntityFactory> {
    _offset: Vector3;
    text: string;
    size: number;
    width: number;
    height: number;

    constructor(selectable: EntityFactory, co: GridCoordinate) {
        super(selectable);
        this.text = selectable.entity_type.text;
        this._offset = new Vector3(co.x, co.y, co.z);
        this.size = 0.4;
        this.width = this.text.length * 0.5 * this.size + 0.2 * this.size,
        this.height = this.size;
    }

    get offset() {
        return this._offset;
    }

    render(view: View2D, clr: string, lfa?: number): RenderObject {
        var hit_co = this.offset;
        // TODO: Calculate all this in "view.drawText"
        var text_co = this.offset;
        var text_size = 0.8 * this.size;
        var render_object = view.drawRect(
            hit_co, this.width, this.height, "white", 0.5
        );
        var render_object = view.drawText(
            text_co, this.text, text_size, clr
        );
        return render_object;
    }
}