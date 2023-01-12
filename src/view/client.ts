/* Imports */
import { makeCanvas, View2D, View2DPseudoZ } from "./rendering";
import { DisplayHandler } from "./display_handler";
import { View3D } from "./rendering_three";
import { Canvas2DBroker, ThreeBroker } from "./broker";
import { editor_setup } from "../examples/editor/editor_setup";

export const TICK_DURATION_MS = 33

enum GameType {
    Editor = 0,
}

var game_type = (
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

if (game_type == GameType.Editor) {
    // NOTE: Await first click to start.
    create_start_button(editor_setup);
}


