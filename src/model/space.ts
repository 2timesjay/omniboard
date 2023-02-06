import { Vector3 } from "../common/structures";
import { ISerializable } from "./core";

export interface ICoordinate { }

export interface DiscreteCoordinate extends ICoordinate { }

export interface GridCoordinate {
    x: number,
    // x?: number | null;
    y?: number | null;
    z?: number | null;
}

export enum RelativeCoordinateOperator {
    BASE,
    OR,
    // REPEAT,
    // CONCAT,
    // CONDITIONAL,
}

export class RelativeCoordinate<T extends ICoordinate>{
    type: RelativeCoordinateOperator;
    vec: T; // TODO: should actually be vector<T>; Vector = Vector<GridCoordinate>. Messy
    children: Array<RelativeGridCoordinate>;

    constructor(
        vec: T,
        type?: RelativeCoordinateOperator | null, 
        children?: Array<RelativeGridCoordinate> | null
    ) {
        this.vec = vec;
        this.type = this.type ? type : RelativeCoordinateOperator.BASE;
        this.children = this.children ? children : [];
    }

    add_to(co: T): T {
        throw new Error('Method not implemented.');
    }
};

export class RelativeGridCoordinate extends RelativeCoordinate<GridCoordinate> {
    static from_xyz(
        x?: number | null, 
        y?: number | null, 
        z?: number | null, 
        type?: RelativeCoordinateOperator | null, 
        children?: Array<RelativeGridCoordinate> | null
    ): RelativeGridCoordinate {
        var vec = {x: x, y: y, z: z};
        return new RelativeGridCoordinate(vec);
    }

    add_to(co: GridCoordinate): GridCoordinate {
        var new_x = co.x != null ? co.x + this.vec.x : null;
        var new_y = co.y != null ? co.y + this.vec.y : null;
        var new_z = co.z != null ? co.z + this.vec.z : null;
        return {x: new_x, y: new_y, z: new_z};
    }
}

export type RelativeNeighborhood<T> = Array<RelativeCoordinate<T>>;

// RelativeNeighborhood
export const GRID_ADJACENCY = [
    RelativeGridCoordinate.from_xyz(0, 1),
    RelativeGridCoordinate.from_xyz(1, 0),
    RelativeGridCoordinate.from_xyz(0, -1),
    RelativeGridCoordinate.from_xyz(-1, 0),
]

export interface ILocation {
    co: ICoordinate;
}

export interface IDiscreteLocation extends ILocation {
    co: DiscreteCoordinate;
}

export interface ISpace {
    getRelativeCoordinate: (loc: ILocation, rel_co: RelativeCoordinate<ICoordinate>) => Array<ILocation>;
    getNeighborhood: (loc: ILocation, rel_ne: RelativeNeighborhood<ICoordinate>) => Array<ILocation>;
    to_array: () => Array<ILocation>;
}

export class AbstractSpace<T extends ILocation> implements ISpace {

    constructor() {
    }

    get(co: ICoordinate): T {
        throw new Error('Method not implemented.');
    }

    getRelativeCoordinate(loc: T, rel_co: RelativeCoordinate<ICoordinate>): Array<T> {
        var nh = new Array<T>();
        if (rel_co.type == RelativeCoordinateOperator.BASE) {
            var ne = this.get(rel_co.add_to(loc.co));
            if (ne) {
                nh.push(ne);
            }
        } else if (rel_co.type == RelativeCoordinateOperator.OR) {
            var ne_list = rel_co.children.flatMap(
                (child) => this.getRelativeCoordinate(loc, child)
            );
            if (ne_list) {
                nh.push(...ne_list);
            }
        }
        return nh;
    }

    getNeighborhood(loc: T, rel_ne: RelativeNeighborhood<ICoordinate>): Array<T> {
        return rel_ne.flatMap((rel_co) => this.getRelativeCoordinate(loc, rel_co));
    }

    to_array(): Array<T> {
        throw new Error('Method not implemented.');
    }
}

export class GridLocation implements IDiscreteLocation, ISerializable {
    co: GridCoordinate;

    traversable: boolean;

    constructor(co: GridCoordinate){
        this.co = co;
        this.traversable = true;
    };
    
    static from_xyz(
        x?: number | null, 
        y?: number | null, 
        z?: number | null, 
    ): GridLocation {
        var co = {x: x, y: y, z: z};
        return new GridLocation(co);
    }

    get x(): number {
        return this.co.x;
    };

    get y(): number {
        return this.co.y;
    };

    get z(): number {
        return this.co.z;
    }

    serialize(): string {
        return JSON.stringify({
            "x": this.x, "y": this.y, "z": this.z,
            "traversable": this.traversable,
        });
    }

    static deserialize(serialized: string): GridLocation {
        var obj = JSON.parse(serialized);
        var loc = GridLocation.from_xyz(obj.x, obj.y, obj.z);
        loc.traversable = obj.traversable;
        return loc;
    }
}

/**
 * A 2-dimensional Grid
 */
export class GridSpace implements ISpace {
    h: number;
    w: number;
    locs: GridLocation[][]; // | GridLocation[][][] // use ndarrays? https://github.com/scijs/ndarray

    constructor(h: number, w: number){
        this.locs = [];
        for (var x = 0; x < h; x++){
            var row = [];
            for (var y = 0; y < w; y++){
                row.push(GridLocation.from_xyz(x, y));
            }
            this.locs.push(row);
        }
        this.h = h;
        this.w = w;
    }

    get(co: GridCoordinate): GridLocation | null {
        var {x, y} = co;
        if ((x >= 0 && x < this.h) && (y >= 0 && y < this.w)) {
            return this.locs[x][y];
        } else {
            return null;
        }
    }

    getRelativeCoordinate(loc: GridLocation, rel_co: RelativeGridCoordinate): Array<GridLocation> {
        var nh = new Array<GridLocation>();
        if (rel_co.type == RelativeCoordinateOperator.BASE) {
            var ne = this.get(rel_co.add_to(loc.co));
            if (ne) {
                nh.push(ne);
            }
        } else if (rel_co.type == RelativeCoordinateOperator.OR) {
            var ne_list = rel_co.children.flatMap(
                (child) => this.getRelativeCoordinate(loc, child)
            );
            if (ne_list) {
                nh.push(...ne_list);
            }
        }
        return nh;
    }
    
    // TODO: Optional return
    // TODO: Less dumb name
    getSimpleRelativeGridCoordinate(loc: GridLocation, vector: Vector3): GridLocation {
        var rel_co = new RelativeGridCoordinate(
            vector,
            RelativeCoordinateOperator.BASE,
        );
        var nh = this.getRelativeCoordinate(loc, rel_co);
        if (nh.length == 1) { 
            return nh[0];
        } else {
            return null;
        }
    }

    getNeighborhood(loc: GridLocation, rel_ne: RelativeNeighborhood<GridCoordinate>): Array<GridLocation> {
        return rel_ne.flatMap((rel_co) => this.getRelativeCoordinate(loc, rel_co));
    }

    getGridNeighborhood(loc: GridLocation): Array<GridLocation> {
        return this.getNeighborhood(loc, GRID_ADJACENCY);
    }

    getVector(loc: GridLocation, other_loc: GridLocation): Vector3 {
        return new Vector3(other_loc.x - loc.x, other_loc.y - loc.y);
    }

    getDistance(loc: GridLocation, other_loc: GridLocation): number {
        var {x, y} = this.getVector(loc, other_loc);
        return Math.abs(loc.x - other_loc.x) + Math.abs(loc.y - other_loc.y);
    }

    to_array(): Array<GridLocation> {
        return this.locs.flat(); // Default depth=1 sufficient.
    }
}