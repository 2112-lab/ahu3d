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

class Ahu3D {

    /**
     * Creates an instance of Ahu3D and initializes the scene and loaders.
     * 
     * @param {number} [rendererScale=1] - The scale for the renderer, default is 1.
     * @param {boolean} [selectorEnabled=true] - Enables the selector, default is true.
     * @param {boolean} [tooltipEnabled=true] - Enables tooltips, default is true.
     */
    constructor(rendererScale = 1, selectorEnabled = true, tooltipEnabled = true) {
        this.sceneHelper = new Scene(rendererScale, selectorEnabled, tooltipEnabled);
        this.imports = new Import();
        this.utils = new Utils(this.sceneHelper);
        this.object3DLoader = new Object3DLoader(this.sceneHelper);
        this.library = null;
        this.assetConfigs = null;
        this.instanceSet = null;
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
     *   "assetsPath": "/assets/",
     *   "componentList": ["Filter", "Fan", "Damper"]
     * };
     * ahu3d.loadLibraryFromApp(assetConfigs).then((library) => {
     *   console.log("Library loaded:", library);
     * });
     */
    async loadLibraryFromApp(assetConfigs) {
        this.assetConfigs = assetConfigs;
        this.object3DLoader.assetConfigs = assetConfigs;

        this.library = await this.imports.loadLibraryFromApp(assetConfigs);

        this.utils.library = this.library;
        this.utils.object3DLoader = this.object3DLoader;

        await this.utils.loadInstanceSet();
        console.log('Instances are ready')

        this.arithmetics = new Arithmetics(this.library);

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
        const cleanedXeto = this.imports.preprocessXeto(xeto);

        if(!cleanedXeto) {
            return;
        }

        const assembly = await this.arithmetics.calculateAssembly(cleanedXeto);

        this.sceneHelper.clearScene();

        await this.utils.renderAssembly(assembly);

        this.sceneHelper.fitAssemblyIntoView();

        return assembly;
    }

    /**
     * Loads a specific AHU component and optionally controls its visibility in the scene.
     * 
     * @param {string} componentKey - The key representing the component in the library.
     * @param {boolean} isVisible - Determines if the component should be visible in the scene.
     * @returns {Promise<Object>} The loaded AHU component.
     * 
     * @example
     * const ahu3d = new Ahu3D();
     * ahu3d.loadComponent('AirFilter', true).then((component) => {
     *   console.log('Component loaded:', component);
     * });
     */
    async loadComponent(componentKey, isVisible) {
        const ahuComponent = await this.object3DLoader.loadComponent(this.library[componentKey], isVisible);

        // Attach sceneHelper to the component
        ahuComponent.sceneHelper = this.sceneHelper;

        // Extend Object3D instance.
        this.utils.extendObject3D(ahuComponent);  
        
        // Initialize the ahu component attributes for animations/transforms/etc.
        this.utils.initializeAttributeStates(ahuComponent);

        return ahuComponent;
    }
}

export default Ahu3D;
