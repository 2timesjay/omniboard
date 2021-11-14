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
    x: number, 
    y: number, 
    context: CanvasRenderingContext2D, 
    size: number, 
    clr?: string | null, 
    lfa?: number | null
): void {
    const alpha = lfa == undefined ? 1.0 : lfa;
    const color = clr == undefined ? "#000000" : clr;
    context.globalAlpha = alpha;
    context.beginPath();
    context.rect(x, y, size, size);
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