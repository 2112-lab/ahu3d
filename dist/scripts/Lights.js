import * as THREE from 'three';

class Lights {
    constructor() {
        this.init();
    }
    init() {
        // Provides a gradient of light from the sky color to the ground color
        this.hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1); // (sky color, ground color, intensity)

        // Provides uniform light across the entire scene
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // (color, intensity)

        // A light that shines from a point in one direction, with a cone-shaped light spread
        this.spotLight = new THREE.SpotLight(0xffffff, 1); // (color, intensity)
        this.spotLight.position.set(10, 10, 10); // position of the spotlight
        this.spotLight.castShadow = true; // enables shadows from this light
    }
}

export default Lights;