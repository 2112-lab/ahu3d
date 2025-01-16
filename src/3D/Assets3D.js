import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Assets3D {

    constructor(sceneHelper, library, assetConfigs) {
        this.sceneHelper = sceneHelper;
        this.library = library;
        this.assetConfigs = assetConfigs;
    }

    /**
     * Loads component instances into the instanceSet object by importing 3D mesh data.
     * 
     * @returns {Promise<Object>} A dictionary of loaded component instances.
     */
    async loadInstanceSet() {
        console.log("loadInstanceSet started");
        let instanceSet = {};
    
        // Create an array of promises for loading each component's 3D mesh
        const loadPromises = Object.keys(this.library).map(async (key) => {
        const mesh = await this.loadComponent(this.library[key], false);
        instanceSet[this.library[key].componentName] = mesh; // Store mesh in instanceSet
        });
    
        // Wait for all promises to resolve
        await Promise.all(loadPromises);

        instanceSet.arrow = this.createArrowInstance();
    
        this.sceneHelper.instanceSet = instanceSet;
    }

    createArrowInstance() {
        console.log("createArrowInstance started");
    
        // Material
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            transparent: true, 
            opacity: 1,
            depthWrite: true,
        });
    
        // Cylinder (shaft of the arrow)
        const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 32);
        cylinderGeometry.rotateZ(THREE.MathUtils.degToRad(-90));
        cylinderGeometry.scale(500, 500, 500);
        cylinderGeometry.translate(-125, 0, 0);
        const cylinder = new THREE.Mesh(cylinderGeometry, material);
        cylinder.name = "cylinder";
    
        // Cone (tip of the arrow)
        const coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
        coneGeometry.rotateZ(THREE.MathUtils.degToRad(-90));
        coneGeometry.scale(500, 500, 500);
        coneGeometry.translate(375, 0, 0);
        const cone = new THREE.Mesh(coneGeometry, material);
        cone.name = "cone";
    
        // Group
        const arrowGroup = new THREE.Group();
        arrowGroup.add(cylinder);
        arrowGroup.add(cone);
    
        arrowGroup.name = "arrow";
    
        arrowGroup.position.set(0, 0, 0);
    
        arrowGroup.visible = false;

        console.log();
    
        // Add to scene
        this.sceneHelper.addToScene(arrowGroup);
    
        return arrowGroup;
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
    async loadComponent(component, isVisible = true, hvacOpacity = 1) { 
        let componentMesh = THREE.Mesh; // Initialize the component mesh variable.

        const componentDirectory = component.componentId.split('::')[1];

        const url = this.assetConfigs.assetsPath + componentDirectory + "/" + component.files.model;
        componentMesh = await this.loadModel(url); // Load the 3D model.
        console.log("loadModel finished:", componentMesh);

        componentMesh = this.processGLB(component, componentMesh); // Process the loaded model (GLB).
        componentMesh.visible = isVisible;

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
    processGLB(component, gltf, isVisible = true, hvacOpacity = 1) {
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
            depthWrite: true,
        });

        // Traverse the children of the main mesh and set properties.
        mainMesh.traverse((child) => {
            if (child.isMesh) { // If the child is a mesh.
                if (child.name.includes("child")) { // If the child mesh name includes "child".
                    child.material.transparent = true; // Make the material transparent.
                    child.material.opacity = hvacOpacity; // Apply the specified opacity.
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

export default Assets3D;
