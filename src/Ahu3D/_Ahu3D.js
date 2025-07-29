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

import Ahu3DAPI from './Ahu3D-API.js';
import Scene3D from "../3D/Scene/Scene3D.js"
import Utils3D from "../3D/Utils3D.js"
import Mesh3D from "../3D/Mesh3D.js";
import { sharedData } from "./globals.js"

import moduleDefaults from '../assets/module_defaults.json';
import _ from 'lodash';  // You can use lodash for deep merge

/**
 * Class representing the 3D model of an AHU (Air Handling Unit).
 * This class handles the initialization and management of 3D scene elements, 
 * including the loading of models, animations, and managing scene interactions.
 */
class Ahu3D extends Ahu3DAPI {

    /**
     * Creates an instance of Ahu3D and initializes the scene and loaders.
     * This constructor configures the AHU 3D module, loading necessary assets and setting up the scene.
     * 
     * @param {Object} [moduleConfigs=moduleDefaults] - Configuration options for the AHU 3D module.
     */
    constructor(moduleConfigs = moduleDefaults) {
        super(); // Call the parent constructor to initialize the API
        // Merge the default configurations with any provided module configurations
        this.moduleConfigs = _.merge({}, moduleDefaults, moduleConfigs);
        console.log("this.moduleConfigs:", this.moduleConfigs);

        // Log the state of defaults before applying module configurations
        console.log("defaults before");

        // Store the module configuration in sharedData for global access
        sharedData.moduleConfigs = this.moduleConfigs;

        // Log the state of defaults after the configuration update
        console.log("defaults after:", sharedData.moduleConfigs);

        // Initialize a new 3D scene helper based on the configuration
        try {
            this.sceneHelper = new Scene3D(this.moduleConfigs);
            console.log("Scene3D created successfully");
        } catch (error) {
            console.error("Error creating Scene3D:", error);
            throw error;
        }

        // Initialize 3D mesh handler
        try {
            this.Mesh3D = new Mesh3D(this.sceneHelper);
            console.log("Mesh3D created successfully");
            
            // Also set the sceneHelper on the FlowControl's Mesh3D instance
            if (this.FlowControl && this.FlowControl.Mesh3D) {
                console.log("Setting sceneHelper on FlowControl.Mesh3D");
                this.FlowControl.Mesh3D.setSceneHelper(this.sceneHelper);
            }
        } catch (error) {
            console.error("Error creating Mesh3D:", error);
            throw error;
        }

        // Set the duration for the glow effect cycle (in milliseconds)
        this.setGlowCycleDuration(3000);

        // Store the sceneHelper in sharedData for global access
        sharedData.sceneHelper = this.sceneHelper;

        // Initialize the 3D assets and library (they will be loaded later)
        this.Assets3D = null; 
        this.library = null;

        // Initialize utility functions for handling 3D-related tasks
        this.utils = new Utils3D(this.sceneHelper);
        
        // This object holds the loaded assembly components, organized by their IDs
        this.components = {};  // Empty object initialized to store loaded components
    }

}

export default Ahu3D;
