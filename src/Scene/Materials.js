import * as THREE from 'three';

class Materials {
    constructor() {
        this.init();
    }
    init() {
        
    }
    createStandardMaterial() {
        return new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    }
}

export default Materials;