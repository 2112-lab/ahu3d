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
 * Ahu3D-API.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * 
 */

import * as THREE from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

import axios from 'axios';

import Preprocess from "../Preprocess/_Preprocess.js"
import Assets3D from "../3D/Assets3D.js"
import Mesh3D from "../3D/Mesh3D.js"
import FlowControl from "./FlowControl.js"
import { sharedData } from './globals.js';

class Ahu3DAPI {
    constructor(ahu3DInstance) {
        this.ahu3D = ahu3DInstance;     
        this.libraryLoadInitiated = false;
        this.Mesh3D = new Mesh3D(this.sceneHelper);
        this.FlowControl = new FlowControl();
    }

    /**
     * loadLibrary
     * 
     * Loads component library entries from the specified asset configurations by sending asynchronous
     * requests to fetch JSON files and store their data.
     * 
     * @param {Object} assetConfigs - Configuration object with paths to assets and component list.
     * @returns {Object} The loaded files object.
     */
    async loadLibrary(assetConfigs) {

        this.libraryLoadInitiated = true;

        const files = {};
        const jsonFiles = assetConfigs.componentList;
        const assetsPath = assetConfigs.assetsPath;

        const requests = jsonFiles.map(fileName => {
            const requestPath = `${assetsPath}${fileName}/${fileName}.json`;
            return axios.get(requestPath) // Return the promise here
                .then(response => {
                    // console.log(`Loaded ${fileName}.json successfully`);
                    files[fileName] = response.data;
                })
                .catch(error => {
                    console.error(`Failed to load ${fileName}.json:`, error);
                });
        });

        await Promise.all(requests); // Wait for all promises to resolve

        this.library = files;

        sharedData.componentLibrary = files;
        // this.validator = new Validate(this.library);  

        this.Assets3D = new Assets3D(this.sceneHelper, this.library, assetConfigs);
        await this.Assets3D.loadInstanceSet();

        this.preprocess = new Preprocess(this.library);

        return this.library;
    }

    async runAhu3D(xeto, outputMode){

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

        const {cleanedXeto, ductsDictionary} = this.preprocess.preprocessXeto(xeto);

        console.log("runAhu3D cleanedXeto:", cleanedXeto);
        console.log("runAhu3D ductsDictionary:", ductsDictionary);

        this.FlowControl.cleanedXeto = cleanedXeto;
        this.FlowControl.ductsDictionary = ductsDictionary;

        if(!cleanedXeto) {
            return [];
        }

        this.sceneHelper.clearScene();

        const ahuObject = this.FlowControl.runAhu3D(cleanedXeto, outputMode);

        return ahuObject;
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

    setAttribute(key, value) {
        if (this.components[key]) {
            this.components[key].setAttribute(value);
        }
        else {
            console.warn(`Component with key ${key} not found`);
        }
    }

    setTransparency(key, transparency) {
        if (this.components[key]) {
            this.components[key].setTransparency(transparency);
        }
        else {
            console.warn(`Component with key ${key} not found`);
        }
    }

    loadComponent(component, isVisible = true, hvacOpacity = 1){
        this.Assets3D.loadComponent(component, isVisible, hvacOpacity);
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

        // Nullify other references
        this.library = null;

        console.log("Ahu3D disposed successfully.");
    }

}

export default Ahu3DAPI;
