// NOTE: OrbitControl import problems: https://stackoverflow.com/questions/19444592/using-threejs-orbitcontols-in-typescript/56338877#56338877
// import * as THREE from 'three';
// window.THREE = THREE;
// require('three/examples/js/controls/OrbitControls');
// export default THREE;
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GridCoordinate } from '../model/space';
import { IView, makeCanvas } from './rendering';

// @ts-ignore
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
function makeRenderer(parameters: Object): THREE.Renderer {
    return new THREE.WebGLRenderer(parameters);
}

function _addLights(scene: THREE.Scene) {
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

function _populateScene(scene: THREE.Scene) {
    let group = new THREE.Group();

    
    var coords = [
        [0, 0, 0], [0, 1, 0], [0, 2, 0],
        [1, 0, 0], [1, 1, 0],
        [2, 0, 0], [2, 1, 0], [2, 2, 0],

        [0, 0, 1], [0, 2, 1],
        [1, 0, 1], [1, 1, 1],
        [2, 1, 1],


        [1, 0, 2]
    ]
    for (var i = 0; i < coords.length; i++) {
        let co = coords[i];
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        // let blockMesh = new THREE.Mesh(geometry, material);
        let blockMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
        blockMesh.position.x = co[0];
        blockMesh.position.y = co[1];
        blockMesh.position.z = co[2];
        console.log(blockMesh);
        group.add(blockMesh);
    }

    scene.add(group);

    return scene;
}

function makeScene(): THREE.Scene {
    const material = new THREE.MeshNormalMaterial();
    let scene = new THREE.Scene();

    _addLights(scene);

    _populateScene(scene);

    return scene;
}

function makeCamera (view_width: number, view_height: number) {
    const fov = 45;
    // const fov = 180;
    const aspect = view_width/view_height;
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // const camera = new THREE.OrthographicCamera(-5, 5, -5, 5, -100, 100)
    camera.position.set(4, 4, 12)
    // camera.position.set(0, 0, 5);
    // camera.rotation.y=10/180 * Math.PI;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    // controls.target = (new THREE.Vector3(5, 5, 0));
    return camera;
}

var makeControls = function(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    // return new OrbitControls(camera, canvas);
}

var makeRaycaster = function() {
    return new THREE.Raycaster();
}


// function onWindowResize() {
//     camera.aspect = WIDTH / HEIGHT;
//     camera.updateProjectionMatrix();
//     renderer.setSize(WIDTH, HEIGHT);
// }
// function onDocumentMouseMove(event) {
//     event.preventDefault();
//     var rect = event.target.getBoundingClientRect();
//     mouse.x = ((event.clientX - rect.left) / WIDTH) * 2 - 1;
//     mouse.y = - ((event.clientY - rect.top) / HEIGHT) * 2 + 1;
// }
// function onDocumentMouseClick(event) {
//     event.preventDefault();
// }


function getGroup(scene: THREE.Scene): THREE.Object3D {
    var objects = scene.children
    if (objects.length === 0) { return null; }
    var group = objects[objects.length - 1]
    if (group.type !== "Group") { return null; }
    console.log(group);
    return group
}


function _clearThree(obj: THREE.Object3D) {
    while (obj.children.length > 0) {
        _clearThree(obj.children[0])
        obj.remove(obj.children[0]);
    }
    // TODO: Clean up these type errors.
    // @ts-ignore - test type instead of property directly
    if (obj.geometry) obj.geometry.dispose()
    // @ts-ignore - test type instead of property directly
    if (obj.material) obj.material.dispose()
    // @ts-ignore - test type instead of property directly
    if (obj.texture) obj.texture.dispose()
}


function clearThree(scene: THREE.Scene){
    var group = getGroup(scene);
    if (group != null) {_clearThree(group);}
}


export class View3D implements IView3D {
    context: WebGL2RenderingContext;
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.Renderer;
    // controls: OrbitControls;
    cube: THREE.Object3D;

    constructor(view_width: number, view_height: number) {
        // Create Canvas
        var canvas = makeCanvas(view_width, view_height, true);
        this.context = canvas.getContext("webgl2", {preserveDrawingBuffer: true});
        this.renderer = makeRenderer( {canvas: canvas});
        // NOTE: Can only access context through renderer.getContext
        // @ts-ignore
        // console.log("Context: ", this.renderer.getContext("webgl"))
        // @ts-ignore
        // this.context = this.renderer.getContext("webgl");
        // this.context = this.renderer.domElement.getContext("webgl");
        this.scene = makeScene();
        this.camera = makeCamera(view_width, view_height);
        // this.controls = makeControls(this.camera, canvas);
    }

    animate(): void {
        // TODO: Move to `requestAnimationFrame` instead of display_handler on_tick?
        // console.log("Animating: ", this);
        // requestAnimationFrame( this.animate.bind(this) );

        // this.camera.updateMatrixWorld();
        
        // mouseRaycast(mouse, camera, scene);
    
        // TODO: Re-implement controls
        // this.controls.update();
        console.log("Render")
        this.renderer.render(this.scene, this.camera);
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
        console.log("DrawRect");
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

    clear(){
        console.log("clear");
        clearThree(this.scene);
    }
}