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