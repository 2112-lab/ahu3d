//////////////////////////////////////////////////////////////////////////////////////
//
//	AHU3D - A Javascript Module for Parametric Design Tool for Air Handling Units.
//
//
//	    LIMITED TEMPORARY LICENSE FOR DEMO PURPOSES ONLY - EXPIRES 2025/01/01
//
//
//		   NOT AUTHORIZED FOR PRODUCTION DEPLOYENT OR REDISTRIBUTION.
//
//
//				PROPERTY OF COGNITIVE DYNAMICS LTD.
//
//
//				    ALL RIGHTS RESERVED - 2024.
//
//////////////////////////////////////////////////////////////////////////////////////

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
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

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
        this.renderer.autoClear = false;

        // this.renderer.setSize(this.moduleConfigs.scene.renderer.size.width, this.moduleConfigs.scene.renderer.size.height);
        
        const supersampleFactor = 2; // Change this factor to control the level of supersampling (2x, 4x, etc.)

        this.renderer.setSize(
            this.moduleConfigs.scene.renderer.size.width * supersampleFactor,
            this.moduleConfigs.scene.renderer.size.height * supersampleFactor,
            false  // The 'false' flag keeps the canvas size unchanged
        );

        this.renderer.domElement.style.width = `${this.moduleConfigs.scene.renderer.size.width}px`;
        this.renderer.domElement.style.height = `${this.moduleConfigs.scene.renderer.size.height}px`;

        this.cameras.primary.aspect = this.moduleConfigs.scene.renderer.size.width / this.moduleConfigs.scene.renderer.size.height;
        this.cameras.primary.updateProjectionMatrix();


        // this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.localClippingEnabled = true;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));

        this.createComposer();

        // Initialize the CSS2DRenderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(
            this.moduleConfigs.scene.renderer.size.width, 
            this.moduleConfigs.scene.renderer.size.height
        );
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

        if(this.moduleConfigs.scene.background !== null) {
            // Create a fixed gradient background
            this.backgroundScene = new THREE.Scene();
            this.gradientBackground = this.createGradientBackground();
            this.backgroundScene.add(this.gradientBackground);
        }
        
        // Add a grid to the scene
        this.grid = this.createGrid();
        this.grid.rotation.x = 90 * Math.PI/180;
        this.grid.visible = this.moduleConfigs.ui.showGrid;
        console.log("this.grid:", this.grid);
        this.addToScene(this.grid);
        
        this.cameras.primary.position.y = 5;
        this.cameras.primary.position.z = 5;

        this.glowCycleDuration = 3000;
        this.glowingMeshes = [];

        // Handle WebGL context loss and restoration
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.error('WebGL context lost');
        });

        canvas.addEventListener('webglcontextrestored', (event) => {
            console.log('WebGL context restored');
            this.init(); // Reinitialize the scene when context is restored
        });

        let lastUpdate = 0;
        const updateInterval = 40; // Units in ms
        
        const animate = (time) => {
            requestAnimationFrame(animate);

            this.renderer.render(this.scene, this.cameras.primary);

            if (time - lastUpdate > updateInterval) {
                this.updateComposerAndTooltip();

                // Animate only the cached objects
                this.animateCachedTargets();

                lastUpdate = time;
            }
            
        }
        
        requestAnimationFrame(animate);

        this.addOrbitControl();
        this.addEventListeners();
    }

    // Step 1: Cache objects needing animation during initialization
    cacheAnimationTargets() {
        this.animatedObjects = []; // Store all objects that need animation

        this.scene.traverse((object3d) => {
            if (object3d.isObject3D && object3d.name === 'hvac') {
                const attributes = object3d.userData.component?.attributes;
                if (attributes && attributes.setAnimation) {
                    // Cache the object and its target meshes for animation
                    const attributeTargets = attributes.setAnimation.targets[0];
                    const targetMeshes = object3d.children.filter(child => attributeTargets.includes(child.name));
                    this.animatedObjects.push({ object3d, targetMeshes });
                }
            }
        });
    }

    animateCachedTargets() {
        for (const entry of this.animatedObjects) {
            const { object3d, targetMeshes } = entry;
            for (const targetMesh of targetMeshes) {
                this.animateMesh(targetMesh); // Apply the animation to the target meshes
            }
        }
    }

    updateComposerAndTooltip(){
        this.labelRenderer.render(this.scene, this.cameras.primary);

        this.cycleGlowColors();
        this.composer.render();
    }

    cycleGlowColors() {
        // Normalize time to [0, 1] based on the full glow cycle duration
        const time = (Date.now() % this.glowCycleDuration) / this.glowCycleDuration;
    
        // Reusable color object to avoid creating new ones each frame
        const currentColor = new THREE.Color();
    
        this.glowingMeshes.forEach((mesh) => {
            const colorQueue = mesh.userData.colorQueue;
    
            // If no colors are defined, set the edge strength to zero and skip
            if (!colorQueue || colorQueue.length === 0) {
                mesh.userData.outlinePass.edgeStrength = 0;
                return;
            }
    
            // Ensure there are at least two colors for interpolation
            const numColors = colorQueue.length === 1 ? 2 : colorQueue.length;
            const colors = colorQueue.length === 1 ? [colorQueue[0], colorQueue[0]] : colorQueue;
    
            // Calculate phase duration and current phase index
            const phaseDuration = 1 / numColors;
            const phaseIndex = Math.floor(time / phaseDuration);
            const phaseTime = (time - phaseIndex * phaseDuration) / phaseDuration;
    
            // Get the current and next colors
            const startColor = colors[phaseIndex % numColors];
            const endColor = colors[(phaseIndex + 1) % numColors];
    
            // Manual color interpolation (linear interpolation)
            currentColor.r = startColor.r + (endColor.r - startColor.r) * phaseTime;
            currentColor.g = startColor.g + (endColor.g - startColor.g) * phaseTime;
            currentColor.b = startColor.b + (endColor.b - startColor.b) * phaseTime;
    
            // Calculate the edge strength (fades in and out)
            const edgeStrength = Math.abs(1 - 2 * phaseTime) * mesh.userData.edgeStrengthFactor;
    
            // Apply the color and edge strength to the mesh's outline pass
            if (mesh.userData.outlinePass) {
                mesh.userData.outlinePass.visibleEdgeColor.set(currentColor.multiplyScalar(0.5));
                mesh.userData.outlinePass.edgeStrength = edgeStrength;
            }
        });
    }       

    createComposer() {
        this.composer = new EffectComposer(this.renderer);

        // Add the render pass (renders the scene normally)
        const renderPass = new RenderPass(this.scene, this.cameras.primary);
        this.composer.addPass(renderPass);

        this.outlinePass = new OutlinePass(new THREE.Vector2(
            1 / this.moduleConfigs.scene.renderer.size.width, 
            1 / this.moduleConfigs.scene.renderer.size.height
        ), this.scene, this.cameras.primary);
        this.composer.addPass(this.outlinePass); 

        // this.outlinePassColors = ['#FF0000', '#FFFF00', '#FFA500'];
        // this.outlinePasses = {};        
        // for(const color of this.outlinePassColors) {            
                       
        // }

        // Optional: FXAA pass for anti-aliasing (improves the visual quality)
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.set(
            1 / this.moduleConfigs.scene.renderer.size.width, 
            1 / this.moduleConfigs.scene.renderer.size.height
        );
        this.composer.addPass(fxaaPass);

    }

    updateTextOrientation(textMesh, camera) {
        if (!textMesh || !camera) return;
    
        // Calculate the direction from the text to the camera
        var direction = new THREE.Vector3().subVectors(camera.position, textMesh.position).normalize();
    
        // Create a quaternion that represents the rotation needed to align the text's y-axis with the direction vector
        var up = new THREE.Vector3(0, 1, 0); // Y-axis
        var quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    
        // Apply the quaternion to the text mesh
        textMesh.quaternion.copy(quaternion);
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
            this.scene.children.filter(child => child.name === 'hvac' && child.visible)
        );

        if (hvacIntersects.length > 0) {
            let mesh = hvacIntersects[0].object.parent;
            if(mesh.parent.name === "hvac") {
                mesh = mesh.parent;
            }
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
        tooltipElement.querySelector('.tooltip-header').textContent = (meshComponentData.componentId.split("::")[1]) || 'Mesh';
    
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
    
        const tooltipWidth = 150;
    
        // Set the position of the tooltip using CSS
        tooltipElement.style.position = 'absolute';
        tooltipElement.style.left = `${(0) + (tooltipWidth / 2)}px`;
        tooltipElement.style.pointerEvents = 'none'; // Optional: prevents interference with mouse events
    
        // Add the tooltip as a CSS2DObject
        const label = new CSS2DObject(tooltipElement);
    
        // Add the label to the mesh
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
        let uniforms = {};

        for(const color in this.moduleConfigs.scene.background) {
            uniforms[color] = { value: new THREE.Color(this.moduleConfigs.scene.background[color]) }
        }

        // if(process.env.NODE_ENV === 'development') {
        //     uniforms = {
        //         bottomColor: { value: new THREE.Color("#000000") },   // Dark blue for the night sky
        //         topColor : { value: new THREE.Color("#3B5F8A") } // Darker blue for the ground at night
        //     };
        // }

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
            if (object.isObject3D && object.name == 'hvac' && object.visible) {
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
            color: 0x0000FF,
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
          (child) => child.name == 'hvac' && child.isObject3D && child.visible
        );
      
        sceneChildren.forEach((child) => {
          child.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (object.material.map) object.material.map.dispose();
              object.material.dispose();
            }
          });
          this.scene.remove(child);
        });
      
        const sceneIndicators = this.scene.children.filter(
          (child) => child.name == 'arrowClone' && child.visible || child.name == 'textMesh' && child.visible
        );
        sceneIndicators.forEach((child) => {
          this.scene.remove(child);
        });
        
        this.glowingMeshes = [];
    }
      

    rendererToBlob(callback) {
        console.log("rendering perspective camera");
        this.controls.update();
        this.renderer.render(this.scene, this.cameras.primary);
    
        this.renderer.domElement.toBlob(callback, 'image/png')
    }
}

export default Scene;