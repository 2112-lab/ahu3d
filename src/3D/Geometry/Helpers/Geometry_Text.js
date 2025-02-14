import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { sharedData } from "../../../Ahu3D/globals.js"

/**
 * createTextMesh
 * 
 * This function creates a 3D text mesh using the three.js library. It generates a text geometry 
 * based on the provided blockStyle and position, applies material settings, and adds the text 
 * mesh to the scene.
 * 
 * @param {Object} blockStyle - The block style configuration that contains text properties and material settings.
 * @param {THREE.Vector3} position - The position where the text mesh will be placed in the 3D scene.
 */
export function createTextMesh(blockStyle, position) {
    console.log("createTextMesh started:", blockStyle, position);

    // Retrieve the text value from the block style, with a default fallback to "Default".
    const textValue = blockStyle.helpers.text.value || "Default";

    // Initialize the font loader to load a specific font.
    const loader = new FontLoader();

    // Load the font from a remote URL and generate the text geometry.
    loader.load('https://ahu3d-assets.s3.amazonaws.com/helvetiker_regular.typeface.json', (font) => {
        
        // Create the text geometry with specific properties such as size, depth, and bevel details.
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

        // Create the material for the text mesh with transparency enabled.
        const textMaterial = new THREE.MeshStandardMaterial({ 
            transparent: true, 
            opacity: 1,
            depthWrite: true,
        });

        // Create the text mesh using the generated geometry and material.
        const textMesh = new THREE.Mesh(textGeo, textMaterial);
        textMesh.name = "textMesh";

        // Retrieve custom material settings from blockStyle or use default values.
        const material = blockStyle.helpers.text.material || { color: "#AAAAAA", opacity: 1 };
        const color = material.color || '#AAAAAA';
        const opacity = material.opacity || 1;

        // Apply the color and opacity to the text mesh material.
        textMesh.material.color = new THREE.Color(color);
        textMesh.material.opacity = opacity;

        // Rotate the text mesh along the X-axis by 90 degrees (in radians).
        textMesh.rotation.x = THREE.MathUtils.degToRad(90);

        // Set the position of the text mesh.
        textMesh.position.copy(position);

        // Set the text mesh to be visible.
        textMesh.visible = true;

        // Add the text mesh to the scene using the shared scene helper.
        sharedData.sceneHelper.addToScene(textMesh);
        
    });
}
