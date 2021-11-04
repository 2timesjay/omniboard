import { ISelectable } from "../model/core";
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { getMousePos } from "./input";

class AbstractDisplay {
    selectable: ISelectable;
    preview: boolean;
    select: boolean;

    constructor(selectable: ISelectable) {
        this.selectable = selectable;
        this.preview = false;
        this.select = false;
    }

    display(context: CanvasRenderingContext2D) {
        if (this.select) {
            this.selectDisplay(context);
        } else if (this.preview) {
            this.previewDisplay(context);
        } else {
            this.basicDisplay(context);
        }
    }

    basicDisplay(context: CanvasRenderingContext2D) {
    }

    previewDisplay(context: CanvasRenderingContext2D) {
    }

    queuedDisplay(context: CanvasRenderingContext2D) {
    }

    selectDisplay(context: CanvasRenderingContext2D) {
    }

    // isHit(mousePos) {
    // }

    // _select(stack) { // INTERFACE
    //     if (!this.select) {
    //         console.log("ACTUALLY SELECTED: ", this.entity);
    //         this.select = true;
    //         stack.push(this.entity);
    //         console.log(stack);
    //     }
    // }

    // _deselect(stack) { // INTERFACE
    //     let stackIndex = stack.indexOf(this.entity);
    //     if (this.select && stackIndex == (stack.length - 1)) {
    //         console.log("Deselect: ", this.entity);
    //         this.select = false;
    //         this.preview = false; // De-select whether automated or manual should end preview.
    //         stack.splice(stackIndex, stackIndex + 1);
    //         this.entity.clearNextSelection();
    //     }
    // }

    // selectListener(canvas, stack) {
    //     // Select by click - clicks off this element de-select.
    //     let context = canvas.getContext("2d");
    //     let self = this;
    //     let trigger = function (e) {
    //         // console.log("Expended? ",e.expended);
    //         if (e.type == "click") {
    //             let mousePos = getMousePos(canvas, e);
    //             if (self.isHit(mousePos)) {
    //                 self._select(stack);
    //                 return true;
    //             } else {
    //                 self._deselect(stack);
    //                 return false;
    //             }
    //         }
    //     }
    //     return trigger;
    // }

    // previewListener(canvas) {
    //     // Preview if not selected.
    //     let context = canvas.getContext("2d");
    //     let self = this;
    //     let trigger = function (e) {
    //         if (e.type == "mousemove" && !self.select) {
    //             let mousePos = getMousePos(canvas, e);
    //             if (self.isHit(mousePos)) {
    //                 self.preview = true;
    //                 return true;
    //             } else {
    //                 self.preview = false;
    //                 return false;
    //             }
    //         }
    //     }
    //     return trigger;
    // }

}