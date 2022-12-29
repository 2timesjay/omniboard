/* Imports */
import { makeCanvas, View2D, View2DPseudoZ } from "./rendering";
import { DisplayHandler } from "./display_handler";
import { View3D } from "./rendering_three";
import { DisplayHandler3D } from "./display_handler_three";
import { Canvas2DBroker, ThreeBroker } from "./broker";
import { editor_setup } from "../examples/editor/editor_setup";

export const TICK_DURATION_MS = 20

enum GameType {
    Tactics = 0,
    Playground2D = 1,
    Playground3D = 2,
    Cars3D = 3,
    SlidingPuzzle = 4,
    Climber = 5,
    Editor = 6,
}

var game_type = (
    // GameType.Tactics
    // GameType.Playground2D
    // GameType.Playground3D
    // GameType.Cars3D
    // GameType.SlidingPuzzle
    // GameType.Climber
    GameType.Editor
)

function create_start_button(setup_fn: () => void) {
    var start_button = document.createElement("button")
    start_button.innerHTML = "Click to Start"
    document.body.appendChild(start_button)
    window.addEventListener("click", function() {
        setup_fn()
        start_button.remove()
    }, {once : true});
}

// Dummy code to avoid type errors in switch check.
if (Math.random() > 1) {
    game_type += 1;
}

if (game_type == GameType.Editor) {
    // NOTE: Await first click to start.
    create_start_button(editor_setup);
}


