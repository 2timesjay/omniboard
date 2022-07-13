import THREE = require("three");
import { Entity } from "../../model/entity";
import { GridCoordinate } from "../../model/space";
import { ThreeBroker } from "../../view/broker";
import { AbstractDisplay3D, Animate, BaseAnimation, EntityDisplay3D, ILocatable, IPathable, LinearVisual3D, _EntityDisplay3D } from "../../view/display";
import { ActiveRegion } from "../../view/display_handler";
import { View2D } from "../../view/rendering";
import { IView3D } from "../../view/rendering_three";

// instantiate a loader
const loader = new THREE.ObjectLoader;

function drawCar(view: IView3D): THREE.Object3D {
    var scene = view.scene;
    var car = null;

    // load a resource
    loader.load(
        // resource URL
        'models/car_model.obj',
        // called when resource is loaded
        function ( object ) {
            car = object;
            scene.add( car );
        },
        // called when loading is in progresses
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );
    return car;
}


export class CarDisplay3D extends EntityDisplay3D implements ILocatable, IPathable {
    update_pos() {
        console.log("MOVING ENTITY: ", this.selectable)
        // @ts-ignore Actualy GridLocation
        console.log("UPDATED LOC: ", this.selectable.loc.x, this.selectable.loc.y, this.selectable.loc.z);
        
        // TODO: Fix to 0.2 * size after I fix offsets for gridLocations
        var margin = 0.1;
        // @ts-ignore Actualy GridLocation
        this._xOffset = this.selectable.loc.x + margin;
        // @ts-ignore Actualy GridLocation
        this._yOffset = this.selectable.loc.y + margin;
        this._zOffset = (
            // @ts-ignore Actualy GridLocation
            this.selectable.loc.z != null ? 
            // @ts-ignore Actualy GridLocation
            (this.selectable.loc.z) + 0.6 + margin: 
            margin
        );
        this._size = 0.6;
        this.width = 0.6;
        this.height = 0.6;
    }

    updateActive(active_region?: ActiveRegion): boolean {
        // TODO: Put "always-active" type behavior into mixin or superclass
        this.active = true;
        return this.active;
    }

    // TODO: Re-add alpha.
    render(view: IView3D, clr: string): THREE.Object3D {
        return drawCar(view);
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        return drawCar(view);
    }
}