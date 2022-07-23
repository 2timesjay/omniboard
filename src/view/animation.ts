import { ISelectable } from "../model/core";
import { Vector} from "../model/space";
import { AbstractDisplay, ILocatable } from "./display";


/**
 * Animations
 */

// Following https://www.typescriptlang.org/docs/handbook/mixins.html
type Mixinable = new (...args: any[]) => {};
type ConstrainedMixinable<T = {}> = new (...args: any[]) => T;

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
             var base_gen = base_gen_builder();
             var delegate_gen: DeltaGen = yield *base_gen;
             if (delegate_gen != null) {
                 yield *delegate_gen;
             }
         }
     }
 }
 
 export class BaseAnimation implements IAnimation {
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
             var gen = yield 0.01*Math.cos(Date.now()/100 + this.phase_shift);
             if (gen != null) {
                 return gen;
             }
         } 
     }
 
     * _delta_y(): DeltaGen {
         while(true){
             var gen = yield 0.01*Math.sin(Date.now()/100 + this.phase_shift);
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
 
 export class JumpInPlace extends BaseAnimation { 
     rand: number;
 
     * _delta_y(): DeltaGen {
         while(true){
             var gen = yield -0.05*Math.abs(Math.sin(Date.now()/500 + this.phase_shift));
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
     z_walk: Array<number>;
     finished: boolean;
     parent: AbstractDisplay<ISelectable> & ILocatable;
 
     constructor(
         v: Vector, duration: number, parent: AbstractDisplay<ISelectable> & ILocatable
     ) {
         var {x: dx, y: dy, z: dz} = v
         this.parent = parent;
         this.x_walk = [ ...Array(duration+1).keys() ].map( i => (i)*dx/duration);
         this.y_walk = [ ...Array(duration+1).keys() ].map( i => (i)*dy/duration);
         this.z_walk = [ ...Array(duration+1).keys() ].map( i => (i)*dz/duration);
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
     * delta_z(): DeltaGen {
         while(this.z_walk.length > 0) {
             yield this.z_walk.shift();
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
         this.x_walk = [ ...Array(Math.round(duration/2)).keys() ].map( i => (i)*dx/duration*2);
         this.x_walk.push(...this.x_walk.slice().reverse());
         this.y_walk = [ ...Array(Math.round(duration/2)).keys() ].map( i => (i)*dy/duration*2);
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
 export function Animate<TBase extends Animatable>(
     Base: TBase, Animation: new(parent: AbstractDisplay<ILocatable>) => IAnimation
 ){
     return class Animated extends Base {  
         // @ts-ignore
         _animation: IAnimation = new Animation(this);
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
             return super.xOffset + this.delta_x.next().value;
         }
 
         get yOffset(): number {
             // @ts-ignore possible generator termination
             return super.yOffset + this.delta_y.next().value;
         }
 
         get size(): number {
             // @ts-ignore possible generator termination
             return super.size * this.delta_s.next().value;
         }
 
 
     }
 }