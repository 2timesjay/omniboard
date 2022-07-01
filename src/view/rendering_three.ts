import * as THREE from 'three';
import { GridCoordinate } from '../model/space';

    

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
    obj: THREE.Object3D, 
    co: GridCoordinate, 
    context: WebGLRenderingContext, 
    size: number, 
    clr?: string,
    lfa?: number,
) {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.

    let geometry = new THREE.BoxGeometry(size,size, size);
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
    getGroup(context.scene).add(mesh);
}

function makeCircle3D(obj, co, context, size, clr, lfa) {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
    const color = clr == undefined ? "#000000" : clr;

    let geometry = new THREE.CircleGeometry(size/2.0, 32);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ 
        color: clr,
        opacity: alpha,
    }));
    mesh.position.x = co[0];
    mesh.position.y = co[1];
    mesh.position.z = co[2];
    mesh.coords = co;
    mesh.obj = obj;
    getGroup(context.scene).add(mesh);
}

function makeText3D(obj, co, context, text, size, clr, lfa) {
    const alpha = lfa == undefined ? 1.0 : lfa; // Alpha not yet used.
    const color = clr == undefined ? "#000000" : clr;
    let texture = makeTexture();
    texture.fillStyle = color;
    texture.font =  128 + "px consolas";
    texture.fillText(text, 0, 128);
    let geometry = new THREE.PlaneGeometry(size, size);
    textureMaterial = new THREE.MeshBasicMaterial();
    textureMaterial.map = new THREE.CanvasTexture(texture.canvas);
    let mesh = new THREE.Mesh(geometry, textureMaterial);
    mesh.position.x = co[0];
    mesh.position.y = co[1];
    mesh.position.z = co[2];
    mesh.coords = co;
    mesh.obj = obj;
    getGroup(context.scene).add(mesh);
}

class View3D implements IView {
    context: WebGLRenderingContext;

    constructor(k: number, size: number) {
        // Create Canvas
        var canvas = makeCanvas(k * size, k * size * d, true);
        this.context = canvas.getContext("webgl");

    }

    drawArc(
        x: number, y: number, size: number, frac_filled?: number, clr?: string, lfa?: number
    ): void {
        // makeArc3D(x, y, this.context, size, frac_filled, clr, lfa);
    }

    drawCircle(
        x: number, y: number, size: number, clr?: string, lfa?: number
    ): void {
        makeCircle3D(x, y, this.context, size, clr, lfa);
    }

    drawRect(
        x: number, y: number, width: number, height: number, clr?: string, lfa?: number
    ): void {
        makeRect3D(x, y, this.context, width, height, clr, lfa);
    }

    drawLine(
        x_from: number, 
        y_from: number,
        x_to: number,
        y_to: number,  
        line_width: number, 
        clr?: string | null, 
        lfa?: number | null
    ): void {
        // makeLine3D(x_from, y_from, x_to, y_to, this.context, line_width, clr, lfa);
    }
}