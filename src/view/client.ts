/* Imports */
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { getMousePos } from "./input";
import { GridLocation, GridSpace } from "../model/space";
import { GridLocationDisplay } from "./display";

/* Generic setup */
const k = 4;
const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");
const grid_space = new GridSpace(k, k);
// TODO: i, j => x, y? or y, x?
for (var i = 0; i < grid_space.locs.length; i++) {
    var grid_row = grid_space.locs[i];
    for (var j = 0; j < grid_row.length; j++) {
        var grid_loc = grid_row[j];
        var grid_display = new GridLocationDisplay(grid_loc);
        grid_display.display(context);
    }
}