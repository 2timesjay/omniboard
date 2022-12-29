import { AbstractSpace, GridCoordinate, GridLocation, RelativeCoordinateOperator, RelativeGridCoordinate, Vector } from "../model/space";

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
    getSimpleRelativeGridCoordinate(loc: GridLocation, vector: Vector): GridLocation {
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

    // Toggle Whether a grid location is traversable or not.
    toggle(loc: GridLocation) {
        loc.traversable = !loc.traversable;
    }
}