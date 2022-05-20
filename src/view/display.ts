// TODO: Consistent style
import { ISelectable } from "../model/core";
import { makeCanvas, makeCircle, makeRect, makeSquare } from "./rendering";
import { getMousePos, Position } from "./input";
import { Awaited } from "../model/utilities";
import { GridLocation } from "../model/space";
import { Unit } from "../model/unit";
import { Action } from "../model/state";

export enum DisplayState {
    Neutral,
    Option,
    Preview,
    Select,
    Queue,
}

const size: number = 100;

export class AbstractDisplay<T extends ISelectable> {
    selectable: T;
    // TODO: Clean up this crazy state/selection_state
    state: DisplayState;
    selection_state: DisplayState

    constructor(selectable: T) {
        this.selectable = selectable;
        this.state = DisplayState.Neutral;
        this.selection_state = DisplayState.Neutral;
    }

    update_pos() {
        // Not Implemented in base class
    }

    display(context: CanvasRenderingContext2D) {
        this.update_pos();
        if (this.state == DisplayState.Select) {
            this.selectDisplay(context);
        } else if (this.state == DisplayState.Preview) {
            this.previewDisplay(context);
        } else if (this.state == DisplayState.Option) {
            this.optionDisplay(context);
        } else {
            this.neutralDisplay(context);
        }

        if (this.selection_state == DisplayState.Queue) {
            this.queueDisplay(context);
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

    createOnclick(canvas: HTMLCanvasElement) {
        // Select by click - clicks off this element de-select.
        let context = canvas.getContext("2d");
        let self = this;
        let trigger = function (e: MouseEvent): T | null {
            if (e.type == "click") {
                let mousePos = getMousePos(canvas, e);
                if (self.isHit(mousePos)) {
                    // self.state = DisplayState.Select;
                    return self.selectable;
                } else {
                    self.state = DisplayState.Neutral;
                    return null;
                }
            }
        }
        return trigger;
    }

    createOnmousemove(canvas: HTMLCanvasElement) {
        // Preview if not selected.
        let context = canvas.getContext("2d");
        let self = this;
        let trigger = function (e: MouseEvent): T | null {
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


export class GridLocationDisplay extends AbstractDisplay<GridLocation> implements ILocatableDisplay {
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
        makeSquare(this.xOffset, this.yOffset, context, this.size, clr);
    }

    alt_render(context: CanvasRenderingContext2D, clr: string) {
        makeCircle(this.xOffset, this.yOffset, context, this.size, clr);
    }

    neutralDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'lightgrey');
    }

    optionDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'grey');
    }

    previewDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'yellow');
    }

    queueDisplay(context: CanvasRenderingContext2D) {
        this.alt_render(context, 'indianred');
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


export class UnitDisplay extends AbstractDisplay<Unit> implements ILocatableDisplay{
    selectable: Unit;
    xOffset: number;
    yOffset: number;
    size: number;
    width: number;
    height: number;

    constructor(unit: Unit) {
        super(unit);
        this.update_pos();
    }

    update_pos() {
        this.xOffset = this.selectable.loc.x * size + 0.2 * size;
        this.yOffset = this.selectable.loc.y * size + 0.2 * size;
        this.size = size * 0.6;
        this.width = size * 0.6;
        this.height = size * 0.6;
    }

    render(context: CanvasRenderingContext2D, clr: string) {
        var unit: Unit = this.selectable;
        var unit_transparency = 0.2 + 0.8 * unit.hp / unit.max_hp;
        makeSquare(this.xOffset, this.yOffset, context, this.size, clr, unit_transparency);
    }

    alt_render(context: CanvasRenderingContext2D, clr: string) {
        makeCircle(this.xOffset, this.yOffset, context, this.size*.6, clr);
    }

    neutralDisplay(context: CanvasRenderingContext2D) {
        this.render(context, this.selectable.team == 0 ? 'orange' : 'blue');
    }

    optionDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'grey');
    }

    previewDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'yellow');
    }

    queueDisplay(context: CanvasRenderingContext2D) {
        this.alt_render(context, 'indianred');
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

// TOOD: Elaborate or make into interface
interface ILocatableDisplay {
    xOffset: number;
    yOffset: number;
}


interface IMenuable {// Action<ISelectable>
    index: number;
    text: string;
}


export class MenuElementDisplay extends AbstractDisplay<IMenuable> {
    selectable: IMenuable;
    parent: ILocatableDisplay;
    size: number;
    width: number;
    height: number;
    
    constructor(selectable: IMenuable, parent: ILocatableDisplay) {
        super(selectable);
        this.parent = parent;
        this.size = size*0.8;
        this.width = this.size;
        this.height = this.size;
    }

    get xOffset() {
        return this.parent.xOffset;
    }

    get yOffset() {
        return this.parent.yOffset + this.size * this.selectable.index;
    }


    render(context: CanvasRenderingContext2D, clr: string) {
        makeRect(
            this.xOffset, 
            this.yOffset, 
            context, 
            this.selectable.text.length*0.5*this.size + 0.2*this.size, 
            this.size, 
            "white", 
            0.5
        );
        context.fillStyle = clr;
        context.font = 0.8 * this.size + "px Trebuchet MS";
        context.fillText(
            this.selectable.text, 
            this.xOffset + 0.2 * this.size, 
            this.yOffset + 0.8 * this.size
        );
    }

    neutralDisplay(context: CanvasRenderingContext2D) {
    }

    optionDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'grey');
    }

    previewDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'yellow');
    }

    queueDisplay(context: CanvasRenderingContext2D) {
        this.render(context, 'indianred');
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