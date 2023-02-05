import { ISelectable, ISerializable } from "../model/core";
import { ILocation } from "../model/space";
import { IState } from "../model/state";

export class Glement implements ISelectable, ISerializable {
    loc: ILocation;
    _indicator: string = "Glement";

    constructor(loc?: ILocation){
        this.loc = loc;
    }

    setLoc(loc: ILocation){
        this.loc = loc; 
    }

    get indicator(): string {
        return this._indicator;
    }

    serialize(): string {
        return JSON.stringify({
            "class": "Glement", 
            // @ts-ignore
            "loc": {"x": this.loc.x, "y": this.loc.y, "z": this.loc.z}
        });
    }

    static deserialize(serialized: string): Glement {
        var obj = JSON.parse(serialized);
        return new Glement(obj.loc);
    }
}

// https://stackoverflow.com/questions/12802317/passing-class-as-parameter-causes-is-not-newable-error
export type Newable<T> = { new (...args: any[]): T; };

export class GlementFactory implements ISelectable {
    glement_class: Newable<Glement>;

    constructor(glement_class: Newable<Glement>){
        this.glement_class = glement_class;
    }

    createGlement(loc?: ILocation): Glement {
        return new this.glement_class(loc);
    }
}

export class EntityType {
    indicator: string;
    constructor(indicator: string){
        this.indicator = indicator;
    }

    get text(): string {
        return this.indicator
    }
}


export class EntityFactory implements ISelectable {
    glement_class: Newable<Entity>;
    entity_type: EntityType;

    constructor(glement_class: Newable<Entity>, entity_type: EntityType){
        this.glement_class = glement_class;
        this.entity_type = entity_type;
    }

    create_entity(loc?: ILocation): Glement {
        return new this.glement_class(this.entity_type, loc);
    }
}

export class Entity extends Glement {
    loc: ILocation;
    entity_type: EntityType;

    constructor(entity_type: EntityType, loc?: ILocation){
        super(loc);
        this.entity_type = entity_type;
    }

    get indicator(): string {
        return this.entity_type.indicator;
    }

    serialize(): string {
        return JSON.stringify({
            "class": "Entity", 
            "entity_type_indicator": this.entity_type.indicator,
            // @ts-ignore
            "loc": {"x": this.loc.x, "y": this.loc.y, "z": this.loc.z}
        });
    }

    static deserialize(serialized: string): Entity {
        var obj = JSON.parse(serialized);
        var entity_type = new EntityType(obj.entity_type_indicator)
        return new Entity(entity_type, obj.loc);
    }
}