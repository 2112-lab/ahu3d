import * as THREE from 'three';
import Lights from "./Lights";
import Cameras from "./Cameras";
import Materials from "./Materials";

class Scene {

    constructor() {
        this.init();
    }

    init() {
        this.lights = new Lights();
        this.cameras = new Cameras();
        this.materials = new Materials();
        this.scene = new THREE.Scene();
        
        this.addToScene(this.lights.hemisphereLight);
        this.addToScene(this.lights.ambientLight);
        this.addToScene(this.lights.spotLight);        
        
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.cube = this.createDemoCube();
        this.addToScene(this.cube);
        
        this.cameras.primary.position.z = 5;
        
        const animate = () => {
            requestAnimationFrame(animate);
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
            this.renderer.render(this.scene, this.cameras.primary);
        }
        
        animate();
    }

    createDemoCube() {
        const geometry = new THREE.BoxGeometry();
        const material = this.materials.createStandardMaterial();
        const cube = new THREE.Mesh(geometry, material);
        return cube;
    }

    addToScene(mesh) {
        this.scene.add(mesh);
    }
}

export default Scene;