import { EffectKernel, AbstractEffect } from "../../model/effect";
import { Entity } from "../../model/entity";
import { GridLocation, Vector } from "../../model/space";
import { ChainableMove } from "../../view/animation";
import { DisplayHandler } from "../../view/display_handler";
import { EditorState } from "./editor_state";


const STEP = new Audio('/assets/sound_effects/footstep.wav');
const SCRAPE = new Audio('/assets/sound_effects/wood_scrape.mp3');
// TODO: Move into setup?
const DURATION_MS = 300;



// TODO: No Kernel
export class ToggleLocationEffect extends AbstractEffect {
    loc: GridLocation;
    description: string;

    constructor(loc: GridLocation) {
        super();
        this.loc = loc;
        this.description = "Toggle terrain at a location.";
    }

    execute(state: EditorState): EditorState {
        state.space.toggle(this.loc);
        return state;
    }

    animate(state: EditorState, display_handler: DisplayHandler) {   
    }

    play_sound() {
    }
}

// TODO: Factor this and other Moves into BaseMoveEffect
export class ElementMoveEffect extends AbstractEffect {
    source: Player;
    loc: GridLocation;

    kernel: EditorMoveKernel;
    description: string;

    constructor(source: Player, loc: GridLocation) {
        super();
        this.source = source;
        this.loc = loc;
        this.kernel = new EditorMoveKernel(source, loc);
        this.description = "Move Player to new Location";
    }

    execute(state: EditorState): EditorState {
        return this.kernel.execute(state);
    }

    animate(state: EditorState, display_handler: DisplayHandler) {   
        var source = this.source;
        var loc = this.loc;
        var vector: Vector = state.space.getVector(source.loc, loc);
        console.log("Vector: ", vector)
        // TODO: Avoid coercion or do it differently?
        var source_display = display_handler.display_map.get(source) as PlayerDisplay;
        var on_gen_finish = () => {
            source_display.update_pos();
            this.play_sound();
        }
        var animation = new ChainableMove(vector, DURATION_MS, on_gen_finish);
        // TODO: UpdatePos
        console.log("Interrupt")
        source_display.interrupt_chainable_animation(animation)
        // TODO: Play on animation completion
    }

    play_sound() {
        console.log("PLAYING SOUND");
        STEP.load();
        STEP.play();
    }
}