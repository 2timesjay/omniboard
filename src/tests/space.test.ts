import * as test from "tape";
import {GridLocation} from "../model/space";

test("GridLocation Test", (t) => {
    var grid_loc = new GridLocation(1, 2);
    t.equal(grid_loc.x, 1);
    t.equal(grid_loc.y, 2);
    t.equal(grid_loc.z, undefined);
    t.equal(grid_loc.dim, 2);
    
    var grid_loc = new GridLocation(1, 2, 3);
    t.equal(grid_loc.x, 1);
    t.equal(grid_loc.y, 2);
    t.equal(grid_loc.z, 3);
    t.equal(grid_loc.dim, 3);
    t.end();
})