import { GridCoordinate } from "../model/space";
import { IView, makeArc, makeCanvas, makeCircle, makeLine, makeRect, RenderObject, SIZE, View2DArgs } from "./rendering";

// View without input functions
// TODO: Could separate read-only and input View2Ds
// TODO: Separate input (just GetHitObjects) and view in class hierarchy
export class View2DHudReadOnly implements IView<GridCoordinate> {
    context: CanvasRenderingContext2D
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