// types = require("./types.ts");
// import {Neighborhood} from "./types"


enum RelativeCoordinateOperator {
    BASE,
    // REPEAT,
    // CONCAT,
    OR,
}

// Replace with class-based approach. Operators and subclassing.
class RelativeCoordinate {
    type: RelativeCoordinateOperator;
    value: {
        x: number | null; 
        y: number | null; 
        z: number | null;
    };
    children: Array<RelativeCoordinate>;
};

type RelativeNeighborhood = Array<RelativeCoordinate>

interface ILocation {}

type Neighborhood = Array<ILocation>;

interface IDiscreteLocation extends ILocation {}

interface ILocationAttributes {}

export class GridLocation implements IDiscreteLocation {
    x: number;
    y: number;
    z: number;

    dim: number;

    attrs: ILocationAttributes;

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
    };
}

class GridSpace {
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

    get(x: number, y: number) {
        if ((x >= 0 && x < this.h) && (y >= 0 && y < this.w)) {
            return this.locs[x][y];
        } else {
            return null;
        }
    }

    getRelativeCoordinate(loc: GridLocation, rel_co: RelativeCoordinate): Neighborhood {
        var nh = new Array<GridLocation>();
        if (rel_co.type == RelativeCoordinateOperator.BASE) {
            var ne = this.get(loc.x + rel_co.value.x, loc.y + rel_co.value.y)
            nh.push(ne)
        } else if (rel_co.type == RelativeCoordinateOperator.OR) {
            rel_co.children.flatMap(
                (child) => {
                    this.getRelativeCoordinate(loc, child);
                }
            )
        }
        return nh;
    }

    getNeighborhood(loc: GridLocation, rel_ne: RelativeNeighborhood): Neighborhood {
        return rel_ne.flatMap((rel_co) => this.getRelativeCoordinate(loc, rel_co));
    }
}