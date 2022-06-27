import { RelativeGridCoordinate, ILocation, RelativeCoordinateOperator, RelativeNeighborhood, AbstractSpace, GridLocation, GridCoordinate, Vector } from "../model/space";

// RelativeNeighborhood
export const LINE_ADJACENCY = [
    RelativeGridCoordinate.from_xyz(1, 0),
    RelativeGridCoordinate.from_xyz(-1, 0),
]

export class LineSpace extends AbstractSpace<GridLocation> {
    l: number;
    locs: GridLocation[];

    constructor(l: number) {
        super();
        this.l = l;
        this.locs = [];
        for (var x = 0; x < l; x++){
            this.locs.push(GridLocation.from_xyz(x, 0));
        }
    }

    get(co: GridCoordinate): GridLocation {
        var {x} = co;
        if (x >= 0 && x < this.l) {
            return this.locs[x];
        }
        else {
            return null;
        }
    }

    getNaturalNeighborhood(loc: GridLocation): Array<GridLocation> {
        return this.getNeighborhood(loc, LINE_ADJACENCY);
    }

    getVector(loc: GridLocation, other_loc: GridLocation): Vector {
        // TODO: Get rid of y coordinate; needed right now for display
        return {x: other_loc.x - loc.x, y: 0};
    }

    to_array(): Array<GridLocation> {
        return new Array<GridLocation>(...this.locs);
    }
}

// RelativeNeighborhood
export const PLANE_ADJACENCY = [
    RelativeGridCoordinate.from_xyz(0, 1),
    RelativeGridCoordinate.from_xyz(1, 0),
    RelativeGridCoordinate.from_xyz(0, -1),
    RelativeGridCoordinate.from_xyz(-1, 0),
]

export class PlaneSpace extends AbstractSpace<GridLocation> {
    h: number;
    w: number;
    locs: GridLocation[][]; // | GridLocation[][][] // use ndarrays? https://github.com/scijs/ndarray
    
    constructor(h: number, w: number){
        super();
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

    getNaturalNeighborhood(loc: GridLocation): Array<GridLocation> {
        return this.getNeighborhood(loc, PLANE_ADJACENCY);
    }

    getVector(loc: GridLocation, other_loc: GridLocation): Vector {
        return {x: other_loc.x - loc.x, y: other_loc.y - loc.y};
    }

    to_array(): Array<GridLocation> {
        return this.locs.flat(); // Default depth=1 sufficient.
    }
}

// RelativeNeighborhood - Any adjacent square, plus a jump or drop of up to 1.
export const VOLUME_ADJACENCY = [
    RelativeGridCoordinate.from_xyz(0, 1, -1),
    RelativeGridCoordinate.from_xyz(0, 1, 0),
    RelativeGridCoordinate.from_xyz(0, 1, 1),
    RelativeGridCoordinate.from_xyz(1, 0, -1),
    RelativeGridCoordinate.from_xyz(1, 0, 0),
    RelativeGridCoordinate.from_xyz(1, 0, 1),
    RelativeGridCoordinate.from_xyz(0, -1, -1),
    RelativeGridCoordinate.from_xyz(0, -1, 0),
    RelativeGridCoordinate.from_xyz(0, -1, 1),
    RelativeGridCoordinate.from_xyz(-1, 0, -1),
    RelativeGridCoordinate.from_xyz(-1, 0, 0),
    RelativeGridCoordinate.from_xyz(-1, 0, 1),
]

export class VolumeSpace extends AbstractSpace<GridLocation> {
    d: number;
    h: number;
    w: number;
    locs: GridLocation[][][]; // | GridLocation[][][] // use ndarrays? https://github.com/scijs/ndarray
    
    constructor(h: number, w: number, d: number){
        super();
        this.locs = [];
        for (var x = 0; x < h; x++){
            var plane = []
            for (var y = 0; y < w; y++){
                var row = [];
                for (var z = 0; z < d; z++) {
                    row.push(GridLocation.from_xyz(x, y, z));
                }
                plane.push(row);
            }
            this.locs.push(plane);
        }
        this.d = d;
        this.h = h;
        this.w = w;
    }

    get(co: GridCoordinate): GridLocation | null {
        var {x, y, z} = co;
        if (
            (x >= 0 && x < this.h) && 
            (y >= 0 && y < this.w) && 
            (z >= 0 && z < this.d)
        ) {
            return this.locs[x][y][z];
        } else {
            return null;
        }
    }

    getNaturalNeighborhood(loc: GridLocation): Array<GridLocation> {
        return this.getNeighborhood(loc, VOLUME_ADJACENCY);
    }

    getVector(loc: GridLocation, other_loc: GridLocation): Vector {
        return {x: other_loc.x - loc.x, y: other_loc.y - loc.y, z: other_loc.z - loc.z};
    }

    to_array(): Array<GridLocation> {
        return this.locs.flat(3); // Default depth=1 sufficient.
    }
}