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
 * Cameras3D.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module defines the camera settings and controls for navigating the 3D scene.
 * It handles creating and configuring perspective and orthographic cameras used in the scene.
 * 
 */
import * as THREE from 'three';

class Cameras3D {
    constructor(cameraConfigs, size) {
        this.cameraConfigs = cameraConfigs;
        this.size = size;
        this.init();
    }
    init() {

        this.primary = new THREE.PerspectiveCamera(
            this.cameraConfigs.primary.fov,
            this.size.width / this.size.height,
            this.cameraConfigs.primary.near,
            this.cameraConfigs.primary.far,
        );

    }
}

export default Cameras3D;