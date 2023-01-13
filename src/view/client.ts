/* Imports */
import { editor_setup } from "../examples/editor/editor_setup";
import { save_editor_state, load_editor_state } from "../examples/editor/editor_utilities";

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
    start_button.addEventListener("click", function() {
        setup_fn()
        start_button.remove()
    }, {once : true});
}

function create_save_button(save_fn: (window: Window) => void) {
    var save_button = document.createElement("button")
    save_button.innerHTML = "Save"
    document.body.appendChild(save_button)
    save_button.addEventListener("click", function() {
        save_fn(window)
    }, {once : true});
}

function create_load_button(load_fn: (window: Window) => void) {
    var load_button = document.createElement("button")
    load_button.innerHTML = "Load"
    document.body.appendChild(load_button)
    load_button.addEventListener("click", function() {
        load_fn(window)
    }, {once : true});
}

if (game_type == GameType.Editor) {
    // Set up some utility buttons
    create_save_button(save_editor_state);
    create_load_button(load_editor_state);
    // NOTE: Await first click to start.
    create_start_button(editor_setup);
}


