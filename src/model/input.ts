import { IMenuable } from "../view/display";
import { 
    bfs,
    IncrementFn,
    ISelectable, 
    OptionFn, 
    Stack,
    TerminationFn,
    Tree,
} from "./core";
import { IState } from "./state";
import { Awaited, Rejection } from "./utilities";

export type InputOptions<T extends ISelectable> = Array<T>;

export enum InputSignal {
    Confirm,
    Reject,
    Enter,
    Exit,
    DragStart,
    DragEnd,
}

export class InputResponse<T extends ISelectable> {
    selection: T;
    signal: InputSignal;

    constructor(selection: T, signal?: InputSignal) {
        this.selection = selection;
        // Confirm by default
        this.signal = (signal != null) ? signal : InputSignal.Confirm;
    }
};

export type PreviewMap<T extends ISelectable> = Map<T, Tree<T>>;

// https://stackoverflow.com/questions/58278652/generic-enum-type-guard
const isSomeEnum = <T>(e: T) => (token: any): token is T[keyof T] =>
    Object.values(e).includes(token as T[keyof T]);
export const isInputSignal = isSomeEnum(InputSignal);
// TODO: Type Guard for Stack
// export const isStack = (v) => v.contains()

/**
 * NOTE: Key type; from InputOptions generates asynchronous request for InputResponse.
 *   Bridge between InputState and user. 
 */
export type InputRequest<T extends ISelectable> = (
    input_options: InputOptions<T>
) => Promise<InputResponse<T>>;


/**
 * Mechanistic Callback/SelectionFn classes - about the "how" of InputFetching 
 *   not abstract interfaces.
 */
export type SelectionFn<T extends ISelectable> = (options: InputOptions<T>) => InputResponse<T>
// TODO: Pass preview_map directly instead of just options.
export type CallbackSelectionFn<T extends ISelectable> = (
    options: InputOptions<T>, resolve: Awaited<T>, reject: Rejection // Awaited from utilities. Replace in ts 4.5
) => void;

/**
 * synthetic/async_input_getter: InputRequest factories really.
 */
export function synthetic_input_getter<T extends ISelectable>(
    selection_fn: SelectionFn<T>
): InputRequest<T> {
    return async function get_input( 
        input_options: InputOptions<T>
    ): Promise<InputResponse<T>> {
        console.log("synthetic_input_getter options: ", input_options);
        if (input_options instanceof Array) {
            return selection_fn(input_options);
        }
    };
}

// Builds an async InputRequest. Explicitly constructs promise around selection_fn
export function async_input_getter<T extends ISelectable>(
    selection_fn: CallbackSelectionFn<T>
): InputRequest<T> {
    return async function get_input( 
        input_options: InputOptions<T>
    ): Promise<InputResponse<T>> {
        // TS analog to type guarding kind of.
        // Manually specify type to remove errors
        var selection_promise: Promise<T> = new Promise(
            function(resolve, reject) {
                selection_fn(input_options, resolve, reject)
            }
        );
        return selection_promise.then(
            function(selection) { 
                console.log("Resolve Selection: ", selection);
                return new InputResponse(selection);
            }
        ).catch(
            function() {
                // TODO: Replace with some kind of explicit signal?
                console.log("Reject Selection");
                return new InputResponse(null, InputSignal.Reject);
                // TODO: Use this v
                // return new InputResponse(null, InputSignal.Reject);
            }
        );
    };
}

export type SelectionGen<T> = Generator<InputOptions<T>, InputResponse<T>, InputResponse<T>>;

/**
 * Key Type; Closely related to InputRequest, but a generator version - takes
 * InputOptions and returns corresponding InputResponse type.
 */
// TODO: Refine and use everywhere
export type SelectionGenBuilder<T extends ISelectable> = (
    (base?: T) => SelectionGen<T>
)

// TODO: Move and maybe generate from selectables instead of creating singleton.
export class Confirmation implements ISelectable, IMenuable {
    index: number;
    text: string;

    constructor() {
        this.index = 1;
        this.text = "Confirm";
    }
}

/**
 * InputAcquirers: Generate repeated InputRequests, yielding intermediate InputResponses,
 *   until satisfying conditions are met for a final InputResponse to be returned. 
 *   `yield` vs. `return` distinguishes the two.
 */
export interface IInputAcquirer<T> {
    current_input: InputResponse<T>;
    input_option_generator: SelectionGenBuilder<T>;
    get_options: (input: InputResponse<T>) => InputOptions<T>;
}

export class AutoInputAcquirer<T> implements IInputAcquirer<T> {
    auto_input: InputResponse<T>;
    current_input: InputResponse<T>;
    
    constructor(
        auto_input: InputResponse<T>
    ) {
        this.auto_input = auto_input;
        // NOTE: Pre-queues auto_input; NEVER CHANGED.
        this.current_input = auto_input;
    }

    get_options(input: InputResponse<T>): Array<T> {
        return [this.auto_input.selection];
    }

    * input_option_generator(
        base?: T 
    ): SelectionGen<T> {
        var selection = yield this.get_options(new InputResponse(base)); // For confirmation only.
        if (!isInputSignal(selection)) {
            return selection;
        } else {
            // TODO: Handle this robustly and simplify containing loop in Controller.
            console.log("Not sure this should work: ", selection)
            return this.current_input;
        }
    }
}

export class SimpleInputAcquirer<T> implements IInputAcquirer<T> {
    // TODO: Cleanup - Simplify coupling with controller loop.
    _option_fn: OptionFn<T>;
    current_input: InputResponse<T>;
    require_confirmation: boolean;
    _auto_select: boolean;
    
    constructor(
        option_fn: OptionFn<T>,
        require_confirmation: boolean = true,
        auto_select: boolean = false
    ) {
        this._auto_select = auto_select;
        this._option_fn = option_fn;
        // NOTE: State has to return after any complete pop off the stack.
        this.current_input = null;
        this.require_confirmation = require_confirmation;
    }

    public static from_options<U>(options: Array<U>): SimpleInputAcquirer<U> {
        return new SimpleInputAcquirer<U>(() => options);
    }

    get_options(input: InputResponse<T>): InputOptions<T> {
        return this._option_fn(input.selection);
    }

    * input_option_generator(
        base?: T
    ): SelectionGen<T> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        var options = this.get_options(new InputResponse(base));

        // auto_select case
        if (options.length == 1 && this._auto_select) {
            this.current_input = new InputResponse(options[0]);
            return this.current_input;
        }

        var input_resp = yield options;
        if (this.require_confirmation || isInputSignal(input_resp)) {
            do {
                var REJECT_CASE = !input_resp;
                var CONFIRM_CASE = (input_resp != null && input_resp == this.current_input)
                // TODO: Currently treats "null" response as special flag to pop.
                if (REJECT_CASE) {
                    // var input_resp = yield options;
                    return null; // NOTE: Propagates POP Signal to subphase
                } else if (CONFIRM_CASE){
                    console.log("Confirm Simple InputResponse");
                    break;
                } else if (!isInputSignal(input_resp)) {
                    console.log("InputResponse: ", input_resp);
                    this.current_input = input_resp;
                    yield options;
                } else {
                    console.log('Invalid Input, ', input_resp);
                    yield options;
                }
            } while(true);
        } else {
            // TODO: Not set consistently across cases.
            this.current_input = input_resp;
        }
        return this.current_input;
    }
}

// TODO: Needs validation after refactor
// TODO: Fix by making Stack<T> where T is a selectable itself a selectable; similar logic for other groupings.
export class SequentialInputAcquirer<E, S extends Stack<E>> implements IInputAcquirer<S> {
    // TODO: Cleanup - Simplify coupling with controller loop.
    increment_fn: IncrementFn<E>;
    termination_fn: TerminationFn<E>;
    current_input: InputResponse<S>;

    constructor(
        increment_fn: IncrementFn<E>, 
        termination_fn: TerminationFn<E>, 
    ) {
        this.increment_fn = increment_fn;
        this.termination_fn = termination_fn;
        this.current_input = null;
    }

    get_options(input: InputResponse<S>): InputOptions<S> {
        // @ts-ignore ugly forced conversion.
        return [...bfs(input.selection, this.increment_fn, this.termination_fn).to_map().values()] as Array<S>;
    }

    _is_reject(input_resp: InputResponse<S>): boolean {
        return (
            isInputSignal(input_resp) ?
            input_resp == InputSignal.Reject :
            !input_resp
        );
    }

    _is_confirm(input_resp: InputResponse<S>): boolean {
        return (
            input_resp.signal == InputSignal.Confirm 
            && input_resp.selection.value == this.current_input.selection.value
        );
    }

    * input_option_generator(
        base?: S
    ): SelectionGen<S> {
        // Handles cases where intermediate input is required by yielding it.
        // Coroutine case.
        this.current_input = new InputResponse(base);
        var preview_map = this.get_options(this.current_input);
        var input_resp = yield preview_map;
        do {
            // TODO: Currently treats "null" response as special flag to pop.
            if (this._is_reject(input_resp)) {
                // TODO: Propagate null selection better - current state + "pop signal" tuple?
                if (this.current_input.selection.parent) {
                    // TODO: Clean up stack generic issue.
                    this.current_input.selection = this.current_input.selection.pop() as S;
                    console.log("Pop Sequential InputResponse")
                    preview_map = this.get_options(this.current_input);                        
                } else {
                    console.log("Cannot Pop Sequential InputResponse");
                    return null; // NOTE: Propagates POP Signal to subphase
                }
                input_resp = yield preview_map;
            } else if (this._is_confirm(input_resp)){
                console.log("Confirm Sequential InputResponse");
                break;
            } else if (!isInputSignal(input_resp)) {
                console.log("InputResponse: ", input_resp);
                this.current_input = input_resp;
                preview_map = this.get_options(this.current_input); 
                input_resp = yield preview_map;
            } else {
                console.log('Invalid Input, ', input_resp);
                preview_map = this.get_options(this.current_input);    
                input_resp = yield preview_map;
            }
        } while(true);
        return this.current_input;
    }
}

// TODO: Needs validation after refactor
export class ChainedInputAcquirer<E, S extends Stack<E>> extends SequentialInputAcquirer<E, S> {
    // static from_input_acquirer_list<U>(
    //     input_acquirer_list: Array<IInputAcquirer<U>>
    // ): ChainedInputAcquirer<U> {
    constructor(option_fn_list: Array<OptionFn<E>>) {
        // TODO: This got weirdly screwed up - the idea was weird already. Superceded by InputSteps?
        var increment_fn = (stack: Stack<E>): Array<E> => {
            var option_fn_index = stack.depth - 1;
            var option_fn = option_fn_list[option_fn_index];
            return option_fn(stack.value);
        };
        var termination_fn = (stack: S): boolean => {
            return stack.depth > option_fn_list.length;
        };
        super(
            increment_fn,
            termination_fn,
        )
    }
}

/**
 * InputStep: Contains an field for input (InputSelection), an acquirer to populate it,
 * and a next_step (InputStep),
 */

export type IInputNext<T> = IInputStep<T, any> | IInputStop;

// TODO: Add ConsumeChildren to assist with inputs_to_effects
export interface IInputStep<T extends ISelectable, U extends ISelectable> {
    input: InputResponse<T>;
    acquirer: IInputAcquirer<T>;
    indicator?: string;
    // TODO: Skip the acquirer and just offer generator?
    // input_option_generator: SelectionGenBuilder<T>;
    consume_children: (next_step: IInputNext<U>) => any;
    get_next_step: (state?: IState) => IInputNext<U>;
}

export interface IInputStop {}

export class InputStop implements IInputStop {}

// https://www.typescriptlang.org/docs/handbook/advanced-types.html
// TODO: not sure about the `any`
export function isInputStep(step: IInputNext<any>): step is IInputStep<any, any> {
    return (step as IInputStep<any, any>).get_next_step !== undefined;
}