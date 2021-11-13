import * as test from "tape";
import {GridLocation, GridSpace} from "../space";

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

test("GridSpace test", (t) => {
    var grid_space = new GridSpace(4, 4);
    var grid_loc = grid_space.locs[2][3];
    t.equal(grid_loc.x, 2);
    t.equal(grid_loc.y, 3);
    t.end();
})