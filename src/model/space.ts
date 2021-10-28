// types = require("./types.ts");
// import {Neighborhood} from "./types"


enum RelativeCoordinateOperator {
    BASE,
    REPEAT,
    CONCAT,
    OR,
}

class RelativeCoordinate {
    root: RelativeCoordinateOperator;
    value: number[];
    children: Array<RelativeCoordinate>;
};

type RelativeNeighborhood = Array<RelativeCoordinate>

interface ILocation {}

type Neighborhood = Array<ILocation>;

interface IDiscreteLocation extends ILocation {}

export class GridLocation implements IDiscreteLocation {
    x: number;
    y: number;
    z: number;

    dim: number;

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
    locs: GridLocation[][] // | GridLocation[][][] // use ndarrays? https://github.com/scijs/ndarray



    getNeighborhood(rel_ne: RelativeNeighborhood, loc: GridLocation): Neighborhood {
        return Array<GridLocation>();
    }
}

// module.exports = {
//     GridLocation: GridLocation,
//     GridSpace: GridSpace, 
// };