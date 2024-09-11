/*
 * Materials.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module defines and applies materials to 3D objects within the scene, 
 * ensuring proper visual appearance such as textures, colors, and shading.
 * 
 */
import * as THREE from 'three';

class Materials {
    constructor() {
        this.createStandardMaterial();
    }
    createStandardMaterial() {
        return new THREE.MeshStandardMaterial({ color: "0x00ff00" });
    }
}

export default Materials;