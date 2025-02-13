import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { sharedData } from "../../../Ahu3D/globals.js"

export function createTextMesh(blockStyle, position) {
    console.log("createTextMesh started:", blockStyle, position);
    const textValue = blockStyle.helpers.text.value || "Default";

    const loader = new FontLoader();
    loader.load('https://ahu3d-assets.s3.amazonaws.com/helvetiker_regular.typeface.json', (font) => {
        const textGeo = new TextGeometry(textValue, {
            font: font,
            size: 100,
            depth: 0.05,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 10,
            bevelSize: 0.02,
            bevelSegments: 5
        });

        // Set up the material for the main mesh.
        const textMaterial = new THREE.MeshStandardMaterial({ 
            transparent: true, 
            opacity: 1,
            depthWrite: true,
        });

        const textMesh = new THREE.Mesh(textGeo, textMaterial);
        textMesh.name = "textMesh";

        const material = blockStyle.helpers.text.material || { color: "#AAAAAA", opacity: 1 };
        const color = material.color || '#AAAAAA';
        const opacity = material.opacity || 1;

        textMesh.material.color = new THREE.Color(color);
        textMesh.material.opacity = opacity;
    
        textMesh.rotation.x = THREE.MathUtils.degToRad(90);

        textMesh.position.copy(position);

        textMesh.visible = true;

        sharedData.sceneHelper.addToScene(textMesh);
        
    });
}