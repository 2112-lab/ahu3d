import * as THREE from 'three';
import Lights from "./Lights";
import Cameras from "./Cameras";
import Materials from "./Materials";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

class Scene {

    constructor() {
        this.ahuComponents = [];
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

        this.selectedMesh = null;

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

            for(const ahuComponent of this.ahuComponents) {
                const attributeKeys = Object.keys(ahuComponent.userData.component.attributes)
                if(attributeKeys.includes("setAnimation")) {
                    const attributeTargets = ahuComponent.userData.component.attributes.setAnimation.targets[0];
                    const targetMeshes = ahuComponent.children.filter(child => attributeTargets.includes(child.name));
                    for(const targetMesh of targetMeshes) {
                        this.animateMesh(targetMesh);
                    }
                }
            }
            
        }
        
        animate();

        this.addOrbitControl();
        this.addEventListeners();
    }

    animateMesh(targetMesh) {
        var timer = Date.now() * 0.0005;
        const animationAttribute = targetMesh.parent.userData.component.attributes.setAnimation;
        if (animationAttribute.value > 0) {
            targetMesh[animationAttribute.action][animationAttribute.axis] = (timer * -5) * animationAttribute.value;
        }
    }

    addEventListeners() {
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
    }

    onMouseDown(event) {
        if (this.tooltipObject && this.tooltipObject.element) {
            const tooltipRect = this.tooltipObject.element.getBoundingClientRect();
            const isInsideTooltip = (
                event.clientX >= tooltipRect.left &&
                event.clientX <= tooltipRect.right &&
                event.clientY >= tooltipRect.top &&
                event.clientY <= tooltipRect.bottom
            );
    
            if (isInsideTooltip) {
                // Click is inside the tooltip, so cancel the mesh click handling
                return;
            }
        }

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

            this.selectedMesh = mesh;

            this.showTooltip();
        } else if (this.tooltipParent && this.tooltipObject) {
            this.tooltipParent.remove(this.tooltipObject);
            this.tooltipParent = null;
            this.tooltipObject = null;
        }
    }
    

    showTooltip() {

        const meshComponentData = this.selectedMesh.userData.component;
        const meshAttributes = meshComponentData.attributes;

        const tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'tooltip';
        tooltipDiv.style.marginTop = '-1em';
        tooltipDiv.style.padding = '5px';
        tooltipDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        tooltipDiv.style.color = 'white';
        tooltipDiv.style.borderRadius = '5px';
        tooltipDiv.style.pointerEvents = 'auto';  // Allow pointer events
    
        // Create a first line of text
        const line1 = document.createElement('div');
        line1.style.marginBottom = '6px';
        line1.textContent = `Component: ${meshComponentData.componentName || 'Mesh'}`;
        tooltipDiv.appendChild(line1);
    
        // Create a second line with buttons and text
        const line2 = document.createElement('div');
        line2.style.display = 'flex';   // Arrange items in a row
        line2.style.alignItems = 'center';  // Center items vertically
        line2.style.whiteSpace = 'nowrap';  // Prevent wrapping
    
        // Create text div for the attribute key
        const attrKeys = Object.keys(meshAttributes);
        const attrKeyDiv = document.createElement('div');
    
        let attrKeyText = meshAttributes[attrKeys[0]].key;
        attrKeyText = attrKeyText[0].toUpperCase() + attrKeyText.slice(1);
    
        attrKeyDiv.textContent = `${attrKeyText}:`;
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
        
        // Add event listener for the "-" button
        minusButton.addEventListener('click', () => {
            const methodKey = attrKeys[0];
            const newValue = meshAttributes[attrKeys[0]].value - 1;

            if(newValue >= meshAttributes[methodKey].min && newValue <= meshAttributes[methodKey].max) {
                this.selectedMesh[methodKey](newValue);
                console.log(`Attribute value changed:`, meshAttributes[attrKeys[0]].value);
            }
        });
    
        // Create text div for the attribute value
        const attrValue = meshAttributes[attrKeys[0]].value;
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
        plusButton.style.pointerEvents = 'auto';  // Allow pointer events
    
        // Add event listener for the "+" button
        plusButton.addEventListener('click', () => {
            const methodKey = attrKeys[0];
            const newValue = meshAttributes[attrKeys[0]].value + 1;

            if(newValue >= meshAttributes[methodKey].min && newValue <= meshAttributes[methodKey].max) {
                this.selectedMesh[methodKey](newValue);
                console.log(`Attribute value changed:`, meshAttributes[attrKeys[0]].value);
            }
        });
    
        // Append buttons and text to the line2 div
        line2.appendChild(attrKeyDiv);
        line2.appendChild(minusButton);
        line2.appendChild(attrValueDiv);
        line2.appendChild(plusButton);
    
        // Append line2 to the tooltip
        tooltipDiv.appendChild(line2);
    
        const label = new CSS2DObject(tooltipDiv);
        label.position.set(0, 1.5, 0);  // Position the label slightly above the mesh
        this.selectedMesh.add(label);
    
        this.tooltipParent = this.selectedMesh;
        this.tooltipObject = label;
    }

    updateTooltip() {
        if (this.tooltipParent && this.tooltipObject) {
            this.tooltipParent.remove(this.tooltipObject);
            this.showTooltip();
        }        
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

    addOrbitControl() {
        this.controls = new OrbitControls(this.cameras.primary, this.renderer.domElement);
        this.controls.autoRotate = false;
        this.controls.enableZoom = true;

        if (this.base) {
            this.controls.target.set(0, 0, this.base.configs.height);
        }
    }

    addToScene(mesh) {
        this.scene.add(mesh);
    }
}

export default Scene;