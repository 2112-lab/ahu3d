import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class Object3DLoader {
    /**
     * Constructor
     * 
     * Initializes the Object3DLoader class with a scene helper and visibility settings.
     * 
     * @param {Object} sceneHelper - The helper object for managing the 3D scene.
     * @param {Boolean} labelsVisible - Flag to indicate if labels should be visible.
     */
    constructor(sceneHelper, labelsVisible) {
        this.sceneHelper = sceneHelper; // Store the scene helper.
        this.labelsVisible = labelsVisible; // Set the label visibility.
        this.hvacOpacity = 1; // Initialize the HVAC opacity.
    }

    /**
     * loadComponent
     * 
     * Imports a 3D component, processes it, and adds it to the scene.
     * 
     * @param {Object} component - The component data including the model file URL.
     * @param {Number} [hvacOpacity=1] - The opacity level to apply to the component.
     * @param {Boolean} [isVisible=true] - Whether the component should be visible.
     * @returns {Promise<Object>} The processed component mesh.
     */
    async loadComponent(assetConfigs, component, hvacOpacity = 1, isVisible = true) {
        console.log("loadComponent started:", component, hvacOpacity, isVisible);
        this.hvacOpacity = hvacOpacity; // Set the opacity for the HVAC component.        

        let componentMesh = THREE.Mesh; // Initialize the component mesh variable.

        console.log("assetConfigs:", assetConfigs);
        componentMesh = await this.loadModel(assetConfigs.assetsPath + "glb/" + component.files.model); // Load the 3D model.

        componentMesh = this.processGLB(component, componentMesh); // Process the loaded model (GLB).
        return componentMesh; // Return the processed component mesh.
    }

    /**
     * loadModel
     * 
     * Loads a 3D model from a given URL using the GLTFLoader.
     * 
     * @param {String} url - The URL of the model file.
     * @returns {Promise<Object>} A promise that resolves to the loaded GLTF model.
     */
    loadModel(url) {
        // url = "/components/Fan/model.glb"
        console.log("loadModel url:", url);
        console.log("loadModel started:", url);
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader(); // Create a new GLTFLoader instance.
            loader.load(url, gltf => resolve(gltf), null, reject); // Load the model and resolve or reject the promise.
        });
    }

    /**
     * processGLB
     * 
     * Processes a loaded GLB model, setting its properties, and adding it to the scene.
     * 
     * @param {Object} component - The component data with its properties.
     * @param {Object} gltf - The loaded GLTF model.
     * @returns {Object} The processed and configured mesh.
     */
    processGLB(component, gltf) {
        let cmpJson = JSON.parse(JSON.stringify(component)); // Clone the component data.

        const mesh = gltf.scene; // Extract the mesh from the GLTF scene.

        let mainMesh = mesh.getObjectByName('main'); // Find the 'main' mesh within the GLTF scene.

        let hvacNames = []; // Initialize an array to hold existing HVAC component names.
        for (const i in this.sceneHelper.scene.children) { // Iterate over the children of the scene.
            if (this.sceneHelper.scene.children[i].isObject3D && this.sceneHelper.scene.children[i].name == 'hvac') {
                hvacNames.push(this.sceneHelper.scene.children[i].userData.component.componentId); // Collect HVAC component names.
            }
        }

        cmpJson.name = this.removeSuffix(cmpJson.componentId); // Remove any suffix from the component name.

        let uniqueName = this.generateUniqueName(hvacNames, cmpJson.componentId); // Generate a unique name for the component.
        cmpJson.componentId = uniqueName; // Set the unique name to the component.

        // Set up the material for the main mesh.
        mainMesh.material = new THREE.MeshStandardMaterial({ 
            transparent: true, 
            opacity: 0,
            depthWrite: false,
        });

        // Traverse the children of the main mesh and set properties.
        mainMesh.traverse((child) => {
            if (child.isMesh) { // If the child is a mesh.
                if (child.name.includes("child")) { // If the child mesh name includes "child".
                    child.material.transparent = true; // Make the material transparent.
                    child.material.opacity = this.hvacOpacity; // Apply the specified opacity.
                    child.material.depthWrite = true; // Enable depth writing.
                }
            }
        });

        // Set the position of the main mesh.
        mainMesh.position.x = cmpJson.object.position.x;
        mainMesh.position.y = cmpJson.object.position.y;
        mainMesh.position.z = cmpJson.object.position.z;

        // Set the rotation of the main mesh.
        mainMesh.rotation.x = cmpJson.object.rotation.x;
        mainMesh.rotation.y = cmpJson.object.rotation.y;           
        mainMesh.rotation.z = cmpJson.object.rotation.z;

        // object.rotation.z = 90 * Math.PI/180;
        // object.rotation.x = -90 * Math.PI/180;

        mainMesh.scale.x = cmpJson.object.scale.x;

        mainMesh.name = "hvac"; // Name the main mesh "hvac".
        mainMesh.userData.component = cmpJson; // Store the component data in the mesh's userData.

        this.sceneHelper.addToScene(mainMesh); // Add the processed mesh to the scene.

        return mainMesh; // Return the processed main mesh.
    }

    /**
     * generateUniqueName
     * 
     * Generates a unique name for a component by appending a numeric suffix if needed.
     * 
     * @param {Array} existingNames - Array of existing component names.
     * @param {String} newName - The desired name for the new component.
     * @returns {String} The unique name generated for the component.
     */
    generateUniqueName(existingNames, newName) {
        let uniqueName = newName; // Start with the desired name.
        let suffix = 1; // Initialize a suffix counter.

        // Check if the name already exists in the array.
        while (existingNames.includes(uniqueName)) {
            // Generate a new name with a numeric suffix if it exists.
            let suffixString = suffix.toString().padStart(3, '0'); // Pad the suffix to 3 digits.
            uniqueName = `${newName}.${suffixString}`; // Append the suffix to the name.
            suffix++; // Increment the suffix counter.
        }

        existingNames.push(uniqueName); // Add the unique name to the array.

        return uniqueName; // Return the generated unique name.
    }

    /**
     * removeSuffix
     * 
     * Removes the numeric suffix from a component name, if it exists.
     * 
     * @param {String} name - The component name to process.
     * @returns {String} The name without the suffix.
     */
    removeSuffix(name) {
        const suffixPattern = /\.\d{3}$/; // Define a pattern to match a suffix (e.g., .001).
        return name.replace(suffixPattern, ''); // Remove the suffix and return the result.
    }
}

export default Object3DLoader;