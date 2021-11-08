import * as test from "tape";
import { Stack, Tree } from "../model/core";
import {InputRequest, CallbackSelectionFn, async_input_getter, SelectionFn} from "../model/input";
import { Awaited, Rejection } from "../model/utilities";
import {SelectableNumber} from "./integration.test"

// TODO: Improve - maybe two callbacks, one for display one for selection?
test("async_input_getter test", (t) => {
    var options = new Array<SelectableNumber>();
    var input_selector = () => {};
    var callback_selection_fn = (
        options: Array<SelectableNumber>, 
        resolve: Awaited<SelectableNumber>, 
        reject: Rejection,
    ) => {
        var sel = options[0];
        input_selector = () => resolve(sel); //throw arr in a closure instead?
    };
    var input_request = async_input_getter(callback_selection_fn)
    var sel_num = new SelectableNumber(10);
    var input_promise = input_request(new Map([[sel_num, new Tree(sel_num)]]))
    input_promise.then((sel) => {
        t.equal(sel.value, sel_num);
        t.end();
    })
    input_selector();
})



