import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Entity } from '../../model/entity';
import { GridCoordinate } from '../../model/space';
import { EntityDisplay3D, ILocatable, IPathable, _EntityDisplay3D } from "../../view/display";
import { ActiveRegion } from "../../view/display_handler";
import { IView3D } from "../../view/rendering_three";
import { car_display_setup } from './car_display_setup';

// instantiate an OBJLoader
/// https://discourse.threejs.org/t/three-cant-parse-https-cywarr-github-io-small-shop-kirche3d-obj-unexpected-token-in-json-at-position-0/5622/5
const loader = new OBJLoader;

// TODO: Generalize
class Loader {
    _car: THREE.Object3D;

    constructor() {
        console.log("Constructing car")
        var self = this;
        loader.load(
            // resource URL
            'models/car_model.obj',
            // called when resource is loaded
            function ( object ) {
                console.log(object);
                self._car = object;
                console.log("Loaded CAR", self._car);
            },
            // called when loading is in progresses
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            function ( error ) {
                console.log( 'An error happened', error );
            }
        );
        console.log("CAR", this._car);
    }

    get car(): THREE.Object3D {
        return this._car;
    }
}

function drawCar(co: GridCoordinate, view: IView3D, loader: Loader): THREE.Object3D {
    var mesh = loader.car;
    var scene = view.scene;
    scene.add( mesh );
    try {
        console.log("Car Mesh", mesh);
        console.log("Car Pos", mesh.position)
        mesh.position.x = co.x;
        mesh.position.y = co.y;
        mesh.position.z = co.z;
    } catch {
        console.log("Car mesh error")
    }
    return mesh;
}


export class CarDisplay3D extends EntityDisplay3D implements ILocatable, IPathable {
    loader: Loader;

    constructor(entity: Entity) {
        super(entity);
        this.loader = new Loader();
    }

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
        return drawCar(this.co, view, this.loader);
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        return drawCar(this.co, view, this.loader);
    }
}