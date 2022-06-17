import { RelativeGridCoordinate, ILocation, RelativeCoordinateOperator, RelativeNeighborhood, AbstractSpace, GridLocation, GridCoordinate } from "../model/space";

// RelativeNeighborhood
export const LINE_ADJACENCY = [
    RelativeGridCoordinate.from_xyz(1),
    RelativeGridCoordinate.from_xyz(-1),
]

export class LineSpace extends AbstractSpace {
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
        return this.locs[x];
    }

    to_array(): Array<GridLocation> {
        return new Array<GridLocation>(...this.locs);
    }
}