import * as THREE from 'three';

class Cameras {
    constructor() {
        this.init();
    }
    init() {
        this.primary = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    }
}

export default Cameras;