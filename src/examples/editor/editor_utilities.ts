import { editor_state_setup } from "./editor_setup";
import { EditorState } from "./editor_state";

// From MDN docs: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API#examples
const pickerOpts = {
  multiple: false
};

async function getTheFile(window: Window) {
  // open file picker
  var [fileHandle] = await window.showOpenFilePicker(pickerOpts);

  // get file contents
  const fileData = await fileHandle.getFile();
  return fileData;
}


async function saveFile(window: Window, blob: Blob) {

  // create a new handle
  const newHandle = await window.showSaveFilePicker();

  // create a FileSystemWritableFileStream to write to
  const writableStream = await newHandle.createWritable();

  // write our file
  await writableStream.write(blob);

  // close the file and write the contents to disk.
  await writableStream.close();
}

export function save_editor_state(window: Window) {
  // Serialize the state of an EditorState object so it can be reloaded.
  // Open the user's file browser and save to a file.
  var data = JSON.stringify({});
  var blob = new Blob([data], {type: 'application/json'});
  saveFile(window, blob);
}

export function load_editor_state(window: Window, onload_callback: (editor_state: EditorState) => void) {
  // Load a previously saved EditorState object.
  var loaded_data = getTheFile(window).then((fileData) => {
    console.log(fileData)
    console.log(onload_callback)
    // var editor_state = EditorState.from_json(loaded_json)
    var editor_state = editor_state_setup(6);
    onload_callback(editor_state);
  });
}