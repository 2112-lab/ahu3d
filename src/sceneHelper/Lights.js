/*
 * Lights.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module configures lighting for the 3D scene, including ambient, directional, 
 * and point lights to illuminate different components of the AHU models.
 * 
 */
import * as THREE from 'three';

class Lights {
    constructor(lightConfigs) {
        this.setupLights(lightConfigs);
    }
    
    setupLights(lightConfigs) {
        let lightsKeys = Object.keys(lightConfigs)
        this.lights = {};

        lightsKeys.forEach((key) => {
            const light = lightConfigs[key];
            if (light.type === "hemisphere") {
                this.lights[key] = new THREE.HemisphereLight(
                    new THREE.Color(light.skyColor), 
                    new THREE.Color(light.groundColor), 
                    light.intensity
                );
            }
            if (light.type === "ambient") {
                this.lights[key] = new THREE.AmbientLight(new THREE.Color(light.color), light.intensity);
            }
            if (light.type === "spot") {
                this.lights[key] = new THREE.SpotLight(new THREE.Color(light.color), light.intensity);
                this.lights[key].position.set(light.position.x, light.position.y, light.position.z);
                this.lights[key].penumbra = light.penumbra;
                this.lights[key].decay = light.decay;
                this.lights[key].distance = light.distance;

                if (light.shadow) {
                    this.lights[key].castShadow = light.castShadow;
                    this.lights[key].shadow.mapSize.width = light.shadow.mapSize.width;
                    this.lights[key].shadow.mapSize.height = light.shadow.mapSize.height;
                    this.lights[key].shadow.camera.near = light.shadow.near;
                    this.lights[key].shadow.camera.far = light.shadow.far;
                    this.lights[key].shadow.focus = light.shadow.focus;
                }
            }
        });
    }
}

export default Lights;
