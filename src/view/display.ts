// TODO: Consistent style
import { ISelectable } from "../model/core";
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { getMousePos, Position } from "./input";
import { Awaited } from "../model/utilities";
import { GridLocation } from "../model/space";
import { Unit } from "../model/unit";

export enum DisplayState {
    Neutral,
    Option,
    Preview,
    Select,
    Queue,
}

const size: number = 100;

class AbstractDisplay {
    selectable: ISelectable;
    state: DisplayState;

    constructor(selectable: ISelectable) {
        this.selectable = selectable;
        this.state = DisplayState.Neutral;
    }

    display(context: CanvasRenderingContext2D) {
        if (this.state == DisplayState.Select) {
            this.selectDisplay(context);
        } else if (this.state == DisplayState.Queue) {
            this.queueDisplay(context);
        } else if (this.state == DisplayState.Preview) {
            this.previewDisplay(context);
        } else if (this.state == DisplayState.Option) {
            this.optionDisplay(context);
        } else {
            this.neutralDisplay(context);
        }
    }

    neutralDisplay(context: CanvasRenderingContext2D) {
    }

    optionDisplay(context: CanvasRenderingContext2D) {
    }

    previewDisplay(context: CanvasRenderingContext2D) {
    }

    queueDisplay(context: CanvasRenderingContext2D) {
    }

    selectDisplay(context: CanvasRenderingContext2D) {
    }

    // TODO: Input Mixin?
    isHit(mousePos: Position): boolean {
        return false;
    }

    createClickListener(canvas: HTMLCanvasElement) {
        // Select by click - clicks off this element de-select.
        let context = canvas.getContext("2d");
        let self = this;
        let trigger = function (e: MouseEvent): ISelectable | null {
            // console.log("Expended? ",e.expended);
            if (e.type == "click") {
                let mousePos = getMousePos(canvas, e);
                if (self.isHit(mousePos)) {
                    self.state = DisplayState.Select;
                    return self.selectable;
                } else {
                    self.state = DisplayState.Option;
                    return null;
                }
            }
        }
        return trigger;
    }

    createPreviewListener(canvas: HTMLCanvasElement) {
        // Preview if not selected.
        let context = canvas.getContext("2d");
        let self = this;
        let trigger = function (e: MouseEvent): ISelectable | null {
            if (e.type == "mousemove" && !(self.state == DisplayState.Select)) {
                let mousePos = getMousePos(canvas, e);
                if (self.isHit(mousePos)) {
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


export class GridLocationDisplay extends AbstractDisplay {
    selectable: GridLocation;
    xOffset: number;
    yOffset: number;
    size: number;
    width: number;
    height: number;

    constructor(loc: GridLocation) {
        super(loc);
        this.xOffset = this.selectable.x * size + 0.1 * size;
        this.yOffset = this.selectable.y * size + 0.1 * size;
        this.size = size * 0.8;
        this.width = size * 0.8;
        this.height = size * 0.8;
    }

    render(context: CanvasRenderingContext2D, clr: string) {
        makeRect(this.xOffset, this.yOffset, context, this.size, clr);
    }

    neutralDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'lightgrey');
    }

    optionDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'grey');
    }

    previewDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'grey');
    }

    queueDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'orange');
    }

    selectDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'red');
    }

    isHit(mousePos: Position): boolean {
        if (mousePos.x >= this.xOffset && mousePos.x < this.xOffset + this.width) {
            if (mousePos.y >= this.yOffset && mousePos.y < this.yOffset + this.height) {
                return true;
            }
        } else {
            return false;
        }
    }
}


export class UnitDisplay extends AbstractDisplay {
    selectable: Unit;
    xOffset: number;
    yOffset: number;
    size: number;
    width: number;
    height: number;

    constructor(unit: Unit) {
        super(unit);
        this.xOffset = this.selectable.x * size + 0.2 * size;
        this.yOffset = this.selectable.y * size + 0.2 * size;
        this.size = size * 0.6;
        this.width = size * 0.6;
        this.height = size * 0.6;
    }

    render(context: CanvasRenderingContext2D, clr: string) {
        makeRect(this.xOffset, this.yOffset, context, this.size, clr);
    }

    neutralDisplay(context: CanvasRenderingContext2D) {
        this.render(context, this.selectable.team == 0 ? 'orangered' : 'lightblue');
    }

    optionDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'grey');
    }

    previewDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'grey');
    }

    queueDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'orange');
    }

    selectDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'red');
    }

    isHit(mousePos: Position): boolean {
        if (mousePos.x >= this.xOffset && mousePos.x < this.xOffset + this.width) {
            if (mousePos.y >= this.yOffset && mousePos.y < this.yOffset + this.height) {
                return true;
            }
        } else {
            return false;
        }
    }
}