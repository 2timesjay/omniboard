/* Imports */
import { editor_setup } from "../examples/editor/editor_setup";
import { EditorState } from "../examples/editor/editor_state";
import { save_editor_state, load_editor_state } from "../examples/editor/editor_utilities";

export const TICK_DURATION_MS = 33

enum GameType {
    Editor = 0,
}

var game_type = (
    GameType.Editor
)

function create_start_button(setup_fn: () => void, arg?: object) {
    var start_button = document.createElement("button")
    start_button.innerHTML = "Click to Start"
    document.body.appendChild(start_button)
    start_button.addEventListener("click", function() {
        // @ts-ignore fix with EditorWatcher type
        setup_fn(undefined, arg)
        start_button.remove()
    }, {once : true});
}

function create_save_button(
    save_fn: (window: Window, editor_state_retriever: () => EditorState) => void, 
    editor_state_retriever: () => EditorState
) {
    var save_button = document.createElement("button")
    save_button.innerHTML = "Save"
    document.body.appendChild(save_button)
    save_button.addEventListener("click", function() {
        save_fn(window, editor_state_retriever)
    }, {once : true});
}

type StateLoadCallback = (editor_state: EditorState) => void;

function create_load_button(
    load_fn: (window: Window, onload_callback: StateLoadCallback) => void, 
    onload_callback: StateLoadCallback
) {
    var load_button = document.createElement("button")
    load_button.innerHTML = "Load"
    document.body.appendChild(load_button)
    load_button.addEventListener("click", function() {
        load_fn(window, onload_callback)
    }, {once : true});
}

if (game_type == GameType.Editor) {
    // Set up some utility buttons
    // @ts-ignore fix with EditorWatcher type
    create_save_button(save_editor_state, () => { return editor_watcher.editor_state});
    var editor_watcher = {};
    var onload_callback = (editor_state: EditorState) => {
        editor_setup(editor_state);
    }
    create_load_button(load_editor_state, onload_callback);
    // NOTE: Await first click to start.
    create_start_button(editor_setup, editor_watcher);
}


