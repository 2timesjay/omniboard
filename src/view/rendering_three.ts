import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
// @ts-ignore has no exported member 'helvetiker_reg'
import helvetiker_reg from '../../fonts/helvetiker_regular.typeface.json'
import { GridCoordinate } from '../model/space';
import { InputCoordinate, ThreeBroker } from './broker';
import { IView, makeCanvas, makeRect, RenderObject } from './rendering';


const loader = new FontLoader();
const font = loader.parse(helvetiker_reg);

// NOTE: used only for textures
const SIZE = 100;

export interface IView3D extends IView<GridCoordinate> {
    context: WebGL2RenderingContext;
    scene: THREE.Scene;
    drawArc: (
        co: GridCoordinate,
        size: number, 
        frac_filled?: number | null,
        clr?: string | null, 
        lfa?: number | null
    ) => THREE.Object3D;
    drawCircle: (
        co: GridCoordinate,
        size: number, 
        clr?: string | null, 
        lfa?: number | null
    ) => THREE.Object3D;
    drawLine: (
        co_from: GridCoordinate,
        co_to: GridCoordinate,
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ) => THREE.Object3D;
    drawRect: (
        co: GridCoordinate,
        width: number, 
        height: number,
        clr?: string | null, 
        lfa?: number | null
    ) => THREE.Object3D;
}

function makeRect3D(
    co: GridCoordinate, 
    scene: THREE.Scene,
    width: number,
    height: number,
    depth: number,
    clr?: string,
    lfa?: number,
): THREE.Object3D {
    const alpha = lfa == undefined ? 1.0 : lfa;
    
    let geometry = new THREE.BoxGeometry(width, height, depth);
    let material = new THREE.MeshStandardMaterial({
        opacity: alpha,
        color:  clr, // Math.random() * 0xffffff, 
        transparent: true,
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = co.x;
    mesh.position.y = co.y;
    mesh.position.z = co.z;
    getGroup(scene).add(mesh);
    return mesh;
}

function makeCircle3D(
    co: GridCoordinate,  
    scene: THREE.Scene,
    size: number, 
    clr?: string,
    lfa?: number,
): THREE.Object3D {
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
    return mesh;
}

function makeArc3D(
    co: GridCoordinate,  
    scene: THREE.Scene,
    size: number, 
    frac_filled?: number,
    clr?: string,
    lfa?: number,
): THREE.Object3D {
    const fraction_filled = frac_filled == undefined ? 1.0: frac_filled;
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
    const color = clr == undefined ? "#000000" : clr;

    const curve = new THREE.EllipseCurve(
        0, 0, 
        size/2.0, size/2.0, 
        0, frac_filled * 2 * Math.PI,
        true,
        0);
    const points = curve.getPoints( 50 );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    let mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ 
        color: clr,
        opacity: alpha,
    }));
    mesh.position.x = co.x;
    mesh.position.y = co.y;
    mesh.position.z = co.z;
    getGroup(scene).add(mesh);
    return mesh;
}

function coToVec(co: GridCoordinate): THREE.Vector3 {
    return new THREE.Vector3(co.x, co.y, co.z);
}

// TODO: Use MeshLine (https://github.com/spite/THREE.MeshLine/blob/master/README.md) or TubeGeometry
function makeLine3D(
    co_from: GridCoordinate,
    co_to: GridCoordinate,  
    scene: THREE.Scene,
    size: number, 
    clr?: string,
    lfa?: number,
): THREE.Object3D {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
    const color = clr == undefined ? "#000000" : clr;

    var line_points = [];
    line_points.push(coToVec(co_from));
    line_points.push(coToVec(co_to));

    let geometry = new THREE.BufferGeometry().setFromPoints( line_points );
    let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
        color: clr,
        // opacity: alpha, // TODO: Implement line alpha
    }));
    
    getGroup(scene).add(line);
    return line;
}

function textureHelper() {
    var canvas = document.createElement("canvas");
    // TODO: Should this be string???
    canvas.setAttribute("width", "1");
    canvas.setAttribute("height", "1");
    const context = canvas.getContext("2d");
    context.fillStyle = 'darkslategrey';
    context.fillRect(0, 0, 128, 128);
    return context;
}

// TODO: Not working
function makeFlatText3D(
    co: GridCoordinate,
    scene: THREE.Scene,
    text: string,
    font_size: number,
    clr?: string,
    lfa?: number
) {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
    const color = clr == undefined ? "#000000" : clr;
    let texture = textureHelper();
    // texture.fillStyle = color;
    texture.fillStyle = "white";
    texture.font =  font_size + "px consolas";
    texture.fillText(text, 0, 128);
    let geometry = new THREE.PlaneGeometry(10, 10);
    let textureMaterial = new THREE.MeshBasicMaterial();
    textureMaterial.map = new THREE.CanvasTexture(texture.canvas);
    let mesh = new THREE.Mesh(geometry, textureMaterial);
    getGroup(scene).add(mesh);
    return mesh;
}

function makeText3D(
    co: GridCoordinate,
    scene: THREE.Scene,
    text: string,
    font_size: number,
    clr?: string,
    lfa?: number
): RenderObject {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
    const color = clr == undefined ? "#000000" : clr;

    const matDark = new THREE.LineBasicMaterial( {
        color: color,
        side: THREE.DoubleSide
    } );

    const matLite = new THREE.MeshBasicMaterial( {
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    } );

    const message = text;
    const shapes = font.generateShapes( message, font_size );
    const geometry = new THREE.ShapeGeometry( shapes );
    geometry.computeBoundingBox();

    // make shape ( N.B. edge view not visible )
    const textMesh = new THREE.Mesh( geometry, matDark );
    // TODO: Recalculate these positions - do I need to add co and bb?
    // textMesh.position.x = co.x + geometry.boundingBox.min.x;
    // textMesh.position.y = co.y + 1 + geometry.boundingBox.min.y;
    // textMesh.position.z = co.z + 1 + geometry.boundingBox.min.z;
    // textMesh.position.z = - 150;
    // NOTE: have to include group checks for some reason?
    getGroup(scene).add( textMesh );
    // For stroke-style see https://threejs.org/examples/?q=text#webgl_geometry_text_stroke
    // make line shape ( N.B. edge view remains visible )
    return textMesh;
    // loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {
    //     return makeRect3D(co, scene, 4, 4, 4, clr, lfa)

    //     // let geometry = new THREE.BoxGeometry(4, 4, 4);
    //     // let material = new THREE.MeshStandardMaterial({
    //     //     opacity: 1,
    //     //     color: Math.random() * 0xffffff, 
    //     // });
    //     // let mesh = new THREE.Mesh(geometry, material);
    //     // mesh.position.x = co.x;
    //     // mesh.position.y = co.y;
    //     // mesh.position.z = co.z;
    //     // getGroup(scene).add(mesh);
    // }, () => {console.log("Progress");}, (event: ErrorEvent) => {console.log("Error loading font ", error);} ); //end load function
    // return null;
}

/** THREE objects necessary for rendering */
function makeRenderer(parameters: Object): THREE.Renderer {
    return new THREE.WebGLRenderer(parameters);
}

function _addLights(scene: THREE.Scene) {
    scene.background = new THREE.Color(0xf0f0f0);
    // var light = new THREE.DirectionalLight(0xffffff, 1);
    // light.position.set(10000, 10000, 10000).normalize();
    // light.lookAt(0, 0, 0)
    // scene.add(light);
    // var light = new THREE.DirectionalLight(0xffffff, 0.4);
    // light.lookAt(0, 0, 0)
    // light.position.set(-10000, -10000, -10000).normalize();
    // scene.add(light);
    // var light = new THREE.DirectionalLight(0xffffff, 0.7);
    // light.lookAt(0, 0, 0)
    // light.position.set(-40000, -40000, -120000).normalize();
    // scene.add(light);
    const light = new THREE.HemisphereLight( 0xffffff, 0x080808, 1 );
    light.position.set(0, 0, 1);
    scene.add( light );
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

    // TODO: Remove
    _populateScene(scene);

    return scene;
}

function makeCamera (view_width: number, view_height: number) {
    const fov = 45;
    // const fov = 180;
    const aspect = view_width/view_height;
    const near = 0.1;
    const far = 120;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // const camera = new THREE.OrthographicCamera(-5, 5, -5, 5, -100, 100)
    camera.position.set(8, 8, 8)
    // camera.position.set(0, 0, 5);
    // camera.rotation.y=10/180 * Math.PI;
    camera.up = new THREE.Vector3(0, 0, 1)
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
}

var makeControls = function(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    var controls = new OrbitControls(camera, canvas);
    controls.target = (new THREE.Vector3(0, 0, 0));
    return controls;
}

var makeRaycaster = function() {
    return new THREE.Raycaster();
}


function onDocumentMouseMove(event: MouseEvent) {
    event.preventDefault();
}


function onDocumentMouseClick(event: MouseEvent) {
    event.preventDefault();
}


function getGroup(scene: THREE.Scene): THREE.Object3D {
    var objects = scene.children
    if (objects.length === 0) { return null; }
    var group = objects[objects.length - 1]
    if (group.type !== "Group") { return null; }
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
    controls: OrbitControls;
    raycaster: THREE.Raycaster;

    constructor(view_width: number, view_height: number) {
        // TODO: Do I need these to let events get consumed twice?
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('click', onDocumentMouseClick, false); 
        // Create Canvas
        var canvas = makeCanvas(view_width, view_height, true);
        this.context = canvas.getContext("webgl2");
        this.renderer = makeRenderer( {canvas: canvas});
        this.scene = makeScene();
        this.camera = makeCamera(view_width, view_height);
        this.controls = makeControls(this.camera, canvas);
        this.raycaster = makeRaycaster();
    }

    getHitObjects(mouse_co: InputCoordinate, render_objects?: Array<RenderObject>): Array<THREE.Object3D> {
        // find intersections
        this.raycaster.setFromCamera(mouse_co, this.camera);
        var group = getGroup(this.scene)
        var intersects = this.raycaster.intersectObjects(group.children);
        return intersects.map(intersect => intersect.object);
    }

    animate(): void {
        // TODO: Move to `requestAnimationFrame` instead of display_handler on_tick?
        // requestAnimationFrame( this.animate.bind(this) );
        // this._getHit();
        this.camera.updateMatrixWorld();
        this.camera.updateMatrix();
        this.renderer.render(this.scene, this.camera);
    };

    drawArc(
        co: GridCoordinate, size: number, frac_filled?: number, clr?: string, lfa?: number
    ): THREE.Object3D {
        makeArc3D(co, this.scene, size, frac_filled, clr, lfa);
        throw new Error('Method not implemented.');
    }

    drawCircle(
        co: GridCoordinate, size: number, clr?: string, lfa?: number
    ): THREE.Object3D {
        return makeCircle3D(co, this.scene, size, clr, lfa);
    }

    drawRect(
        co: GridCoordinate, width: number, height: number, clr?: string, lfa?: number
    ): THREE.Object3D {
        // TODO: Get rid of egregious hack for type purposes.
        var depth = height;
        return makeRect3D(co, this.scene, width, height, depth, clr, lfa);
    }

    drawLine(
        co_from: GridCoordinate,
        co_to: GridCoordinate,
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ): THREE.Object3D {
        return makeLine3D(co_from, co_to, this.scene, line_width, clr, lfa);
    }

    // TODO: Improve Menu rendering and colors for visibility
    drawText(
        co: GridCoordinate,
        text: string, 
        font_size: number,
        clr?: string | null,
        lfa?: number | null,
    ): RenderObject {
        // @ts-ignore We know it'd 3d.
        var textObject: THREE.Object3D = makeText3D(co, this.scene, text, font_size, clr, lfa);
        // textObject.up = new THREE.Vector3(0, 0, 1);
        // textObject.lookAt(this.camera.position);
        // @ts-ignore Geometry is present on mesh
        var geometry: THREE.BoxGeometry = textObject.geometry;
        geometry.computeBoundingBox();
        
        // NOTE: Alternatives in https://stackoverflow.com/questions/15492857/any-way-to-get-a-bounding-box-from-a-three-js-object3d
        const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
        const color = clr == undefined ? "#000000" : clr;
        var {x: x_min, y: y_min, z: z_min} = geometry.boundingBox.min;
        var {x: x_max, y: y_max, z: z_max} = geometry.boundingBox.max;
        var inset = 0.1;
        var margin = 1.4;
        var width = (x_max - x_min)
        var height = (y_max - y_min)
        var depth = (z_max - z_min)
        var box = makeRect3D(
            {x: co.x + x_min, y: co.y + y_min, z: co.z + 1 + z_min}, 
            // {x: x_min - 0.5*width, y: y_min, z: z_min},
            this.scene, 
            margin*width, margin*height, depth + inset, 
            clr, 0.25 * alpha);
        textObject.position.x = -0.5 * width;
        textObject.position.y = -0.5 * height;
        box.add(textObject);
        box.position.z = 2
        box.up = new THREE.Vector3(0, 0, 1);
        box.lookAt(this.camera.position);
        return box;
    }

    clear(){
        clearThree(this.scene);
    }
}