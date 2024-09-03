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