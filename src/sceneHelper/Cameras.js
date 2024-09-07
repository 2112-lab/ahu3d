/*
 * Cameras.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module defines the camera settings and controls for navigating the 3D scene.
 * It handles creating and configuring perspective and orthographic cameras used in the scene.
 * 
 */
import * as THREE from 'three';

class Cameras {
    constructor(cameraConfigs) {
        this.cameraConfigs = cameraConfigs;
        this.init();
    }
    init() {

        this.primary = new THREE.PerspectiveCamera(
            this.cameraConfigs.primary.fov,
            this.cameraConfigs.primary.aspect,
            this.cameraConfigs.primary.near,
            this.cameraConfigs.primary.far,
        );

    }
}

export default Cameras;