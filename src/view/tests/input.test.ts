import * as test from "tape";
import { SelectableNumber } from "../../tests/utilities";
import {SelectionBroker} from "../input";

test("SelectionBroker Test", (t) => {
    var num = new SelectableNumber(4);
    var synthetic_listener = (e: MouseEvent) => num;
    var selection_broker = new SelectionBroker<SelectableNumber>([synthetic_listener]);
    var promise = new Promise((resolve, reject) => {
        selection_broker.setPromiseHandlers(resolve, reject);
    })
    promise.then((sel: SelectableNumber) => {
        t.equal(sel.value, 4);
        t.end();
    })
    // var mockedMouseEvent = mock(MouseEvent);
    // var simulated_mouse_event = instance(mockedMouseEvent);
    // var simulated_mouse_event: MouseEvent = new MouseEvent("click");
    var simulated_mouse_event = {};
    // @ts-ignore
    selection_broker.onclick(simulated_mouse_event);
})