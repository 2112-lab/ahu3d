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
import Import from "./core/Import.js"
import Object3DLoader from "./core/Object3DLoader.js"
import Arithmetics from "./core/Arithmetics.js"
import Utils from "./core/Utils.js"
import moduleDefaults from './assets/module_defaults.json';
import _ from 'lodash';  // You can use lodash for deep merge

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
