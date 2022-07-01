import * as THREE from 'three';
import { GridCoordinate } from '../model/space';
import { IView, makeCanvas } from './rendering';


export interface IView3D extends IView {
    scene: THREE.Scene
    drawArc: (
        co: GridCoordinate,
        size: number, 
        frac_filled?: number | null,
        clr?: string | null, 
        lfa?: number | null
    ) => void;
    drawCircle: (
        co: GridCoordinate,
        size: number, 
        clr?: string | null, 
        lfa?: number | null
    ) => void;
    drawLine: (
        co_from: GridCoordinate,
        co_to: GridCoordinate,
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ) => void;
    drawRect: (
        co: GridCoordinate,
        width: number, 
        height: number,
        depth: number,
        clr?: string | null, 
        lfa?: number | null
    ) => void;
}


function getGroup(scene: THREE.Scene) {
    var objects = scene.children
    if (objects.length === 0) { return null; }
    var group = objects[objects.length - 1]
    if (group.type !== "Group") { return null; }
    return group
}

function clear(context: WebGLRenderingContext){
    function clearThree(obj: THREE.Object3D) {
        while (obj.children.length > 0) {
            clearThree(obj.children[0])
            obj.remove(obj.children[0]);
        }
        // @ts-ignore - test type instead of property directly
        if (obj.geometry) obj.geometry.dispose()
        // @ts-ignore - test type instead of property directly
        if (obj.material) obj.material.dispose()
        // @ts-ignore - test type instead of property directly
        if (obj.texture) obj.texture.dispose()
    }

    var group = getGroup(context.scene);
    if (group != null) {clearThree(group);}
}

function makeRect3D(
    co: GridCoordinate, 
    scene: THREE.Scene,
    width: number,
    height: number,
    depth: number,
    clr?: string,
    lfa?: number,
) {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.

    let geometry = new THREE.BoxGeometry(width, height, depth);
    let material = new THREE.MeshStandardMaterial({
        opacity: alpha,
        color: clr
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = co.x;
    mesh.position.y = co.y;
    mesh.position.z = co.z;
    // mesh.obj = obj;
    // @ts-ignore Scene should exist on context?
    getGroup(scene).add(mesh);
}

function makeCircle3D(
    co: GridCoordinate,  
    scene: THREE.Scene,
    size: number, 
    clr?: string,
    lfa?: number,
) {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
    const color = clr == undefined ? "#000000" : clr;

    let geometry = new THREE.CircleGeometry(size/2.0, 32);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ 
        color: clr,
        opacity: alpha,
    }));
    mesh.position.x = co.x;
    mesh.position.y = co.y;
    mesh.position.z = co.z;
    getGroup(scene).add(mesh);
}

// function makeTexture() {
//     var canvas = document.createElement("canvas");
//     canvas.setAttribute("width", 128);
//     canvas.setAttribute("height", 128);
//     const context = canvas.getContext("2d");
//     context.canvas.value = context;
//     context.fillStyle = 'darkslategrey';
//     context.fillRect(0, 0, 128, 128);
//     return context;
// }

// function makeText3D(obj, co, context, text, size, clr, lfa) {
//     const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
//     const color = clr == undefined ? "#000000" : clr;
//     let texture = makeTexture();
//     texture.fillStyle = color;
//     texture.font =  128 + "px consolas";
//     texture.fillText(text, 0, 128);
//     let geometry = new THREE.PlaneGeometry(size, size);
//     textureMaterial = new THREE.MeshBasicMaterial();
//     textureMaterial.map = new THREE.CanvasTexture(texture.canvas);
//     let mesh = new THREE.Mesh(geometry, textureMaterial);
//     mesh.position.x = co[0];
//     mesh.position.y = co[1];
//     mesh.position.z = co[2];
//     mesh.coords = co;
//     mesh.obj = obj;
//     getGroup(context.scene).add(mesh);
// }

/** THREE objects necessary for rendering */
function makeRenderer(parameters: Object) {
    return new THREE.WebGLRenderer(parameters);
}

function makeScene() {
    const material = new THREE.MeshNormalMaterial();
    let scene = new THREE.Scene();

    scene.background = new THREE.Color(0xf0f0f0);
    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    var light = new THREE.DirectionalLight(0xffffff, 0.4);
    light.position.set(-1, -1, -1).normalize();
    var light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(-4, -4, -12).normalize();
    scene.add(light);
    return scene;
}

// var _populateSimpleScene = function (scene, coords){

//     let group = new THREE.Group();
//     for (var i = 0; i < coords.length; i++) {
//         let co = coords[i];
//         let geometry = new THREE.CubeGeometry(1, 1, 1);
//         // let blockMesh = new THREE.Mesh(geometry, material);
//         let blockMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
//         blockMesh.position.x = co[0];
//         blockMesh.position.y = co[1];
//         blockMesh.position.z = co[2];
//         blockMesh.coords = co;
//         group.add(blockMesh);
//     }

//     scene.add(group);

//     return scene;
// }

function makeCamera (view_width: number, view_height: number) {
    const fov = 45;
    const aspect = view_width/view_height;
    const near = 1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // const camera = new THREE.OrthographicCamera(-5, 5, -5, 5, -100, 100)
    camera.position.set(4, 4, 12)
    // camera.rotation.y=10/180 * Math.PI;
    // camera.lookAt(new THREE.Vector3(5, 5, 0));
    // controls.target = (new THREE.Vector3(5, 5, 0));
    return camera;
}

var makeRaycaster = function() {
    return new THREE.Raycaster();
}

// var _getControls = function(camera, domElement) {
//     return new OrbitControls(camera, domElement);
// }

class View3D implements IView3D {
    context: WebGLRenderingContext;
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.Renderer;

    constructor(view_width: number, view_height: number) {
        // Create Canvas
        var canvas = makeCanvas(view_width, view_height, true);
        this.context = canvas.getContext("webgl");
        this.renderer = makeRenderer( {canvas: canvas});
        this.scene = makeScene();
        this.camera = makeCamera(view_width, view_height);
    }

    animate(): void {
        requestAnimationFrame( this.animate.bind(this) );

        this.renderer.render( this.scene, this.camera );
    };

    drawArc(
        co: GridCoordinate, size: number, frac_filled?: number, clr?: string, lfa?: number
    ): void {
        // makeArc3D(x, y, this.context, size, frac_filled, clr, lfa);
    }

    drawCircle(
        co: GridCoordinate, size: number, clr?: string, lfa?: number
    ): void {
        makeCircle3D(co, this.scene, size, clr, lfa);
    }

    drawRect(
        co: GridCoordinate, width: number, height: number, depth: number, clr?: string, lfa?: number
    ): void {
        makeRect3D(co, this.scene, width, height, depth, clr, lfa);
    }

    drawLine(
        co_from: GridCoordinate,
        co_to: GridCoordinate,
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ): void {
        // makeLine3D(x_from, y_from, x_to, y_to, this.context, line_width, clr, lfa);
    }
}