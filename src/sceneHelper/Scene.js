/*
 * Scene.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module manages the 3D scene setup, including adding objects, 
 * configuring interactions, and updating animations.
 * 
 */
import * as THREE from 'three';
import Lights from "./Lights.js";
import Cameras from "./Cameras.js";
import Materials from "./Materials.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import tooltipTemplate from '../assets/tooltip.html';

class Scene {

    constructor(moduleConfigs) {
        this.moduleConfigs = moduleConfigs;

        this.boxHelpers = null;

        this.selectorEnabled = this.moduleConfigs.ui.showSelector;
        this.tooltipEnabled = this.moduleConfigs.ui.showTooltip;
        this.grid = null;
        this.ahuComponents = [];
        this.tooltipTemplate = tooltipTemplate; // Store the imported HTML template
        this.init();
    }

    addDefaultLights(instanceLights) {
        //Add lights in scene
        Object.values(instanceLights.lights).forEach((light) => {
            this.scene.add(light);
        })
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.scale.set(0.001, 0.001, 0.001);

        this.selectedObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.isDragging = false;

        //add default lights
        const instanceLights = new Lights(this.moduleConfigs.scene.lights);
        this.addDefaultLights(instanceLights);

        this.cameras = new Cameras(this.moduleConfigs.scene.cameras, this.moduleConfigs.scene.renderer.size);
        
        this.cameras.primary.up.set(0, 0, 1);
        this.scene.rotation.z = 180 * Math.PI/180;

        this.materials = new Materials();

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(this.moduleConfigs.scene.renderer.size.width, this.moduleConfigs.scene.renderer.size.height);

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
        this.grid.rotation.x = 90 * Math.PI/180;
        // this.grid.set(0, 0, 1);
        this.addToScene(this.grid);

        console.log("this.grid:", this.grid);
        
        this.cameras.primary.position.y = 5;
        this.cameras.primary.position.z = 5;
        // this.cameras.primary.rotation.z = THREE.MathUtils.degToRad(-45);
        
        const animate = () => {
            requestAnimationFrame(animate);
            this.renderer.autoClear = false;
            this.renderer.clear();
            this.renderer.render(this.backgroundScene, this.cameras.primary);
            this.renderer.render(this.scene, this.cameras.primary);
            this.labelRenderer.render(this.scene, this.cameras.primary);

            this.scene.traverse((ahuComponent) => {
                if (ahuComponent.isObject3D && ahuComponent.name == 'hvac') {

                    const attributeKeys = Object.keys(ahuComponent.userData.component.attributes)
                    if(attributeKeys.includes("setAnimation")) {
                        const attributeTargets = ahuComponent.userData.component.attributes.setAnimation.targets[0];
                        const targetMeshes = ahuComponent.children.filter(child => attributeTargets.includes(child.name));
                        for(const targetMesh of targetMeshes) {
                            this.animateMesh(targetMesh);
                        }
                    }
                }
            });

            for(const ahuComponent of this.ahuComponents) {
                
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
        this.scene.remove(this.boxHelpers);
        if(this.selectorEnabled) {
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

            if (this.tooltipParent && this.tooltipObject) {
                this.tooltipParent.remove(this.tooltipObject);
                this.tooltipParent = null;
                this.tooltipObject = null;
            }

            this.onMeshClick(event);
        }
    }

    onMeshClick(event) {
        // event.preventDefault();

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

            if(mesh.userData.component.isComponent) {
                this.selectedMesh = mesh;
                if(this.tooltipEnabled) {
                    this.addBoundingBox();
                    this.showTooltip();
                }
            }            
        } 
        else if (this.tooltipParent && this.tooltipObject) {
            this.tooltipParent.remove(this.tooltipObject);
            this.tooltipParent = null;
            this.tooltipObject = null;
        }
    }
    
    showTooltip() {
        const meshComponentData = this.selectedMesh.userData.component;
        const meshAttributes = meshComponentData.attributes;

        // Clone the loaded template
        const tooltipDiv = document.createElement('div');
        tooltipDiv.innerHTML = this.tooltipTemplate.trim(); // Use the imported template
        const tooltipElement = tooltipDiv.firstElementChild;

        // Update the tooltip content
        tooltipElement.querySelector('.tooltip-header').textContent = meshComponentData.componentName || 'Mesh';

        const attrKeys = Object.keys(meshAttributes);
        const attrKeyDiv = tooltipElement.querySelector('.tooltip-key');
        const attrValueDiv = tooltipElement.querySelector('.tooltip-value');
        attrKeyDiv.textContent = `${meshAttributes[attrKeys[0]].key}:`;
        attrValueDiv.textContent = `${meshAttributes[attrKeys[0]].value}`;

        const minusButton = tooltipElement.querySelector('.tooltip-minus');
        const plusButton = tooltipElement.querySelector('.tooltip-plus');

        if (attrKeys[0] !== 'setInput') {
            minusButton.addEventListener('click', () => {
                const methodKey = attrKeys[0];
                const newValue = meshAttributes[attrKeys[0]].value - meshAttributes[attrKeys[0]].step;
                if (newValue >= meshAttributes[methodKey].min && newValue <= meshAttributes[methodKey].max) {
                    this.selectedMesh[methodKey](newValue);
                }
            });

            plusButton.addEventListener('click', () => {
                const methodKey = attrKeys[0];
                const newValue = meshAttributes[attrKeys[0]].value + meshAttributes[attrKeys[0]].step;
                if (newValue >= meshAttributes[methodKey].min && newValue <= meshAttributes[methodKey].max) {
                    this.selectedMesh[methodKey](newValue);
                }
            });
        } else {
            minusButton.style.display = 'none';
            plusButton.style.display = 'none';
        }

        const label = new CSS2DObject(tooltipElement);
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
        let uniforms = {
            topColor: { value: new THREE.Color(0x87CEEB) },   // Light blue (sky color)
            bottomColor: { value: new THREE.Color(0xFFFFFF) } // White (ground color)
        };

        if(process.env.NODE_ENV === 'development') {
            uniforms = {
                bottomColor: { value: new THREE.Color(0x000000) },   // Even lighter blue for the night sky
                topColor : { value: new THREE.Color(0x3B5F8A) } // Lighter blue for the ground at night
            };
        }

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
    createGrid(size = 7000, divisions = 14, color1 = 0x777777, color2 = 0x555555) {
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

    fitAssemblyIntoView() {
        const camera = this.cameras.primary;

        const box = new THREE.Box3();
        this.scene.traverse((object) => {
            if (object.isObject3D && object.name == 'hvac') {
                const objectBox = new THREE.Box3().setFromObject(object);
                box.union(objectBox); // Expand the bounding box to include the object's box
            }
        });

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxSize = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180); // Convert field of view to radians
        const cameraDistance = maxSize / (2 * Math.tan(fov / 2));

        // Update the camera position
        camera.position.copy(center);
        camera.position.y += cameraDistance + 2; // Move the camera back along the z-axis
        camera.position.z = center.z + 2;
        camera.updateProjectionMatrix();

        camera.lookAt(center);

        // Update the OrbitControls' target
        this.controls.target.copy(center);
        this.controls.update(); // Ensure the controls are updated
    } 

    addBoundingBox() {
        const dimensions = this.selectedMesh.userData.component.object.boundingBox.dimensions;

        // Create a box geometry using the bounding box dimensions
        const boxGeometry = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);

        // Create edges geometry from the box geometry
        const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

        // Create a line material
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xFF0000,
        });

        // Create a line segments mesh from the edges geometry and line material
        this.boxHelpers = new THREE.LineSegments(edgesGeometry, lineMaterial);

        this.boxHelpers.position.copy(this.selectedMesh.position);
        this.boxHelpers.rotation.copy(this.selectedMesh.rotation);
        this.boxHelpers.position.x += this.selectedMesh.userData.component.object.boundingBox.origin.x;
        this.boxHelpers.position.y += this.selectedMesh.userData.component.object.boundingBox.origin.y;
        this.boxHelpers.position.z += this.selectedMesh.userData.component.object.boundingBox.origin.z;

        // Step 3: Add the helper to the scene
        this.addToScene(this.boxHelpers);
    }

    addToScene(mesh) {
        this.scene.add(mesh);
    }

    clearScene() {
        console.log("clearScene started:");
        const sceneChildren = this.scene.children.filter(
            (child) => child.name == 'hvac' && child.isObject3D
        );
        sceneChildren.forEach((child) => {
            this.scene.remove(child);
        });
    }
}

export default Scene;