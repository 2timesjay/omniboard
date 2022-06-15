enum RelativeCoordinateOperator {
    BASE,
    OR,
    // REPEAT,
    // CONCAT,
    // CONDITIONAL,
}

// Replace with class-based approach. Operators and subclassing.
class RelativeCoordinate {
    type: RelativeCoordinateOperator;
    value: Vector;
    children: Array<RelativeCoordinate>;

    constructor(
        x: number, 
        y: number, 
        z?: number | null, 
        type?: RelativeCoordinateOperator | null, 
        children?: Array<RelativeCoordinate> | null
    ) {
        this.value = {x: x, y: y, z: z};
        this.type = this.type ? type : RelativeCoordinateOperator.BASE;
        this.children = this.children ? children : [];
    }
};

type RelativeNeighborhood = Array<RelativeCoordinate>;

// RelativeNeighborhood
export const GRID_ADJACENCY = [
    new RelativeCoordinate(0, 1),
    new RelativeCoordinate(1, 0),
    new RelativeCoordinate(0, -1),
    new RelativeCoordinate(-1, 0),
]

interface ILocation {}

interface IDiscreteLocation extends ILocation {}

// TODO: Quick and dirty: expand use?
export interface Vector {
    x: number;
    y: number;
    z?: number;
}

export class GridLocation implements IDiscreteLocation {
    x: number;
    y: number;
    z?: number;

    dim: number;

    traversable: boolean;

    constructor(x: number, y: number, z?: number){
        this.x = x;
        this.y = y;
        if (z) {
            this.z = z;
            this.dim = 3;
        }
        else { 
            this.dim = 2;
        }
        this.traversable = true;
    };
}

export class GridSpace {
    h: number;
    w: number;
    locs: GridLocation[][]; // | GridLocation[][][] // use ndarrays? https://github.com/scijs/ndarray

    constructor(h: number, w: number){
        this.locs = [];
        for (var x = 0; x < h; x++){
            var row = [];
            for (var y = 0; y < w; y++){
                row.push(new GridLocation(x, y));
            }
            this.locs.push(row);
        }
        this.h = h;
        this.w = w;
    }

    get(x: number, y: number): GridLocation | null {
        if ((x >= 0 && x < this.h) && (y >= 0 && y < this.w)) {
            return this.locs[x][y];
        } else {
            return null;
        }
    }

    getRelativeCoordinate(loc: GridLocation, rel_co: RelativeCoordinate): Array<GridLocation> {
        var nh = new Array<GridLocation>();
        if (rel_co.type == RelativeCoordinateOperator.BASE) {
            var ne = this.get(loc.x + rel_co.value.x, loc.y + rel_co.value.y);
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
    getSimpleRelativeCoordinate(loc: GridLocation, vector: Vector): GridLocation {
        var rel_co = new RelativeCoordinate(
            vector.x, vector.y, vector.z, 
            RelativeCoordinateOperator.BASE,
        );
        var nh = this.getRelativeCoordinate(loc, rel_co);
        if (nh.length == 1) { 
            return nh[0];
        } else {
            return null;
        }
    }

    getNeighborhood(loc: GridLocation, rel_ne: RelativeNeighborhood): Array<GridLocation> {
        return rel_ne.flatMap((rel_co) => this.getRelativeCoordinate(loc, rel_co));
    }

    getGridNeighborhood(loc: GridLocation): Array<GridLocation> {
        return this.getNeighborhood(loc, GRID_ADJACENCY);
    }

    getVector(loc: GridLocation, other_loc: GridLocation): Vector {
        return {x: other_loc.x - loc.x, y: other_loc.y - loc.y};
    }

    getDistance(loc: GridLocation, other_loc: GridLocation): number {
        var {x, y} = this.getVector(loc, other_loc);
        return Math.abs(loc.x - other_loc.x) + Math.abs(loc.y - other_loc.y);
    }

    to_array(): Array<GridLocation> {
        return this.locs.flat(); // Default depth=1 sufficient.
    }
}