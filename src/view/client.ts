/* Imports */
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { DisplayHitListener, getMousePos } from "./input";
import { GridLocation, GridSpace } from "../model/space";
import { AbstractDisplay, GridLocationDisplay } from "./display";
import { ISelectable } from "../model/core";

/* Generic setup */
const k = 4;
const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");
const grid_space = new GridSpace(k, k);

var display_map = new Map<ISelectable, AbstractDisplay>();
// TODO: Does this need to be narrower?
var loc_listeners = new Array<DisplayHitListener<ISelectable>>();

// TODO: i, j => x, y? or y, x? Or for...of...
for (let grid_row of grid_space.locs) {
    for (let grid_loc of grid_row) {
        var grid_display = new GridLocationDisplay(grid_loc);
        display_map.set(grid_loc, grid_display);
        loc_listeners.push(grid_display.createClickListener(context.canvas));
        grid_display.display(context);
    }
}