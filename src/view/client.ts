/* Imports */
import { makeCanvas, makeCircle, makeRect } from "./rendering";
import { DisplayHitListener, DisplayMap, getMousePos, SelectionBroker, setup_selection_broker } from "./input";
import { GridLocation, GridSpace } from "../model/space";
import { AbstractDisplay, DisplayState, GridLocationDisplay } from "./display";
import { ISelectable, Stack } from "../model/core";
import { async_input_getter, InputOptions, InputRequest, InputSelection } from "../model/input";
import { Action, BoardState, Effect } from "../model/state";
import { IPhase } from "../model/phase";
import { isConstructorDeclaration } from "typescript";

/* Generic setup */
const k = 4;
const size = 100;
const canvas = makeCanvas(k * 100, k * size, true);
const context = canvas.getContext("2d");
const grid_space = new GridSpace(k, k);


// narrowed from ISelectable to GridLocation
var display_map = new Map<ISelectable, AbstractDisplay<ISelectable>>();
var loc_listeners = new Array<DisplayHitListener<ISelectable>>();

for (let grid_row of grid_space.locs) {
    for (let grid_loc of grid_row) {
        let grid_display = new GridLocationDisplay(grid_loc);
        display_map.set(grid_loc, grid_display);
        grid_display.display(context);
    }
}

for (let grid_row of grid_space.locs) {
    for (let grid_loc of grid_row) {
        let grid_display = display_map.get(grid_loc);
        loc_listeners.push(grid_display.createPreviewListener(context.canvas));
        loc_listeners.push(grid_display.createClickListener(context.canvas));
    }
}

var selection_broker = new SelectionBroker<ISelectable>(loc_listeners);
// TODO: Error with unset handlers - dummies for now.
selection_broker.setPromiseHandlers(()=>{}, ()=>{});

function refreshDisplay(grid_space: GridSpace, display_map: DisplayMap<ISelectable>){
    for (let grid_row of grid_space.locs) {
        for (let grid_loc of grid_row) {
            var grid_display = display_map.get(grid_loc);
            grid_display.display(context);
        }
    }
}

function addCanvasListeners(
    context: CanvasRenderingContext2D, 
    grid_space: GridSpace, 
    display_map: DisplayMap<ISelectable>,
) {
    context.canvas.onclick = function (event) {
        selection_broker.onclick(event);
        refreshDisplay(grid_space, display_map);
    }
    context.canvas.onmousemove = function (event) {
        selection_broker.onmousemove(event);
        refreshDisplay(grid_space, display_map);
    }
}

addCanvasListeners(context, grid_space, display_map);


var brokered_selection_fn = setup_selection_broker(selection_broker, display_map, canvas);
var input_request = async_input_getter(brokered_selection_fn);

var increment_fn = (loc_stack: Stack<GridLocation>): Array<GridLocation> => {
    var options = grid_space.getGridNeighborhood(loc_stack.value);
    return options;
};
var termination_fn = (loc_stack: Stack<GridLocation>): boolean => {
    return loc_stack.depth >= 4;
}
var digest_fn = (nums: Array<GridLocation>): Array<Effect<BoardState>> => {
    function effect(state: BoardState): BoardState {
        return state;
    };
    // Reconsider callable.
    effect.description = null;
    effect.pre_effect = null;
    effect.post_effect = null;
    return [effect];
}
var root_stack = new Stack<GridLocation>(grid_space.get(0, 0));
var action = new Action(increment_fn, termination_fn, digest_fn);

// --- Phase-based ---
// TODO: 1 major error
// call to `to_array` on undefined in `run_subphase` on return call.
// Occurs on click after a "repeat" click at any point in sequence.
export class PathOnlyPhase implements IPhase {
    * run_phase(
        action: Action<ISelectable>, root_stack: Stack<ISelectable>
    ): Generator<InputOptions<ISelectable>, void, InputSelection<ISelectable>> {
        var effects = yield *this.run_subphase(action, root_stack);
    }

    * run_subphase (
        action: Action<ISelectable>, root_stack: Stack<ISelectable>
    ): Generator<InputOptions<ISelectable>, Array<Effect<BoardState>>, InputSelection<ISelectable>> {
        // TODO: Weird to "smuggle" final stack selection via final return. Evaluate effect in Action?
        // @ts-ignore Expects Stack - here and other places InputSelection was a reach.
        var effects = yield *action.input_option_generator(root_stack);
        return effects;
    }
}

class PathOnlyDisplayHander {
    display_map: DisplayMap<ISelectable>;
    prev_selection: Stack<ISelectable>;

    constructor(display_map: DisplayMap<ISelectable>){
        this.display_map = display_map;
        this.prev_selection = null;
    }

    on_selection(selection: Stack<ISelectable>) {
        // TODO: Queue State Clearing is incorrect.
        // Erase old selection_state;
        if(this.prev_selection){
            do {
                console.log(this.prev_selection.value)
                var loc = this.prev_selection.value;
                var display = this.display_map.get(loc);
                display.selection_state = DisplayState.Neutral;
                this.prev_selection = this.prev_selection.parent;
            } while(this.prev_selection);
        }
        // Add new selection_state;
        if (selection) {
            do {
                console.log("sel : ", selection)
                var loc = selection.value;
                var display = this.display_map.get(loc);
                display.selection_state = DisplayState.Queue;
                selection = selection.parent;
            } while(selection);
        }
        this.prev_selection = selection;
        refreshDisplay(grid_space, this.display_map);
    }
}

// TODO: I have typed too many damn things.
export async function path_only_input_bridge(
    phase: PathOnlyPhase, 
    action: Action<ISelectable>, 
    root_stack: Stack<ISelectable>, 
    input_requests: Array<InputRequest<ISelectable>>, 
    display_handler: PathOnlyDisplayHander,
) {
    var [location_request] = input_requests;
    var phase_runner = phase.run_phase(action, root_stack);
    var input_options = phase_runner.next().value;
    while(input_options){
        var input_selection = await location_request(input_options);
        // @ts-ignore input_options potentially overbroad (ISelectable) here?
        display_handler.on_selection(input_selection);
        input_options = phase_runner.next(input_selection).value;
    }
}

var pop = new PathOnlyPhase();
var display_handler = new PathOnlyDisplayHander(display_map);
path_only_input_bridge(pop, action, root_stack, [input_request], display_handler)