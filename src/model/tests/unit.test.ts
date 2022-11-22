import * as test from "tape";
import { BoardState } from "../state";
import {Unit, CONSTRUCT_BASIC_ACTIONS} from "../../tactics/unit";

test("Unit test", (t) => {
    var unit = new Unit(0);
    t.equals(unit.team, 0);
    var state = new BoardState();
    unit.actions = CONSTRUCT_BASIC_ACTIONS(unit, state);
    t.equals(unit.actions.length, 4);
    t.end();
})