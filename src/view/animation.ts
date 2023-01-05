import { ISelectable } from "../model/core";
import { GraphicsVector } from "./core";
import { Vector} from "../model/space";
import { AbstractDisplay, ILocatable } from "./display";
import { BaseAutomation } from "../model/automation";


type AnimationFn = (f: number) => GraphicsVector;

// A Curve maps a number from 0 to 1 to a number from 0 to 1; used for animation easings.
type CurveFn = (t: number) => number;
type CurveTransform = (fn: CurveFn) => CurveFn;

const IDENTITY_CURVE = (t: number) => t;

/**
 * Animation
 * 
 * A simplified animation definition, a function that takes a time and returns a value.
 */
export class Animation {
    fn: AnimationFn
    curve: CurveFn;
    start_time: number;
    duration: number;
    cycle: boolean;
    perpetual: boolean;
    suspended: boolean;
    constructor(fn: AnimationFn, duration: number, cycle?: boolean, perpetual?: boolean) {
        this.duration = duration;
        this.fn = fn;
        this.curve = IDENTITY_CURVE;
        this.perpetual = perpetual != null ? perpetual : false;
        this.cycle = cycle != null ? cycle : false;
        this.suspended = false;
    }

    set_start_time(t?: number) {
        if (t == null) {
            t = + new Date();
        } else {
            this.start_time = t;
        }
    }

    get end_time(): number {
        return this.start_time + this.duration;
    }

    get offset(): GraphicsVector {
        var now = + new Date();
        var t = (now - this.start_time) / (this.duration);
        return this.fn(t);
    }

    is_finished(): boolean {
        return (+ new Date() > this.end_time) && !this.perpetual;
    }
    
    is_started(): boolean {
        return + new Date() > this.start_time;
    }

    is_running(): boolean {
        return this.is_started() && !this.is_finished();
    }
}

function interrupt_animation(animation: Animation) {
    var f = (+ new Date() - this.start_time) / (this.duration);
    if (!animation.cycle) {
        animation.duration = (1 - f) * animation.duration;
        animation.curve = (t: number) => f + (1 - f) * animation.curve(t);
    } else {
        animation.curve = (t: number) => animation.curve(f + t);
    }
}

/**
 * Animation Mixer
 * 
 * A class that takes a list of animations and mixes them together, according to ordering and overlaps.
 */
export class Mixer {
    animations: Array<Animation>;
    constructor(animations: Array<Animation>) {
        this.animations = animations;
    }

    add_animation(animation: Animation) {
        this.animations.push(animation);
    }

    queue_animation(animation: Animation) {
        // Queue animation; set start to the end time of the previous animation.
        if (this.animations.length >= 0) {
            var last_animation = this.animations[this.animations.length - 1];
            animation.set_start_time(last_animation.end_time);
        }
        else {
            animation.set_start_time(null);
        }
        this.animations.push(animation);
    }

    inject_animation(animation: Animation) {
        var animation_end_time = animation.end_time;
        for (let i = 0; i < this.animations.length; i++) {
            if (this.animations[i].is_running()) {
                interrupt_animation(this.animations[i]);
                this.animations[i].set_start_time(animation_end_time);
            }
        }
    }

    clear_finished() {
        this.animations = this.animations.filter((animation) => !animation.is_finished());
    }

    clear() {
        this.animations = [];
    }
    
    get offset(): GraphicsVector {
        var now = + new Date();
        // TODO: Fix implicit assumption of 3D graphics here.
        var base_offset = new GraphicsVector(0, 0, 0);
        for (let animation of this.animations) {
            if (animation.is_running()) {
                base_offset = base_offset.add(animation.offset);
            }
        }
        return base_offset;
    }
}


/**
 * Mixer-ready Animations
 */

// NOTE: TS Mixins are some sicko stuff.
export function Animate<TBase extends Animatable>(
    Base: TBase
){
    return class Animated extends Base {  
        // @ts-ignore
        mixer: Mixer;
        
        get animation_offset(): GraphicsVector {
            return this.mixer.offset;
        }

        // TODO: Optimize. Make display use single GraphicsVector for offset.
        get xOffset(): number {
            return super.xOffset + this.animation_offset.x;
        }

        get yOffset(): number {
            return super.yOffset + this.animation_offset.y;
        }

        get zOffset(): number {
            return super.zOffset + this.animation_offset.z;
        }

        get size(): number {
            // TODO: Add Size, other delta quantities.
            return super.size * 1;
        }
    }
}


/**
 * Older Animations
 */

const BaseAnimationFn = (t: number) => new GraphicsVector(0, 0, 0);

const CircleInPlaceAnimationFn = (t: number) => new GraphicsVector(0.01*Math.cos(t), 0.01*Math.sin(t), 0);

const JumpInPlaceAnimationFn = (t: number) => new GraphicsVector(0, -0.05*Math.abs(Math.sin(t)), 0);

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

// TODO: Not quite correct. Want a brownian bridge.
function buildWalk(steps: number, start: number, end: number, extra: number): Array<number> {
    var walk = new Array(steps);
    for (let i = 0; i < steps; i++) {
        walk[i] = start + (end - start) * i / steps;
    }
    shuffle(walk);
    return walk;
}

function buildVectorWalk(steps: number, start: GraphicsVector, end: GraphicsVector): AnimationFn {
    var x_walk = buildWalk(steps, start.x, end.x);
    var y_walk = buildWalk(steps, start.y, end.y);
    var z_walk = buildWalk(steps, start.z, end.z);
    function walk_map(t: number){ 
        var walk_index = Math.round(t*steps) - 1;
        new GraphicsVector(x_walk[walk_index], y_walk[walk_index], z_walk[walk_index]);
    }
    return walk_map;
}

// const FlinchFn
// const BumpFn
// const MoveFn