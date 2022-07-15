import * as THREE from 'three';
import { MeshBasicMaterial } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Entity } from '../../model/entity';
import { GridCoordinate } from '../../model/space';
import { EntityDisplay3D, ILocatable, IPathable, _EntityDisplay3D } from "../../view/display";
import { ActiveRegion } from "../../view/display_handler";
import { getGroup, IView3D } from "../../view/rendering_three";
import { car_display_setup } from './car_display_setup';

// instantiate an OBJLoader
/// https://discourse.threejs.org/t/three-cant-parse-https-cywarr-github-io-small-shop-kirche3d-obj-unexpected-token-in-json-at-position-0/5622/5
const loader = new OBJLoader;

// TODO: Generalize
class Loader {
    _car: THREE.Object3D;

    constructor() {
        this.load_model();
    }

    load_model() {
        var self = this;
        loader.load(
            // resource URL
            'models/car_model.obj',
            // called when resource is loaded
            function ( object: THREE.Object3D ) {
                // Note: ObjectLoader loads Group; we want Mesh.
                var object = object.children[0];
                // TODO: Consider using bounding box for collision? https://discourse.threejs.org/t/collision-detection-with-3d-models/16662/3
                self._car = object;
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
    }

    get car(): THREE.Mesh  {
        // this.load_model();
        try {
            return this._car.clone();
        } catch(error) {
            return null;
        }
    }
}

// TODO: Move into rendering_three.ts, or an extension
function drawCar(co: GridCoordinate, view: IView3D, loader: Loader, clr?: string, lfa?: alpha): THREE.Object3D {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
    const color = clr == undefined ? "#000000" : clr;

    var mesh = loader.car;
    var scene = view.scene;
    try {
        mesh.position.x = co.x - 0.45;
        mesh.position.y = co.y + 0.25;
        mesh.position.z = co.z - 0.35;
        mesh.scale.x = 0.25;
        mesh.scale.y = 0.25;
        mesh.scale.z = 0.25;
        mesh.rotation.x = Math.PI/2;
        mesh.material = new THREE.MeshStandardMaterial({ 
            color: color,
            opacity: alpha,
        });
        getGroup(scene).add( mesh );
        // console.log(color, alpha, mesh.material)
    } catch(error) {
        console.log("Car mesh error: ", error)
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

    // TODO: Re-add alpha.
    render(view: IView3D, clr: string): THREE.Object3D {
        return drawCar(this.co, view, this.loader, clr);
    }

    alt_render(view: IView3D, clr: string): THREE.Object3D {
        return drawCar(this.co, view, this.loader, clr);
    }
}