// types = require("./types.ts");
import {GridSpace, GridLocation, Neighborhood, RelativeNeighborhood} from "./types"

class GridSpaceConcrete implements GridSpace {
    getNeighborhood(rel_ne: RelativeNeighborhood, loc: GridLocation): Neighborhood {
        return Array<GridLocation>();
    }
}