// TODO: Consistent style
import { ISelectable } from "../model/core";
import { makeCanvas, makeCircle, makeLine, makeRect, makeSquare } from "./rendering";
import { getMousePos, Position } from "./input";
import { Awaited } from "../model/utilities";
import { GridLocation } from "../model/space";
import { Unit } from "../model/unit";
import { Action } from "../model/state";
import { createWatchCompilerHost } from "typescript";

export enum DisplayState {
    Neutral,
    Option,
    Preview,
    Select,
    Queue,
}

// Following https://www.typescriptlang.org/docs/handbook/mixins.html
type Mixinable = new (...args: any[]) => {};
type ConstrainedMixinable<T = {}> = new (...args: any[]) => T;

const size: number = 100;

// TODO: Add size, add center;
interface ILocatable {
    _xOffset: number;
    _yOffset: number;
    _size: number;
    get xOffset(): number;
    get yOffset(): number;
    get size(): number;
}

export interface IMenuable {// Action<ISelectable>, Confirmation
    index: number;
    text: string;
}

type DeltaGen = Generator<number, DeltaGen, DeltaGen>;

// Time-varying animations
interface IAnimation {
    delta_x(): DeltaGen;
    delta_y(): DeltaGen;
    delta_s(): DeltaGen; // TODO: Implement on ILocatable
}

function interruptable_generator(
    base_gen_builder: () => DeltaGen
): () => DeltaGen {
    return function*(): DeltaGen {
        while(true) {
            console.log("Interruptable Generator Base Gen Build");
            var base_gen = base_gen_builder();
            var delegate_gen: DeltaGen = yield *base_gen;
            if (delegate_gen != null) {
                console.log("Received interruption: ", delegate_gen)
                yield *delegate_gen;
            }
        }
    }
}

class BaseAnimation implements IAnimation {
    parent: AbstractDisplay<ILocatable>;

    constructor(parent: AbstractDisplay<ILocatable>) {
        this.parent = parent;
    }

    * _delta_x(): DeltaGen {
        while(true) {
            var gen = yield 0;
            if (gen != null) {
                return gen;
            }
        }
    }

    get delta_x() {
        return interruptable_generator(this._delta_x.bind(this));
    }

    * _delta_y(): DeltaGen {
        while(true) {
            yield 0;
            var gen = yield 0;
            if (gen != null) {
                return gen;
            }
        }
    }

    get delta_y() {
        return interruptable_generator(this._delta_y.bind(this));
    }

    * _delta_s(): DeltaGen {
        while(true) {
            yield 1;
            var gen = yield 1;
            if (gen != null) {
                return gen;
            }
        }
    }

    get delta_s() {
        return interruptable_generator(this._delta_s.bind(this));
    }
}

export class CircleInPlace extends BaseAnimation { 
    rand: number;

    * _delta_x(): DeltaGen {
        while(true){
            var gen = yield Math.cos(Date.now()/100 + this.phase_shift);
            if (gen != null) {
                return gen;
            }
        } 
    }

    * _delta_y(): DeltaGen {
        while(true){
            var gen = yield Math.sin(Date.now()/100 + this.phase_shift);
            if (gen != null) {
                return gen;
            }
        }
    }

    // TODO: Couldn't construct `this.rand` in constructor so had to do in gens.
    // TODO: This was actually because I didn't bind correctly.
    get phase_shift(): number {
        if (this.rand === undefined) {
            this.rand = Math.PI*(2*Math.random() - 1);
        }
        return this.rand;
    }
}

function shuffle(arr: Array<number>) {
    let currentIndex = arr.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [arr[currentIndex], arr[randomIndex]] = [
        arr[randomIndex], arr[currentIndex]];
    }
  
    return arr;
  }

export class Flinch implements IAnimation { 
    x_walk: Array<number>;
    y_walk: Array<number>;
    x: number;
    y: number;
    finished: boolean;

    // TODO: Harmonize with Move (use grid locs instead of pixel args)
    // TODO: Include "bump" outwards.
    constructor(initial_x: number, initial_y: number, duration: number) {
        this.x = initial_x;
        console.log(Math.round((duration - initial_x)/2));
        this.x_walk = new Array(Math.round((duration - initial_x)/2)).fill(1);
        this.x_walk.push(...(new Array(Math.round((initial_x + duration)/2))).fill(-1))
        shuffle(this.x_walk);
        this.y = initial_y;
        this.y_walk = new Array(Math.round((duration - initial_y)/2)).fill(1);
        this.y_walk.push(...(new Array(Math.round((initial_y + duration)/2))).fill(-1))
        shuffle(this.y_walk);
        this.finished = false;
    }

    // @ts-ignore
    * delta_x(): DeltaGen {
        while(this.x_walk.length > 0) {
            this.x += this.x_walk.pop();
            yield this.x;
        }
        this.finished = true;
    }

    // @ts-ignore
    * delta_y(): DeltaGen {
        while(this.y_walk.length > 0) {
            this.y += this.y_walk.pop();
            yield this.y;
        }
        this.finished = true;
    }

    // @ts-ignore
    * delta_s(): DeltaGen {
        while(!this.finished) {
            yield 1;
        }
    }
}

export class Move implements IAnimation { 
    x_walk: Array<number>;
    y_walk: Array<number>;
    finished: boolean;
    parent: AbstractDisplay<ISelectable> & ILocatable;

    constructor(
        dx:number, dy: number, duration: number, parent: AbstractDisplay<ISelectable> & ILocatable
    ) {
        this.parent = parent;
        this.x_walk = [ ...Array(duration+1).keys() ].map( i => (i)*dx*size/duration);
        this.y_walk = [ ...Array(duration+1).keys() ].map( i => (i)*dy*size/duration);
        this.finished = false;
    }

    finish(): void {
        if (!this.finished){        
            this.finished = true;
            this.parent.update_pos();
        }
    }

    // @ts-ignore
    * delta_x(): DeltaGen {
        console.log("Move DX")
        while(this.x_walk.length > 0) {
            yield this.x_walk.shift();
        }
        this.finish();
    }

    // @ts-ignore
    * delta_y(): DeltaGen {
        while(this.y_walk.length > 0) {
            yield this.y_walk.shift();
        }
        this.finish();
    }

    // @ts-ignore
    * delta_s(): DeltaGen {
        while(!this.finished) {
            yield 1;
        }
        this.finish();
    }
}

export class Bump implements IAnimation { 
    x_walk: Array<number>;
    y_walk: Array<number>;
    finished: boolean;

    constructor(
        dx:number, dy: number, duration: number
    ) {
        this.x_walk = [ ...Array(Math.round(duration/2)).keys() ].map( i => (i)*dx*size/duration*2);
        this.x_walk.push(...this.x_walk.slice().reverse());
        this.y_walk = [ ...Array(Math.round(duration/2)).keys() ].map( i => (i)*dy*size/duration*2);
        this.y_walk.push(...this.y_walk.slice().reverse());
        this.finished = false;
    }

    finish(): void {
        if (!this.finished){        
            this.finished = true;
        }
    }

    // @ts-ignore
    * delta_x(): DeltaGen {
        console.log("Move DX")
        while(this.x_walk.length > 0) {
            yield this.x_walk.shift();
        }
        this.finish();
    }

    // @ts-ignore
    * delta_y(): DeltaGen {
        while(this.y_walk.length > 0) {
            yield this.y_walk.shift();
        }
        this.finish();
    }

    // @ts-ignore
    * delta_s(): DeltaGen {
        while(!this.finished) {
            yield 1;
        }
        this.finish();
    }
}

// NOTE: TS Mixins are some sicko stuff.
type Animatable = ConstrainedMixinable<ILocatable>;
function Animate<TBase extends Animatable>(
    Base: TBase, BaseAnimation: new(parent: AbstractDisplay<ILocatable>) => BaseAnimation
){
    return class Animated extends Base {  
        // @ts-ignore
        _animation: BaseAnimation = new BaseAnimation(this);
        delta_x: DeltaGen = this._animation.delta_x();
        delta_y: DeltaGen = this._animation.delta_y();
        delta_s: DeltaGen = this._animation.delta_s();

        interrupt_animation(animation: IAnimation) {
            this.delta_x.next(animation.delta_x());
            this.delta_y.next(animation.delta_y());
            this.delta_s.next(animation.delta_s());
        }

        get xOffset(): number {
            // @ts-ignore possible generator termination
            return this._xOffset + this.delta_x.next().value;
        }

        get yOffset(): number {
            // @ts-ignore possible generator termination
            return this._yOffset + this.delta_y.next().value;
        }

        get size(): number {
            // @ts-ignore possible generator termination
            return this._size * this.delta_s.next().value;
        }


    }
}

export class AbstractVisual {
    constructor() {
    }

    display(context: CanvasRenderingContext2D) {
    }
}

export class LinearVisual {
    from: ILocatable;
    to: ILocatable;

    constructor(from: ILocatable, to: ILocatable) {
        this.from = from;
        this.to = to;    
    }

    display(context: CanvasRenderingContext2D) {
        this.render(context, 'indianred')
    }

    render(context: CanvasRenderingContext2D, clr: string) {
        var from = this.from;
        var to = this.to;
        // @ts-ignore
        var adj_from = from.size * 0.5;
        // @ts-ignore
        var adj_to = to.size * 0.5;
        var x_from = from.xOffset + adj_from;
        var y_from = from.yOffset + adj_from;
        var x_to = to.xOffset + adj_to;
        var y_to = to.yOffset + adj_to;
        makeLine(
            x_from, y_from, x_to, y_to,
            context, 10, clr)
    }
}

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
        // TODO: Safe update if animation fails. Offset Also a delegated gen, not just delta?
        // this.update_pos();
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

export class GridLocationDisplay extends AbstractDisplay<GridLocation> implements ILocatable {
    selectable: GridLocation;
    _xOffset: number;
    _yOffset: number;
    _size: number;
    width: number;
    height: number;

    constructor(loc: GridLocation) {
        super(loc);
        this._xOffset = this.selectable.x * size + 0.1 * size;
        this._yOffset = this.selectable.y * size + 0.1 * size;
        this._size = size * 0.8;
        this.width = size * 0.8;
        this.height = size * 0.8;
    }

    get xOffset(): number {
        return this._xOffset;
    }

    get yOffset(): number {
        return this._yOffset;
    }

    get size(): number {
        return this._size;
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


class _UnitDisplay extends AbstractDisplay<Unit> implements ILocatable{
    selectable: Unit;
    _xOffset: number;
    _yOffset: number;
    _size: number;
    width: number;
    height: number;

    constructor(unit: Unit) {
        super(unit);
        this.update_pos();
    }

    get xOffset(): number {
        return this._xOffset;
    }

    get yOffset(): number {
        return this._yOffset;
    }

    get size(): number {
        return this._size;
    }

    update_pos() {
        this._xOffset = this.selectable.loc.x * size + 0.2 * size;
        this._yOffset = this.selectable.loc.y * size + 0.2 * size;
        this._size = size * 0.6;
        this.width = size * 0.6;
        this.height = size * 0.6;
    }

    render(context: CanvasRenderingContext2D, clr: string) {
        var unit: Unit = this.selectable;
        var unit_transparency = 0.2 + 0.8 * unit.hp / unit.max_hp;
        makeSquare(this.xOffset, this.yOffset, context, this.size, clr, unit_transparency);
    }

    alt_render(context: CanvasRenderingContext2D, clr: string) {
        var offset = 0.2 * this.size;
        makeSquare(this.xOffset + offset, this.yOffset + offset, context, this.size*.6, clr);
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

export const UnitDisplay = Animate(_UnitDisplay, CircleInPlace);
// export const UnitDisplay = Animate(_UnitDisplay, new Flinch(100, 0, 1000));
// export const UnitDisplay = Animate(_UnitDisplay, new Flinch(0, 0, 0));

export class MenuElementDisplay extends AbstractDisplay<IMenuable> {
    selectable: IMenuable;
    parent: ILocatable;
    size: number;
    width: number;
    height: number;
    
    constructor(selectable: IMenuable, parent: ILocatable) {
        super(selectable);
        this.parent = parent;
        this.size = size*0.4;
        this.width = this.selectable.text.length*0.5*this.size + 0.2*this.size,
        this.height = this.size;
    }

    get xOffset() {
        return this.parent._xOffset;
    }

    get yOffset() {
        return this.parent._yOffset + this.size * this.selectable.index;
    }


    render(context: CanvasRenderingContext2D, clr: string) {
        makeRect(
            this.xOffset, 
            this.yOffset, 
            context, 
            this.width,
            this.height, 
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