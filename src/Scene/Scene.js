import * as THREE from 'three';
import Lights from "./Lights";
import Cameras from "./Cameras";
import Materials from "./Materials";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

class Scene {

    constructor() {
        this.ahuComponents = [];
        this.animatedComponents = [];
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();

        this.selectedObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.isDragging = false;

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
        this.addToScene(this.lights.hemisphereLight);
        this.addToScene(this.lights.ambientLight);
        this.addToScene(this.lights.spotLight);                

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.localClippingEnabled = true;

        // Initialize the CSS2DRenderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.labelRenderer.domElement.style.top = '0px';
        document.body.appendChild(this.labelRenderer.domElement);

        if(this.tooltipParent != null) {
            this.tooltipParent.remove(this.tooltipObject);
        }
        this.tooltipParent = null;
        this.tooltipObject = null;

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
            this.renderer.autoClear = false;
            this.renderer.clear();
            this.renderer.render(this.backgroundScene, this.cameras.primary);
            this.renderer.render(this.scene, this.cameras.primary);
            this.labelRenderer.render(this.scene, this.cameras.primary);

            for(const animatedComponent of this.animatedComponents) {
                const attributeTarget = animatedComponent.userData.component.attributes.speed.targets[0];
                const targetMesh = animatedComponent.children.filter(child => child.name === attributeTarget)[0];
                this.spinMesh(targetMesh);
            }
            
        }
        
        animate();

        this.addOrbitControl();
        this.addEventListeners();
    }

    spinMesh(targetMesh) {
        var timer = Date.now() * 0.0005;
        const speedAttribute = targetMesh.parent.userData.component.attributes['speed'];
        if (speedAttribute.value > 0) {
            targetMesh.rotation[speedAttribute.axis] = (timer * -5) * speedAttribute.value;
        }
    }

    addEventListeners() {
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    onMouseDown(event) {
        this.isDragging = false;
    }

    onMouseMove(event) {
        this.isDragging = true;
    }

    onMouseUp(event) {
        this.onMeshClick(event);
    }

    onMeshClick(event) {
        event.preventDefault();

        this.boundingClientRect = this.renderer.domElement.getBoundingClientRect();    
        this.mouseVector.x = ((event.clientX - this.boundingClientRect.left) / this.boundingClientRect.width) * 2 - 1;
        this.mouseVector.y = -((event.clientY - this.boundingClientRect.top) / this.boundingClientRect.height) * 2 + 1;
    
        this.cameras.primary.updateMatrixWorld();
        this.raycaster.setFromCamera(this.mouseVector, this.cameras.primary);
    
        const hvacIntersects = this.raycaster.intersectObjects(
            this.scene.children.filter(child => child.name === 'hvac')
        );

        if (hvacIntersects.length > 0) {
            const mesh = hvacIntersects[0].object.parent;
            console.log("mesh:", mesh);
            this.showTooltip(mesh);
        } else if (this.tooltipParent && this.tooltipObject) {
            this.tooltipParent.remove(this.tooltipObject);
            this.tooltipParent = null;
            this.tooltipObject = null;
        }
    }
    

    showTooltip(mesh) {
        const tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'tooltip';
        tooltipDiv.style.marginTop = '-1em';
        tooltipDiv.style.padding = '5px';
        tooltipDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        tooltipDiv.style.color = 'white';
        tooltipDiv.style.borderRadius = '5px';
    
        // Create a first line of text
        const line1 = document.createElement('div');
        line1.style.marginBottom = '6px';
        line1.textContent = `Component: ${mesh.userData.component.componentName || 'Mesh'}`;
        tooltipDiv.appendChild(line1);
    
        // Create a second line with buttons and text
        const line2 = document.createElement('div');
        line2.style.display = 'flex';   // Arrange items in a row
        line2.style.alignItems = 'center';  // Center items vertically
        line2.style.whiteSpace = 'nowrap';  // Prevent wrapping
    
        // Create text div for the attribute key
        const attrKeys = Object.keys(mesh.userData.component.attributes);
        const attrKeyDiv = document.createElement('div');
        attrKeyDiv.textContent = `${attrKeys[0]}:`;
        attrKeyDiv.style.marginRight = '8px'; // Add some space between the key and the button
    
        // Create "-" button
        const minusButton = document.createElement('button');
        minusButton.textContent = '-';
        minusButton.style.width = '24px';
        minusButton.style.height = '24px';
        minusButton.style.borderRadius = '50%';  // Make it circular
        minusButton.style.backgroundColor = 'rgba(200, 200, 200, 0.4)';
        minusButton.style.color = 'white';
        minusButton.style.border = 'none';
        minusButton.style.marginRight = '8px';  // Add some space between the button and the text    
        
        // Create text div for the attribute value
        const attrValue = mesh.userData.component.attributes[attrKeys[0]].value;
        const attrValueDiv = document.createElement('div');
        attrValueDiv.textContent = `${attrValue}`;
        attrValueDiv.style.marginRight = '8px'; // Add some space between the value and the button
    
        // Create "+" button
        const plusButton = document.createElement('button');
        plusButton.textContent = '+';
        plusButton.style.width = '24px';
        plusButton.style.height = '24px';
        plusButton.style.borderRadius = '50%';  // Make it circular
        plusButton.style.backgroundColor = 'rgba(200, 200, 200, 0.4)';
        plusButton.style.color = 'white';
        plusButton.style.border = 'none';
    
        // Append buttons and text to the line2 div
        line2.appendChild(attrKeyDiv);
        line2.appendChild(minusButton);
        line2.appendChild(attrValueDiv);
        line2.appendChild(plusButton);
    
        // Append line2 to the tooltip
        tooltipDiv.appendChild(line2);
    
        const label = new CSS2DObject(tooltipDiv);
        label.position.set(0, 1.5, 0);  // Position the label slightly above the mesh
        mesh.add(label);
    
        this.tooltipParent = mesh;
        this.tooltipObject = label;
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
            this.controls.target.set(0, 0, this.base.configs.height);
        }
    }
}

export default Scene;