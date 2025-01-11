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
 * Ahu3D.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This class manages the 3D representation of an AHU (Air Handling Unit) within the scene, 
 * handling loading of models, animations, and interactions within the 3D environment.
 * 
 */

import Scene from "./sceneHelper/Scene.js"
import Import from "./Core/Import.js"
import Object3DLoader from "./Core/Object3DLoader.js"
import Arithmetics from "./Core/Arithmetics.js"
import Utils from "./Core/Utils.js"
import moduleDefaults from './assets/module_defaults.json';
import _ from 'lodash';  // You can use lodash for deep merge

import * as THREE from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import Konva from 'konva';

class Ahu3D {

    /**
     * Creates an instance of Ahu3D and initializes the scene and loaders.
     * 
     * @param {Object} [moduleConfigs=moduleDefaults] - Configuration options for the AHU 3D module.
     */
    constructor(moduleConfigs = moduleDefaults) {
        this.moduleConfigs = _.merge({}, moduleDefaults, moduleConfigs);
        console.log("this.moduleConfigs:", this.moduleConfigs);

        this.sceneHelper = new Scene(this.moduleConfigs);
        this.imports = new Import(this.moduleConfigs);
        this.utils = new Utils(this.sceneHelper);
        this.object3DLoader = new Object3DLoader(this.sceneHelper);
        this.library = null;
        this.assetConfigs = null;
        this.instanceSet = null;
        this.libraryLoadInitiated = false;
        this.isLibraryLoaded = false;
        this.components = {};  // This object holds loaded assembly components
        this.loadedXeto = [];  // This object holds xeto
    }

    createDuct(size, type = "duct") {

        const id = { // inner-dimensions
            small: 500,
            medium: 1000,
            large: 1500
        }

        const wt = 30; // wall-thickness

        // Create the geometries with the specified dimensions
        const ceilingGeometry = new THREE.BoxGeometry(
            id[size], 
            id[size] + wt, 
            wt
        );
        const backWallGeometry = new THREE.BoxGeometry(
            id[size], 
            wt, 
            id[size]
        );
        const floorGeometry = new THREE.BoxGeometry(
            id[size], 
            id[size] + wt, 
            wt
        );

        // Create materials (using a basic color for now)
        const material1 = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: false });
        const material2 = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: false });
        const material3 = new THREE.MeshStandardMaterial({ color: 0x0000ff, wireframe: false });
        const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xAEB9C2, wireframe: false });

        // Create the meshes
        const ceiling = new THREE.Mesh(ceilingGeometry, whiteMaterial);
        const backWall = new THREE.Mesh(backWallGeometry, whiteMaterial);
        const floor = new THREE.Mesh(floorGeometry, whiteMaterial);

        // Position the cubes to make them appear joined
        ceiling.position.set(
            0,
            0,
            wt/2
        );
        backWall.position.set(
            0,
            id[size]/2,
            id[size]/-2
        );
        floor.position.set(
            0,
            0,
            id[size]*-1 -15
        );        

        // Create an empty Object3D container (works as an empty mesh or group)
        const parentObject = new THREE.Object3D();

        let leftWall = null;
        let rightWall = null;

        if(type.includes("joint")) {
            const leftWallGeometry = new THREE.BoxGeometry(
                wt, 
                id[size], 
                id[size]
            );
            const rightWallGeometry = new THREE.BoxGeometry(
                wt, 
                id[size], 
                id[size]
            );
            leftWall = new THREE.Mesh(leftWallGeometry, whiteMaterial);
            rightWall = new THREE.Mesh(rightWallGeometry, whiteMaterial);
            leftWall.position.set(
                id[size]/-2 - 15,
                0,
                id[size]/-2
            );
            rightWall.position.set(
                id[size]/ 2 + 15,
                0,
                id[size]/-2
            );
            
        }

        // Add the cubes to the parent object
        if(type != ("l-joint")) {
            parentObject.add(ceiling);
        }
        parentObject.add(backWall);
        parentObject.add(floor);
        if(type.includes("joint")) {
            parentObject.add(leftWall);
            parentObject.add(rightWall); 
        }   

        parentObject.position.z += id[size];

        // Add the cubes to the scene
        this.sceneHelper.addToScene(parentObject);
    }

    /**
     * Translates the position of a component along the Y-axis.
     * 
     * @param {string} componentId - The ID of the component to translate (e.g., "Fan-0", "Filter-2").
     * @param {number} translateValue - The amount of translation to apply along the Y-axis.
     * @returns {number} The actual translation value applied (can be less than or equal to the requested value, depending on constraints).
     * 
     * @example
     * ahu3d.translateY("Filter-2", 1000);
     */
    translateY(componentId, translateValue) {
        const component = this.components[componentId];
        if (component != undefined) {
            if(translateValue <= 0 && translateValue >= -2000) {
                component.position.y = translateValue;
                return translateValue;
            }
        }
        return 0;
    }

    // Private method for XZ translation
    // translateXZ(componentId, translateValue) {
    //     const component = this.components[componentId];
    //     if (component != undefined) {

    //         let ductOfComponent = null;
    //         outerLoop:
    //         for(const block of this.loadedXeto) {
    //             if(block.components) {
    //                 for(const component of block.components) {
    //                     if(component.includes(componentId)) {
    //                         ductOfComponent = block;
    //                         break outerLoop;
    //                     }
    //                 }
    //             }
    //         }

    //         for(const i in ductOfComponent.components) {
    //             ductOfComponent.components[i] = ductOfComponent.components[i].split("::")[1] || ductOfComponent.components[i];
    //         }

    //         const componentIndex = ductOfComponent.components.indexOf(componentId);

    //         const orientation = this.utils.getOrientation(ductOfComponent.graphicLocation.start, ductOfComponent.graphicLocation.end);

    //         const axis = orientation == 'east' || orientation == 'west' ? 'x' : 'z';

    //         if(translateValue === 0) {
    //             return 0;
    //         }
    //         else if(translateValue > 0) {
    //             const adjacentComponentIndex = componentIndex - 1;
    //             console.log("translate() componentIndex:", componentIndex);
    //             console.log("translate() ductOfComponent:", ductOfComponent);
    //             const adjacentComponentId = ductOfComponent.components[adjacentComponentIndex];
    //             const adjacentComponent = this.components[adjacentComponentId];
    //             console.log("translate() adjacentComponent:", adjacentComponent);

    //             const adjacentSpace = adjacentComponent ? adjacentComponent.userData.xeto.blockStyle.componentPadding.startSpace : 0;
    //             const componentSpace = component.userData.xeto.blockStyle.componentPadding.endSpace;

    //             const componentPairPadding = componentSpace + adjacentSpace;
    //             translateValue = Math.min(translateValue, componentPairPadding);
    //             component.position[axis] += translateValue;

    //             component.userData.xeto.blockStyle.componentPadding.startSpace += translateValue;
    //             component.userData.xeto.blockStyle.componentPadding.endSpace -= translateValue;
    //         }
    //         else if(translateValue < 0) {
    //             const adjacentComponentIndex = componentIndex + 1;
    //             console.log("translate() componentIndex:", componentIndex);
    //             const adjacentComponentId = ductOfComponent.components[adjacentComponentIndex];
    //             let adjacentComponent = this.components[adjacentComponentId];
    //             console.log("translate() adjacentComponent:", adjacentComponent);

    //             const adjacentSpace = adjacentComponent ? adjacentComponent.userData.xeto.blockStyle.componentPadding.endSpace : 0;
    //             const componentSpace = component.userData.xeto.blockStyle.componentPadding.startSpace;

    //             const componentPairPadding = componentSpace + adjacentSpace;
    //             translateValue = Math.min(translateValue * -1, componentPairPadding) * -1;
    //             component.position[axis] += translateValue;

    //             component.userData.xeto.blockStyle.componentPadding.startSpace += translateValue;
    //             component.userData.xeto.blockStyle.componentPadding.endSpace -= translateValue;
    //         }

    //         return translateValue;
    //     }

    //     return 0;
    // }
    
    /**
     * Sets a glowing effect on a specific component within the 3D scene.
     * This glow effect is created using the OutlinePass shader and cycles through the specified colors.
     * 
     * @param {string} componentId - The identifier of the component to apply the glow effect (e.g., "Fan-0", "Filter-2").
     * @param {Array<string>} [colors=['white']] - An array of colors (as strings) that the glow will cycle through.
     * @param {number} [edgeGlow=1] - The intensity of the glow around the edges (range: 0 to 1).
     * @param {number} [edgeThickness=4] - The thickness of the glowing edges (range: 1 to 4).
     * @param {number} [edgeStrengthFactor=6] - A multiplier for the strength of the glowing edges (greater values produce stronger effects).
     * 
     * @example
     * const ahu3d = new Ahu3D();
     * ahu3d.setGlow("Fan-1", ["red", "#00ff00"]); // Colors can be defined as either names or hex values.
     */
    setGlow(componentId, colors = ['white'], edgeGlow = 1, edgeThickness = 4, edgeStrengthFactor = 6) {       
        const component = this.components[componentId];
        if (component != undefined) {

            if(component.userData.colorQueue != undefined) {
                this.removeGlow(componentId);
            }

            // If the component is already in the glowingMeshes array, remove it from the array.
            const index = this.sceneHelper.glowingMeshes.indexOf(component);
            if (index !== -1) {
                this.glowingMeshes.splice(index, 1);
            }

            // If the component already has an outlinePass, remove it.
            if (component.userData.outlinePass) {
                this.composer.removePass(component.userData.outlinePass);
                delete component.userData.outlinePass; // Remove reference
            }

            // Assign the colors to the mesh's colorQueue
            component.userData.colorQueue = [];
            for (const color of colors) {
                component.userData.colorQueue.push(new THREE.Color(color));
            }
    
            // Create a new OutlinePass specifically for this component
            const newOutlinePass = new OutlinePass(
                new THREE.Vector2(
                    1 / this.moduleConfigs.scene.renderer.size.width, 
                    1 / this.moduleConfigs.scene.renderer.size.height
                ),
                this.sceneHelper.scene,
                this.sceneHelper.cameras.primary
            );
            newOutlinePass.edgeGlow = edgeGlow; // Glow around edges: 0 - 1
            newOutlinePass.edgeThickness = edgeThickness; // Edge thickness: 1 - 4
            component.userData.edgeStrengthFactor = edgeStrengthFactor; // Edge Strength Multiplier: 0 - infinity
            newOutlinePass.hiddenEdgeColor.set(0x000000);
    
            // Set the current component to glow (selectedObjects)
            newOutlinePass.selectedObjects = [component];
            
            // Store the outline pass reference in the component's userData for later update
            component.userData.outlinePass = newOutlinePass;
    
            // Add the OutlinePass to the composer (important to add it to the rendering pipeline)
            this.sceneHelper.composer.addPass(newOutlinePass);
    
            // Add the component to the glowingMeshes array so it gets updated in the cycle
            this.sceneHelper.glowingMeshes.push(component);
        }
    }

    removeGlow(componentId) {
        const component = this.components[componentId];
        if (!component) {
            console.warn(`Component not found: ${componentId}`);
            return;
        }
    
        // Remove the component from the glowingMeshes array
        const index = this.sceneHelper.glowingMeshes.indexOf(component);
        if (index !== -1) {
            this.sceneHelper.glowingMeshes.splice(index, 1);
        }
    
        // Remove the OutlinePass from the composer
        if (component.userData.outlinePass) {
            this.sceneHelper.composer.removePass(component.userData.outlinePass);
            delete component.userData.outlinePass; // Remove reference
        }
    
        // Clear the colorQueue
        if (component.userData.colorQueue) {
            component.userData.colorQueue = undefined;
        }
    
        console.log(`Glow removed for component: ${componentId}`);
    }    
    
    /**
     * Sets the duration for the glow cycle effect across all glowing components in the scene.
     * 
     * @param {number} duration - The total duration (in milliseconds) for the glow cycle to complete.
     * 
     * @example
     * const ahu3d = new Ahu3D();
     * ahu3d.setGlowCycleDuration(3000);
     */
    setGlowCycleDuration(duration) {
        // The duration unit is in ms.
        this.sceneHelper.glowCycleDuration = duration;
    }

    /**
     * Attaches the 3D scene to the DOM.
     * 
     * @param {string} selectorTag - The DOM selector for the container to attach the scene to.
     * 
     * @example
     * const ahu3d = new Ahu3D();
     * ahu3d.attachScene("#sceneContainer");
     */
    attachScene(selectorTag) {
        const container = document.querySelector(selectorTag);
        container.appendChild(this.sceneHelper.renderer.domElement);
    }

    /**
     * Loads the asset library from the application using provided configurations.
     * 
     * @param {Object} assetConfigs - Configuration object for loading assets.
     * @returns {Promise<Object>} The loaded library.
     * 
     * @example
     * const assetConfigs = {
     *   "assetsPath": "https://novo-assets.s3.amazonaws.com/assets/",
     *   "componentList": ["Filter", "Fan", "Damper"]
     * };
     * ahu3d.loadLibrary(assetConfigs).then((library) => {
     *   console.log("Library loaded:", library);
     * });
     */
    async loadLibrary(assetConfigs) {
        this.libraryLoadInitiated = true;

        this.assetConfigs = assetConfigs;
        this.object3DLoader.assetConfigs = assetConfigs;

        this.library = await this.imports.loadLibrary(assetConfigs);

        this.utils.library = this.library;
        this.utils.object3DLoader = this.object3DLoader;

        await this.utils.loadInstanceSet();
        console.log('Instances are ready')

        this.arithmetics = new Arithmetics(this.library, this.sceneHelper);

        this.isLibraryLoaded = true;

        return this.library;
    }

    /**
     * Loads and processes a XETO model for the AHU and renders it in the scene.
     * 
     * @param {Object} xeto - The XETO model data to be loaded.
     * @returns {Promise<Object>} The processed AHU assembly.
     * 
     * @example
     * const xetoData = { ... };
     * ahu3d.loadXeto(xetoData).then((assembly) => {
     *   console.log("Assembly loaded:", assembly);
     * });
     */
    async loadXeto(xeto) {

        // Ensure that the loadLibrary method has been invoked.
        if(this.libraryLoadInitiated == false) {
            alert("Please load in the asset library before loading xeto.");
            return null;
        }

        // This setInterval function will loop until the library is loaded.
        if(this.isLibraryLoaded == false) {
            await new Promise((resolve) => {
                const checkLibraryInterval = setInterval(() => {
                    if (this.isLibraryLoaded) {
                        clearInterval(checkLibraryInterval);
                        resolve();
                    }
                }, 100); // Check every 100ms
            });
        }        

        const cleanedXeto = this.imports.preprocessXeto(xeto);

        this.loadedXeto = cleanedXeto;

        if(!cleanedXeto) {
            return [];
        }

        console.log("cleanedXeto:", cleanedXeto);

        this.sceneHelper.clearScene();

        const assembly = await this.arithmetics.calculateAssembly(cleanedXeto);

        const renderedAssembly = await this.utils.renderAssembly(assembly);

        this.sceneHelper.fitAssemblyIntoView();

        for(const component of renderedAssembly) {
            this.components[component.userData.component.componentId.split("::")[1]] = component;
        }

        return renderedAssembly;
    }

    /**
     * Toggles the visibility of the grid in the scene.
     * 
     * @example
     * ahu3d.toggleGrid();
     */
    toggleGrid() {
        this.sceneHelper.grid.visible = !this.sceneHelper.grid.visible;
    }

    /**
     * Toggles the selector functionality in the scene.
     * 
     * @example
     * ahu3d.toggleSelector();
     */
    toggleSelector() {
        this.sceneHelper.selectorEnabled = !this.sceneHelper.selectorEnabled;
    }

    /**
     * Toggles the tooltips in the scene.
     * 
     * @example
     * ahu3d.toggleTooltip();
     */
    toggleTooltip() {
        this.sceneHelper.tooltipEnabled = !this.sceneHelper.tooltipEnabled;
    }

    /**
     * Sets an attribute for a specific component.
     * 
     * @param {string} key - The key for the component (e.g., "Fan-1", "Filter-2").
     * @param {number|string} value - The value to set for the attribute.
     * 
     * @example
     * const ahu3d = new Ahu3D();
     * ahu3d.loadXeto(xetoData).then(() => {
     *   // Set attribute for a specific component
     *   ahu3d.setAttribute("Fan-1", 10);
     * });
     */
    setAttribute(key, value) {
        if (this.components[key]) {
            this.components[key].setAttribute(value);
        }
        else {
            console.warn(`Component with key ${key} not found`);
        }
    }

    /**
     * Sets the transparency for a specific component.
     * 
     * @param {string} key - The key for the component (e.g., "Fan-1", "Filter-2").
     * @param {number} transparency - A value between 0 (fully transparent) and 1 (fully opaque).
     * 
     * @example
     * const ahu3d = new Ahu3D();
     * ahu3d.loadXeto(xetoData).then(() => {
     *   // Set transparency for a specific component
     *   ahu3d.setTransparency("Fan-1", 0.5);
     * });
     */
    setTransparency(key, transparency) {
        if (this.components[key]) {
            this.components[key].setTransparency(transparency);
        }
        else {
            console.warn(`Component with key ${key} not found`);
        }
    }

    dispose() {
        console.log("Disposing Ahu3D...");
        
        // Dispose scene resources
        if (this.sceneHelper) {
            this.sceneHelper.dispose();
            this.sceneHelper = null;
        }

        // Clear components
        this.components = {};

        // Nullify utility references
        this.imports = null;
        this.utils = null;
        this.object3DLoader = null;

        // Nullify other references
        this.library = null;
        this.loadedXeto = null;

        console.log("Ahu3D disposed successfully.");
    }

}

export default Ahu3D;
