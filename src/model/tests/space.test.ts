import * as test from "tape";
import {GridLocation, GridSpace} from "../space";

test("GridLocation Test", (t) => {
    var grid_loc = GridLocation.from_xyz(1, 2);
    t.equal(grid_loc.x, 1);
    t.equal(grid_loc.y, 2);
    t.equal(grid_loc.z, undefined);
    
    var grid_loc = GridLocation.from_xyz(1, 2, 3);
    t.equal(grid_loc.x, 1);
    t.equal(grid_loc.y, 2);
    t.equal(grid_loc.z, 3);
    t.end();
})

test("GridSpace test", (t) => {
    var grid_space = new GridSpace(4, 4);
    var grid_loc = grid_space.get({x: 2, y: 3});
    t.equal(grid_loc, grid_space.locs[2][3]);
    t.equal(grid_loc.x, 2);
    t.equal(grid_loc.y, 3);
    var neighbors = grid_space.getGridNeighborhood(grid_loc);
    t.equal(neighbors.length, 3);
    console.log(neighbors);
    t.end();
})