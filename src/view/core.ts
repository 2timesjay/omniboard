import { Vector } from "../model/space";



// TODO: Handle math with nulls. SafeAdd, SafeMult, SafeSub

/**
 * Graphics Vectors
 * 
 * These are used to represent vectors for rendering, rather than corresponding to spatial units directly.
 * Keeping consistent with https://p5js.org/reference/#/p5.Vector
 */
 export class GraphicsVector {
    x?: number | null;
    y?: number | null;
    z?: number | null;
    constructor(x?: number, y?: number, z?: number) {
        this.x = x != null? x: 0;
        this.y = y != null? y: 0;
        this.z = z != null? z: 0;
    }

    static fromVector(vec: Vector): GraphicsVector {
        return new GraphicsVector(vec.x, vec.y, vec.z);
    }

    add(other: GraphicsVector): GraphicsVector {
        // Add other vector to this, handling null components
        var new_x = this.x != null ? this.x + other.x : null;
        var new_y = this.y != null ? this.y + other.y : null;
        var new_z = this.z != null ? this.z + other.z : null;
        return new GraphicsVector(new_x, new_y, new_z);
    }

    sub(other: GraphicsVector): GraphicsVector {
        // Subtract other vector from this, handling null components
        var new_x = this.x != null ? this.x - other.x : null;
        var new_y = this.y != null ? this.y - other.y : null;
        var new_z = this.z != null ? this.z - other.z : null;
        return new GraphicsVector(new_x, new_y, new_z);
    }

    mult(scalar: number): GraphicsVector {
        // Multiply this vector by a scalar, handling null components
        var new_x = this.x != null ? this.x * scalar : null;
        var new_y = this.y != null ? this.y * scalar : null;
        var new_z = this.z != null ? this.z * scalar : null;
        return new GraphicsVector(new_x, new_y, new_z);
    }
}
