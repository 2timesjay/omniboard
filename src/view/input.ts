// TODO: correct types
export function getMousePos(canvasDom: any, mouseEvent: any): any {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
    };
}