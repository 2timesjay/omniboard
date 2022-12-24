import { Entity } from "../../model/entity";
import { BaseState } from "../../model/state";
import { VolumeSpace } from "../../common/space";

export class EditorState extends BaseState {
    entities: Array<Entity>;
    space: VolumeSpace;
}