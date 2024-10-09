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
        this.imports = new Import();
        this.utils = new Utils(this.sceneHelper);
        this.object3DLoader = new Object3DLoader(this.sceneHelper);
        this.library = null;
        this.assetConfigs = null;
        this.instanceSet = null;
        this.libraryLoadInitiated = false;
        this.isLibraryLoaded = false;
        this.components = {};  // This object holds loaded assembly components
    }
    
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

        if(!cleanedXeto) {
            return;
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

}

export default Ahu3D;
