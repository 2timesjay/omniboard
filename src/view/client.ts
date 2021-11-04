/* Imports */
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { getMousePos } from "./input";

/* Generic setup */
const k = 4;
const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");

makeRect(0, 0, context, 100, "black", 1.0);