import { GridCoordinate, ICoordinate } from "../model/space";
import { InputCoordinate } from "./broker";

// Canvas rendering scale constant
export const SIZE = 100;
export class HitRect2D {
    co: GridCoordinate;
    dims: GridCoordinate; // TODO: wrong dimensionality; ThreeVector instead?

    constructor(co: GridCoordinate, dims: GridCoordinate) {
        this.co = co;
        this.dims = dims;
    }

    isHit(mouse_co: InputCoordinate): boolean {
        var xOffset = SIZE * this.co.x;
        var xExtent = SIZE * (this.co.x + this.dims.x); 
        var yOffset = SIZE * this.co.y;
        var yExtent = SIZE * (this.co.y + this.dims.y);
        if (mouse_co.x >= xOffset && mouse_co.x < xExtent) {
            if (mouse_co.y >= yOffset && mouse_co.y < yExtent) {
                return true;
            }
        } else {
            return false;
        }
    }
} 
export type RenderObject = null | THREE.Object3D | HitRect2D; // TODO: Add "Canvas snippet"

export function makeCanvas(width: number, height: number, attach: boolean) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", width.toString());
    canvas.setAttribute("height", height.toString());
    if (attach) {
        document.body.appendChild(canvas);
    }
    return canvas;
}

export function makeRect(
    co: GridCoordinate,
    context: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    clr?: string | null, 
    lfa?: number | null
): RenderObject {
    var {x, y} = co;
    const alpha = lfa == undefined ? 1.0 : lfa;
    const color = clr == undefined ? "#000000" : clr;
    context.globalAlpha = alpha;
    context.beginPath();
    context.rect(x*SIZE, y*SIZE, width*SIZE, height*SIZE);
    context.fillStyle = color;
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = 'black';
    context.stroke();
    context.globalAlpha = 1.0;
    return new HitRect2D(co, {x: width, y: height});
}

export function makeCircle(
    co: GridCoordinate,
    context: CanvasRenderingContext2D, 
    size: number, 
    clr?: string | null, 
    lfa?: number | null
): RenderObject {
    var {x, y} = co;
    const alpha = lfa == undefined ? 1.0 : lfa;
    const color = clr == undefined ? "#000000" : clr;
    var centerX = (x + size/2.0);
    var centerY = (y + size/2.0);
    var radius = (size/2.0);

    context.globalAlpha = alpha;
    context.beginPath();
    context.arc(SIZE*centerX, SIZE*centerY, SIZE*radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    context.lineWidth = 5;
    // context.strokeStyle = 'black';
    // context.strokeStyle = color;
    // context.stroke();
    context.globalAlpha = 1.0;
    return null;
}

export function makeLine(
    co_from: GridCoordinate,
    co_to: GridCoordinate,
    context: CanvasRenderingContext2D, 
    line_width: number, 
    clr?: string | null, 
    lfa?: number | null
): RenderObject {
    var {x: x_from, y: y_from} = co_from;
    var {x: x_to, y: y_to} = co_to;
    const alpha = lfa == undefined ? 1.0 : lfa;
    const color = clr == undefined ? "#000000" : clr;
    context.lineWidth = line_width;
    context.globalAlpha = alpha;
    context.strokeStyle = color;

    context.beginPath();
    context.moveTo(SIZE*x_from, SIZE*y_from);
    context.lineTo(SIZE*x_to, SIZE*y_to);
    context.stroke();
    
    context.globalAlpha = 1.0;
    context.strokeStyle = 'black';
    return null;
}

export function makeArc(
    co: GridCoordinate,
    context: CanvasRenderingContext2D, 
    size: number, 
    frac_filled?: number | null,
    clr?: string | null, 
    lfa?: number | null
): RenderObject {
    var {x, y} = co;
    const fraction_filled = frac_filled == undefined ? 1.0: frac_filled;
    const alpha = lfa == undefined ? 1.0 : lfa;
    const color = clr == undefined ? "#000000" : clr;
    var centerX = (x + size/ 2.0);
    var centerY = (y + size/ 2.0);
    var radius = (size/ 2.0);
    
    context.globalAlpha = alpha;
    context.beginPath();
    context.arc(SIZE*centerX, SIZE*centerY, SIZE*radius, 0, fraction_filled * 2 * Math.PI, false);
    // context.fillStyle = color;
    // context.fill();
    context.lineWidth = 5;
    // context.strokeStyle = 'black';
    context.strokeStyle = color;
    context.stroke();
    context.globalAlpha = 1.0;
    return null;
}

// View without input functions
export interface IView<C extends ICoordinate> {
    context: RenderingContext
    clear: () => void;
    drawArc: (
        co: C,
        size: number, 
        frac_filled?: number | null,
        clr?: string | null, 
        lfa?: number | null
    ) => RenderObject;
    drawCircle: (
        co: C,
        size: number, 
        clr?: string | null, 
        lfa?: number | null
    ) => RenderObject;
    drawLine: (
        co_from: C,
        co_to: C,
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ) => RenderObject;
    drawRect: (
        co: C,
        width: number, 
        height: number,
        clr?: string | null, 
        lfa?: number | null
    ) => RenderObject;
    drawText: (
        co: C,
        text: string, 
        font_size: number,
        clr?: string | null,
        lfa?: number | null,
    ) => RenderObject;
}

// View with input methods
export interface IInputView<C extends ICoordinate> extends IView<C> {
    getHitObjects: (mouse_co: InputCoordinate, render_objects?: Array<RenderObject>) => Array<RenderObject>;
}

export interface IView2D extends IInputView<GridCoordinate> {
    context: CanvasRenderingContext2D;
}

interface View2DArgs {}

export class View2D implements IView2D {
    context: CanvasRenderingContext2D;
    size: number;

    constructor(k: number, size: number, extra_args?: View2DArgs) {
        // Create Canvas
        var canvas = this.buildCanvas(k, size, extra_args);
        this.size = size;
        this.context = canvas.getContext("2d");
    }

    clear() {
        var context = this.context;
        var canvas = context.canvas;
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    buildCanvas(k: number, size: number, extra_args?: View2DArgs): HTMLCanvasElement {
        return makeCanvas(k * size, k * size, true);
    }

    // TODO: Bizarre to smuggle render_objects in here but not in 3d.
    getHitObjects(mouse_co: InputCoordinate, render_objects: Array<HitRect2D>): Array<HitRect2D> {
        // find intersections
        return render_objects.filter(hr => hr.isHit(mouse_co))
    }
    
    drawArc(
        co: GridCoordinate, size: number, frac_filled?: number, clr?: string, lfa?: number
    ): RenderObject {
        return makeArc(co, this.context, size, frac_filled, clr, lfa);
    }
    drawCircle(
        co: GridCoordinate, size: number, clr?: string, lfa?: number
    ): RenderObject {
        return makeCircle(co, this.context, size, clr, lfa);
    }
    drawRect(
        co: GridCoordinate, width: number, height: number, clr?: string, lfa?: number
    ): RenderObject {
        return makeRect(co, this.context, width, height, clr, lfa);
    }
    drawLine(
        co_from: GridCoordinate,
        co_to: GridCoordinate,  
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ): RenderObject {
        return makeLine(co_from, co_to, this.context, line_width, clr, lfa);
    }
    
    drawText(
        co: GridCoordinate,
        text: string, 
        font_size: number,
        clr?: string | null,
        lfa?: number | null,
    ): RenderObject {
        var {x, y} = co;
        var context = this.context;
        context.fillStyle = clr;
        context.font = SIZE*font_size + "px Trebuchet MS";
        context.fillText(
            text, 
            SIZE * x, 
            SIZE * y,
        );
        return null;
    }
}

interface View2DZArgs extends View2DArgs {
    depth: number
}

export class View2DPseudoZ extends View2D {
    context: CanvasRenderingContext2D;
    k: number;

    constructor(k: number, size: number, extra_args: View2DZArgs) {
        super(k, size, extra_args);
        this.k = k;
    }

    buildCanvas(k: number, size: number, extra_args: View2DZArgs): HTMLCanvasElement {
        var depth = extra_args.depth;
        console.log(k * size, (k + 1) * size * depth, true)
        return makeCanvas(k * size, (k + 1) * size * depth, true);
    }

    _apply_coordinate_transform(co: GridCoordinate): GridCoordinate {
        if (co.z == undefined) {
            console.log("Z-less coordinate: ", co)
        }
        return { x: co.x, y: co.y + (this.k + 1) * co.z, z: 0}
    }
    
    drawArc(
        co: GridCoordinate, size: number, frac_filled?: number, clr?: string, lfa?: number
    ): RenderObject {
        var co = this._apply_coordinate_transform(co);
        return makeArc(co, this.context, size, frac_filled, clr, lfa);
    }

    drawCircle(
        co: GridCoordinate, size: number, clr?: string, lfa?: number
    ): RenderObject {
        var co = this._apply_coordinate_transform(co);
        return makeCircle(co, this.context, size, clr, lfa);
    }

    drawRect(
        co: GridCoordinate, width: number, height: number, clr?: string, lfa?: number
    ): RenderObject {
        var co = this._apply_coordinate_transform(co);
        return makeRect(co, this.context, width, height, clr, lfa);
    }

    drawLine(
        co_from: GridCoordinate,
        co_to: GridCoordinate,  
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ): RenderObject {
        var co_from = this._apply_coordinate_transform(co_from);
        var co_to = this._apply_coordinate_transform(co_to);
        return makeLine(co_from, co_to, this.context, line_width, clr, lfa);
    }

    drawText(
        co: GridCoordinate,
        text: string, 
        font_size: number,
        clr?: string | null,
        lfa?: number | null,
    ): RenderObject {
        var co = this._apply_coordinate_transform(co);
        var {x, y} = co;
        // TODO: Move into makeText, as in 3D.
        var context = this.context;
        context.fillStyle = clr;
        context.font = SIZE*font_size + "px Trebuchet MS";
        context.fillText(
            text, 
            SIZE * x, 
            SIZE * y,
        );
        return null;
    }
}

export class View2DIsometric extends View2D {
    context: CanvasRenderingContext2D;

    constructor(k: number, size: number, extra_args: View2DZArgs) {
        super(k, size, extra_args);
    }
}