import * as THREE from 'three';

export default class Mesh3D {
    constructor(componentLibrary, cleanedXeto){
        this.componentLibrary = componentLibrary;
        this.cleanedXeto = cleanedXeto;
    }
    /**
     * loadAssemblyMeshes
     * 
     * Loads the component meshes for the given components and returns them.
     * 
     * @param {Array} components - The components to load meshes for.
     * @returns {Promise<Array>} A promise that resolves to the loaded meshes.
     */
    async loadAssemblyMeshes(cleanedXeto, components) {
        const xetoComponents = cleanedXeto.filter(child => child.spec.includes('Component')); // Filter the components from the cleaned assembly.

        let meshes = []; // Initialize an empty array for the meshes.
        for (const componentId of components) { // Iterate over each component ID.
            const componentBlock = JSON.parse(JSON.stringify(
                xetoComponents.filter( child => child.id === componentId )[0]
            )); // Clone the component block.
            const componentBlockId = componentBlock.componentId.split("r:novo.graphics::")[1];
            const libEntry = JSON.parse(JSON.stringify(
                this.componentLibrary[componentBlockId]
            )); // Clone the corresponding library entry.
            libEntry.componentId = componentId;
            meshes.unshift({
                userData: {
                    component: libEntry, // Add the library entry to the user data.
                    xeto: componentBlock // Add the component block to the user data.
                }
            });
        }
        return Promise.all(meshes); // Return a promise that resolves to the loaded meshes.
    }    
}