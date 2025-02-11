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

import Ahu3DAPI from './Ahu3D-API.js';
import Scene3D from "../3D/Scene/Scene3D.js"
import Utils3D from "../3D/Utils3D.js"
import { sharedData } from "./globals.js"

import moduleDefaults from '../assets/module_defaults.json';
import _ from 'lodash';  // You can use lodash for deep merge

class Ahu3D extends Ahu3DAPI {

    /**
     * Creates an instance of Ahu3D and initializes the scene and loaders.
     * 
     * @param {Object} [moduleConfigs=moduleDefaults] - Configuration options for the AHU 3D module.
     */
    constructor(moduleConfigs = moduleDefaults) {
        super(); // Call parent constructor to initialize the API
        this.moduleConfigs = _.merge({}, moduleDefaults, moduleConfigs);
        console.log("this.moduleConfigs:", this.moduleConfigs);

        console.log("defaults before");

        sharedData.moduleConfigs = this.moduleConfigs;

        console.log("defaults after:", sharedData.moduleConfigs);

        this.sceneHelper = new Scene3D(this.moduleConfigs);

        this.setGlowCycleDuration(3000);

        sharedData.sceneHelper = this.sceneHelper;

        this.Assets3D = null; 
        this.library = null;

        this.utils = new Utils3D(this.sceneHelper);
        
        this.components = {};  // This object holds loaded assembly components
    }

}

export default Ahu3D;
