import * as THREE from 'three';

class Fan {
    spinMesh(targetMesh) {
        var timer = Date.now() * 0.0005;
        const speedAttribute = targetMesh.parent.userData.component.attributes['speed'];
        if (speedAttribute.value > 0) {
            targetMesh.rotation[speedAttribute.axis] = (timer * -5) * speedAttribute.value;
        }
    }
}

export default Fan;