export function makeCanvas(width: number, height: number, attach: boolean) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", width.toString());
    canvas.setAttribute("height", height.toString());
    if (attach) {
        document.body.appendChild(canvas);
    }
    return canvas;
}

export function makeSquare(
    x: number, 
    y: number, 
    context: CanvasRenderingContext2D, 
    size: number, 
    clr?: string | null, 
    lfa?: number | null
): void {
    makeRect(x, y, context, size, size, clr, lfa);
}

export function makeRect(
    x: number, 
    y: number, 
    context: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    clr?: string | null, 
    lfa?: number | null
): void {
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
}

export function makeCircle(
    x: number, 
    y: number, 
    context: CanvasRenderingContext2D, 
    size: number, 
    clr?: string | null, 
    lfa?: number | null
): void {
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
}

export function makeLine(
    x_from: number, 
    y_from: number,
    x_to: number,
    y_to: number, 
    context: CanvasRenderingContext2D, 
    line_width: number, 
    clr?: string | null, 
    lfa?: number | null
): void {
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
}

export function makeArc(
    x: number, 
    y: number, 
    context: CanvasRenderingContext2D, 
    size: number, 
    frac_filled?: number | null,
    clr?: string | null, 
    lfa?: number | null
): void {
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
}

export interface IView {
    context: RenderingContext
    drawArc: (
        x: number, 
        y: number, 
        size: number, 
        frac_filled?: number | null,
        clr?: string | null, 
        lfa?: number | null
    ) => void;
    drawCircle: (
        x: number, 
        y: number, 
        size: number, 
        clr?: string | null, 
        lfa?: number | null
    ) => void;
    drawLine: (
        x_from: number, 
        y_from: number,
        x_to: number,
        y_to: number, 
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ) => void;
    drawRect: (
        x: number, 
        y: number, 
        width: number, 
        height: number,
        clr?: string | null, 
        lfa?: number | null
    ) => void;
}

export interface IView2D extends IView {
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
        x: number, y: number, size: number, frac_filled?: number, clr?: string, lfa?: number
    ): void {
        makeArc(x, y, this.context, size, frac_filled, clr, lfa);
    }

    drawCircle(
        x: number, y: number, size: number, clr?: string, lfa?: number
    ): void {
        makeCircle(x, y, this.context, size, clr, lfa);
    }

    drawRect(
        x: number, y: number, width: number, height: number, clr?: string, lfa?: number
    ): void {
        makeRect(x, y, this.context, width, height, clr, lfa);
    }

    drawLine(
        x_from: number, 
        y_from: number,
        x_to: number,
        y_to: number,  
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ): void {
        makeLine(x_from, y_from, x_to, y_to, this.context, line_width, clr, lfa);
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