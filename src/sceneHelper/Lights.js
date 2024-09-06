import * as THREE from 'three';

class Lights {
    constructor() {
        const lightsSettings = {
            "hemisphereLight": {
                "type": "hemisphere",
                "skyColor": "#ffffff",
                "groundColor": "#333333",
                "intensity": 0.1,
                "castShadow": false,
                "shadow": false
            },
            "ambientLight": {
                "type": "ambient",
                "color": "#bbbbbb",
                "intensity": 0.4,
                "castShadow": false,
                "shadow": false
            },
            "spotLight": {
                "type": "spot",
                "color": "#bbbbbb",
                "intensity": 0.9,
                "penumbra": 0,
                "decay": 0,
                "distance": 50000,
                "position": {
                    "x": -15000,
                    "y": -15000,
                    "z": 20000
                },
                "castShadow": true,
                "shadow": {
                    "mapSize": {
                        "width": 512,
                        "height": 512
                    },
                    "near": 10,
                    "far": 200,
                    "focus": 0.4
                }
            },
            "spotLight1": {
                "type": "spot",
                "color": "#dddddd",
                "intensity": 0.9,
                "penumbra": 0,
                "decay": 0,
                "distance": 20000,
                "position": {
                    "x": -15000,
                    "y": -15000,
                    "z": 20000
                },
                "castShadow": false,
                "shadow": false
            },
            "spotLight2": {
                "type": "spot",
                "color": "#dddddd",
                "intensity": 0.9,
                "penumbra": 0,
                "decay": 0,
                "distance": 20000,
                "position": {
                    "x": 15000,
                    "y": -15000,
                    "z": 20000
                },
                "castShadow": false,
                "shadow": false
            },
            "spotLight3": {
                "type": "spot",
                "color": "#dddddd",
                "intensity": 0.9,
                "penumbra": 0,
                "decay": 0,
                "distance": 20000,
                "position": {
                    "x": -15000,
                    "y": 15000,
                    "z": 20000
                },
                "castShadow": false,
                "shadow": false
            }
        }
        this.setupLights(lightsSettings);
    }
    
    setupLights(lightsSettings) {
        let lightsKeys = Object.keys(lightsSettings)
        this.lights = {};

        lightsKeys.forEach((key) => {
            const light = lightsSettings[key];
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
