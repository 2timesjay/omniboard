// TODO: Consistent style
import { ISelectable } from "../model/core";
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { getMousePos, Position } from "./input";
import { Awaited } from "../model/utilities";

export enum DisplayState {
    Neutral,
    Preview,
    Queue,
    Select,
}

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
        } else {
            this.neutralDisplay(context);
        }
    }

    neutralDisplay(context: CanvasRenderingContext2D) {
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
        let trigger = function (e: MouseEvent): boolean {
            // console.log("Expended? ",e.expended);
            if (e.type == "click") {
                let mousePos = getMousePos(canvas, e);
                if (self.isHit(mousePos)) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return trigger;
    }

    createPreviewListener(canvas: HTMLCanvasElement) {
        // Preview if not selected.
        let context = canvas.getContext("2d");
        let self = this;
        let trigger = function (e: MouseEvent): boolean {
            if (e.type == "mousemove" && !self.state == DisplayState.Select) {
                let mousePos = getMousePos(canvas, e);
                if (self.isHit(mousePos)) {
                    self.state = DisplayState.Preview
                    return true;
                } else {
                    self.state = DisplayState.Neutral
                    return false;
                }
            }
        }
        return trigger;
    }

}




// class LocationDisplay extends AbstractDisplay {
//     constructor(loc) {
//         super(loc);
//         this.loc = loc;
//         this.xOffset = this.loc.x * size + 0.1 * size;
//         this.yOffset = this.loc.y * size + 0.1 * size;
//         this.size = size * 0.8;
//         this.width = size * 0.8;
//         this.height = size * 0.8;
//     }

//     render(context, clr) {
//         if (!this.loc.traversable) { return; }
//         makeRect(this.xOffset, this.yOffset, context, this.size, clr);
//     }

//     passiveDisplay(context, clr) {
//         const color = clr == undefined ? this.loc.color : clr;
//         this.render(context, color);
//     }

//     basicDisplay(context) {
//         this.render(context, 'grey');
//     }

//     previewDisplay(context) {
//         this.render(context, 'yellow');
//     }

//     selectedDisplay(context) {
//         this.render(context, 'red');
//     }

//     isHit(mousePos: Position): boolean {
//         if (mousePos.x >= this.xOffset && mousePos.x < this.xOffset + this.width) {
//             if (mousePos.y >= this.yOffset && mousePos.y < this.yOffset + this.height) {
//                 return true;
//             }
//         } else {
//             return false;
//         }
//     }
// }

// class UnitDisplay extends AbstractDisplay {
//     constructor(unit) {
//         super(unit);
//         this.unit = unit;
//         this.size = 0.6 * size;
//         this.width = 0.6 * size;
//         this.height = 0.6 * size;

//         this.xOffsetCurrent = this.xOffsetTarget;
//         this.xGenReset(); 
//         this.yOffsetCurrent = this.yOffsetTarget;
//         this.yGenReset(); 
//     }

//     xGenReset() {
//         this.xOffsetGen = lerp(100, this.xOffsetCurrent, this.xOffsetTarget);
//     }

//     get xOffsetTarget() {
//         return this.unit.loc.x * size + 0.2 * size;
//     }

//     get xOffset() {
//         let next = this.xOffsetGen.next();
//         if (next.done) {
//             this.xGenReset();
//             return this.xOffsetCurrent;
//         }
//         else {
//             this.xOffsetCurrent = next.value
//             return this.xOffsetCurrent;
//         }
//     }

//     yGenReset() {
//         this.yOffsetGen = lerp(100, this.yOffsetCurrent, this.yOffsetTarget);
//     }

//     get yOffsetTarget() {
//         return this.unit.loc.y * size + 0.2 * size
//     }

//     get yOffset() {
//         let next = this.yOffsetGen.next();
//         if (next.done) {
//             this.yGenReset();
//             return this.yOffsetCurrent;
//         }
//         else {
//             this.yOffsetCurrent = next.value
//             return this.yOffsetCurrent;
//         }
//     }


//     render(context, clr, lfa) {
//         const color = clr == undefined ? "black" : clr;
//         const alpha = lfa == undefined ? 0.5 ** (this.unit.maxhp - this.unit.hp) : lfa;
//         makeRect(this.xOffset, this.yOffset, context, this.size, color, alpha);
//     }

//     passiveDisplay(context) {
//         this.render(context, this.unit.team == 0 ? 'red' : 'blue');
//     }

//     basicDisplay(context) {
//         this.render(context, 'black');
//     }

//     previewDisplay(context) {
//         this.render(context, 'yellow');
//     }

//     selectDisplay(context) {
//         this.render(context, 'red');
//     }

//     isHit(mousePos) {
        var inXBounds = mousePos.x >= this.xOffset && mousePos.x < this.xOffset + this.size;
        var inYBounds = mousePos.y >= this.yOffset && mousePos.y < this.yOffset + this.size;
        return inXBounds && inYBounds;
    }
}