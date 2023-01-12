import { clamp } from "three/src/math/MathUtils";
import { SelectionBroker } from "../../view/broker";
import { EditorDisplayHandler } from "./editor_display";

// TODO: Derive dim from state.
const DIM = 10

export class EditorSelectionBroker extends SelectionBroker {
    display_handler: EditorDisplayHandler;

    onKeyboardEvent (e: KeyboardEvent) {
        super.onKeyboardEvent(e);

        // explode X-axis
        const T = "KeyT";
        const Y = "KeyY";
        if (e.code == T) {
            this.display_handler.explode.x = clamp(this.display_handler.explode.x + 1, 0, DIM);
        }
        if (e.code == Y) {
            this.display_handler.explode.x = clamp(this.display_handler.explode.x - 1, 0, DIM);
        }

        // explode Y-axis
        const G = "KeyG";
        const H = "KeyH";
        if (e.code == G) {
            this.display_handler.explode.y = clamp(this.display_handler.explode.y + 1, 0, DIM);
        }
        if (e.code == H) {
            this.display_handler.explode.y = clamp(this.display_handler.explode.y - 1, 0, DIM);
        }

        // explode Z-axis
        const B = "KeyB";
        const N = "KeyN";
        if (e.code == B) {
            this.display_handler.explode.z = clamp(this.display_handler.explode.z + 1, 0, DIM)
        }
        if (e.code == N) {
            this.display_handler.explode.z = clamp(this.display_handler.explode.z - 1, 0, DIM)
        }
    }
}