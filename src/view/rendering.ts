import { GridCoordinate, ICoordinate } from "../model/space";


export type RenderObject = null | THREE.Object3D; // TODO: Add "Canvas snippet"

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
    context.rect(x, y, width, height);
    context.fillStyle = color;
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = 'black';
    context.stroke();
    context.globalAlpha = 1.0;
    return null;
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
    var centerX = x + size/2.0;
    var centerY = y + size/2.0;
    var radius = size/2.0;

    context.globalAlpha = alpha;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
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
    context.moveTo(x_from, y_from);
    context.lineTo(x_to, y_to);
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
    var centerX = x + size/2.0;
    var centerY = y + size/2.0;
    var radius = size/2.0;

    context.globalAlpha = alpha;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, fraction_filled * 2 * Math.PI, false);
    // context.fillStyle = color;
    // context.fill();
    context.lineWidth = 5;
    // context.strokeStyle = 'black';
    context.strokeStyle = color;
    context.stroke();
    context.globalAlpha = 1.0;
    return null;
}

// TODO: Return RenderObject from draw methods.
export interface IView<C> {
    context: RenderingContext
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
}

export interface IView2D extends IView<GridCoordinate> {
    context: CanvasRenderingContext2D;
}

export class View2D implements IView2D {
    context: CanvasRenderingContext2D;

    constructor(k: number, size: number) {
        // Create Canvas
        var canvas = makeCanvas(k * size, k * size, true);
        this.context = canvas.getContext("2d");

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
}

class View2DWithZ extends View2D {
    context: CanvasRenderingContext2D;

    constructor(k: number, size: number, d: number) {
        super(k, size);
        // Create Canvas
        var canvas = makeCanvas(k * size, k * size * d, true);
        this.context = canvas.getContext("2d");

    }
}

class View2DIsometric extends View2D {
    context: CanvasRenderingContext2D;

    constructor(k: number, size: number, d: number) {
        super(k, size);
        // Create Canvas
        var canvas = makeCanvas(k * size, k * size * d, true);
        this.context = canvas.getContext("2d");

    }

}