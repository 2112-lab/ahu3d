import * as THREE from 'three';
import Lights from "./Lights";
import Cameras from "./Cameras";
import Materials from "./Materials";
import Import from "../Core/Import"
import ModelLoader from "../Core/ModelLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class Scene {

    constructor() {
        this.scene = null;
        this.rendererConfigs = {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        }

        this.init();
        this.imports = new Import();
        this.library = this.imports.loadLibrary();
        console.log("this.library:", this.library);     
    }

    init() {
        this.lights = new Lights();

        this.cameras = new Cameras({
            primary: {
                fov: 75,
                aspect: window.innerWidth / window.innerHeight,
                near: 0.01,
                far: 10000,
            }
        });        

        this.materials = new Materials();

        this.scene = new THREE.Scene();
        
        this.addToScene(this.lights.hemisphereLight);
        this.addToScene(this.lights.ambientLight);
        this.addToScene(this.lights.spotLight);                

        this.renderer = new THREE.WebGLRenderer(this.rendererConfigs);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.localClippingEnabled = true;

        // Add the fixed gradient background
        this.backgroundScene = new THREE.Scene();
        this.gradientBackground = this.createGradientBackground();
        this.backgroundScene.add(this.gradientBackground);

        // Add a grid to the scene
        this.grid = this.createGrid();
        this.addToScene(this.grid);
        
        this.cameras.primary.position.y = 4;
        this.cameras.primary.position.z = 5;

        this.cameras.primary.rotation.x = THREE.MathUtils.degToRad(-45);
        
        const animate = () => {
            requestAnimationFrame(animate);

            // Render the background scene first
            this.renderer.autoClear = false;
            this.renderer.clear();
            this.renderer.render(this.backgroundScene, this.cameras.primary);

            this.renderer.render(this.scene, this.cameras.primary);
        }
        
        animate();

        this.addOrbitControl();
    }

    // Method to create a gradient background using ShaderMaterial
    createGradientBackground() {
        // Define vertex and fragment shaders
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            varying vec2 vUv;
            void main() {
                gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
            }
        `;

        // Define shader uniforms for the colors
        const uniforms = {
            topColor: { value: new THREE.Color(0x87CEEB) },   // Light blue (sky color)
            bottomColor: { value: new THREE.Color(0xFFFFFF) } // White (ground color)
        };

        // Create ShaderMaterial
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            depthTest: false,  // Disable depth testing
            depthWrite: false  // Disable depth writing
        });

        // Create a full-screen quad
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -1; // Ensure it's always in the background

        return mesh;
    }

    // Method to create a grid helper and return it
    createGrid(size = 7, divisions = 14, color1 = 0x111111, color2 = 0x333333) {
        const gridHelper = new THREE.GridHelper(size, divisions, color1, color2);
        return gridHelper;
    }

    createDemoCube() {
        const geometry = new THREE.BoxGeometry();
        const material = this.materials.createStandardMaterial();
        const cube = new THREE.Mesh(geometry, material);
        cube.userData.height = 1;
        return cube;
    }

    addToScene(mesh) {
        this.scene.add(mesh);
    }

    addOrbitControl() {
        this.controls = new OrbitControls(this.cameras.primary, this.renderer.domElement);

        this.controls.autoRotate = false;
        this.controls.enableZoom = true;

        if (this.base) {
            this.controls.target.set(0, 0, this.base.configs.height)
        }
    }
}

export default Scene;