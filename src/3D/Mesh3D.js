import * as THREE from 'three';

import Canvas2D from "../2D/Canvas2D.js"
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export default class Mesh3D {
    constructor(sceneHelper){
        this.sceneHelper = sceneHelper;
        this.Canvas2D = new Canvas2D();
    }

    /**
     * loadAssemblyMeshes
     * 
     * Loads the component meshes for the given components and returns them.
     * 
     * @param {Array} components - The components to load meshes for.
     * @returns {Promise<Array>} A promise that resolves to the loaded meshes.
     */
    async loadAssemblyMeshes(cleanedXeto, components, componentLibrary) {
        const xetoComponents = cleanedXeto.filter(child => child.spec.includes('Component')); // Filter the components from the cleaned assembly.

        let meshes = []; // Initialize an empty array for the meshes.
        for (const componentId of components) { // Iterate over each component ID.
            const componentBlock = JSON.parse(JSON.stringify(
                xetoComponents.filter( child => child.id === componentId )[0]
            )); // Clone the component block.
            const componentBlockId = componentBlock.componentId.split("r:novo.graphics::")[1];
            const libEntry = JSON.parse(JSON.stringify(
                componentLibrary[componentBlockId]
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

    async renderAssembly(assembly, sceneHelper) {
        this.sceneHelper = sceneHelper;

        console.log("renderAssembly started:", assembly);
        let renderedAssembly = [];
    
        this.Canvas2D.drawToSecondaryViewport(assembly);
        this.Canvas2D.drawToPrimaryViewport(assembly);
      
        // Iterate over the assembly segments
        for (const segment of assembly) {
          const clonePromises = [];
      
          // Clone and position meshes
          for (const mesh of segment.segment.meshes) {
            const instance = sceneHelper.instanceSet[mesh.userData.component.componentName];
            clonePromises.push(this.cloneInstance(mesh.userData, instance, mesh.userData.component.componentName));
          }
      
          // Clone and position ends
          for (const end of segment.segment.ends) {
            const instance = sceneHelper.instanceSet[end.userData.component.componentName];
            clonePromises.push(this.cloneInstance(end.userData, instance, end.userData.component.componentName));
          }
      
          // Create position a parametric duct
          const instance = this.createDuct(segment, "duct");
          clonePromises.push(instance);
      
          // Wait for all clones in the current segment to complete
          const clonedInstances = await Promise.all(clonePromises);
    
          // Render arrows
          for (const i in segment.segment.arrows) {
            this.renderArrow(segment);
          }
    
          // Render textMeshes
          for (const i in segment.segment.textMeshes) {
            this.renderTextMesh(segment); 
          }
      
          // Add the cloned instances to the rendered assembly
          renderedAssembly.push(...clonedInstances);
        }
      
        return renderedAssembly;
    }

    createDuct(segment) {
        const userData = segment.segment.duct.userData;
        const name = segment.xetoDuct.id;
    
        const size = segment.xetoDuct.graphicLocation.size;
    
        const innerDim = { // inner-dimensions
            small: 500,
            medium: 1000,
            large: 1500
        }
    
        const wt = 30; // wall-thickness
    
        // Create the geometries with the specified dimensions
        const ceilingGeometry = new THREE.BoxGeometry(
            innerDim[size], 
            innerDim[size] + wt, 
            wt
        );
        const backWallGeometry = new THREE.BoxGeometry(
            innerDim[size], 
            wt, 
            innerDim[size]
        );
        const floorGeometry = new THREE.BoxGeometry(
            innerDim[size], 
            innerDim[size] + wt, 
            wt
        );
    
        // Create materials
        const ductMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xAEB9C2
        });
    
        // Create the meshes
        const ceiling = new THREE.Mesh(ceilingGeometry, ductMaterial);
        const backWall = new THREE.Mesh(backWallGeometry, ductMaterial);
        const floor = new THREE.Mesh(floorGeometry, ductMaterial);
    
        // Position the cubes to make them appear joined
        ceiling.position.set(
            0,
            0,
            (innerDim[size] / 2) * 1
        );
        backWall.position.set(
            0,
            innerDim[size]/2,
            0
        );
        floor.position.set(
            0,
            0,
            (innerDim[size] / 2) * -1
        );        
    
        // Create an empty Object3D container (works as an empty mesh or group)
        const parentObject = new THREE.Object3D();
    
        // Add the cubes to the parent object
        parentObject.add(ceiling);
        parentObject.add(backWall);
        parentObject.add(floor); 
    
        parentObject.userData = userData;
    
        // Apply position transformations to the cloned instance
        parentObject.position.x = userData.component.object.position.x;
        parentObject.position.y = userData.component.object.position.y;
        parentObject.position.z = userData.component.object.position.z;
    
        // Apply rotation transformations to the cloned instance
        parentObject.rotation.z = userData.component.object.rotation.z;
        parentObject.rotation.y = userData.component.object.rotation.y;
    
        // Apply scale transformations to the cloned instance
        parentObject.scale.x = userData.component.object.scale.x;
    
        // Assign the component's name to the cloned instance
        parentObject.userData.component.componentName = name;
    
        parentObject.name = "duct";
    
        // Clone the materials of all children of the cloned instance
        parentObject.traverse(child => {
            if (child.isMesh && child.material) {  // Ensure child is a mesh and has a material
                child.material = child.material.clone(); // Clone the material
            }
        });
    
        parentObject.sceneHelper = this.sceneHelper;
    
        // this.extendObject3D(parentObject); 
    
        // Add the cubes to the scene
        this.sceneHelper.addToScene(parentObject);
    
        return parentObject;
    }

    renderArrow(segment) {
        const clonedArrow = this.sceneHelper.instanceSet.arrow.clone();
        clonedArrow.name = "arrowClone";
    
        const material = segment.xetoDuct.blockStyle.helpers.arrow.material || { color: "#AAAAAA", opacity: 1 };
        const color = material.color || '#AAAAAA';
        const opacity = material.opacity || 1;
    
        // Clone the materials of all children of the cloned instance
        clonedArrow.traverse(child => {
            if (child.isMesh && child.material) {  // Ensure child is a mesh and has a material
                child.material = child.material.clone(); // Clone the material
                child.material.color = new THREE.Color(color);
                child.material.opacity = opacity;
            }
        });
    
        clonedArrow.position.x = segment.segment.arrows[0].userData.component.object.position.x;
        clonedArrow.position.y = segment.segment.arrows[0].userData.component.object.position.y;
        clonedArrow.position.z = segment.segment.arrows[0].userData.component.object.position.z;
    
        clonedArrow.rotation.x = segment.segment.arrows[0].userData.component.object.rotation.x;
        clonedArrow.rotation.y = segment.segment.arrows[0].userData.component.object.rotation.y;
        clonedArrow.rotation.z = segment.segment.arrows[0].userData.component.object.rotation.z;
    
        clonedArrow.visible = true;
        this.sceneHelper.addToScene(clonedArrow);
    }
    
    renderTextMesh(segment) {
        const textValue = segment.xetoDuct.blockStyle.helpers.text.value || "Default";
    
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
    
          const material = segment.xetoDuct.blockStyle.helpers.text.material || { color: "#AAAAAA", opacity: 1 };
          const color = material.color || '#AAAAAA';
          const opacity = material.opacity || 1;
    
          textMesh.material.color = new THREE.Color(color);
          textMesh.material.opacity = opacity;
    
          textMesh.position.x = segment.segment.textMeshes[0].userData.component.object.position.x;
          textMesh.position.y = segment.segment.textMeshes[0].userData.component.object.position.y;
          textMesh.position.z = segment.segment.textMeshes[0].userData.component.object.position.z;
      
          textMesh.rotation.x = THREE.MathUtils.degToRad(90);
      
          // Add to scene
          this.sceneHelper.addToScene(textMesh);
    
          textMesh.visible = true;
        });
    }

    /**
       * cloneInstance
       * 
       * Clones a component instance, applies transformations, and adds it to the scene.
       * 
       * Functions Invoked:
       * - instance.clone
       * - sceneHelper.addInScene
       * 
       * @param {Object} userData - The data associated with the component
       * @param {Object} instance - The component instance to be cloned
       * @param {String} name - The name of the component being cloned
       */
      async cloneInstance(userData, instance, name) {
        const clonedInstance = instance.clone(); // Clone the original instance
        clonedInstance.userData = userData; // Copy user data to the cloned instance
    
        // Apply position transformations to the cloned instance
        clonedInstance.position.x = userData.component.object.position.x;
        clonedInstance.position.y = userData.component.object.position.y;
        clonedInstance.position.z = userData.component.object.position.z;
    
        // Apply rotation transformations to the cloned instance
        clonedInstance.rotation.z = userData.component.object.rotation.z;
        clonedInstance.rotation.y = userData.component.object.rotation.y;
    
        // Apply scale transformations to the cloned instance
        clonedInstance.scale.x = userData.component.object.scale.x;
        clonedInstance.scale.y = userData.component.object.scale.y;
        clonedInstance.scale.z = userData.component.object.scale.z;
    
        // Assign the component's name to the cloned instance
        clonedInstance.userData.component.componentName = name;
    
        // Clone the materials of all children of the cloned instance
        clonedInstance.traverse(child => {
            if (child.isMesh && child.material) {  // Ensure child is a mesh and has a material
                child.material = child.material.clone(); // Clone the material
            }
        });
    
        clonedInstance.sceneHelper = this.sceneHelper;
    
        this.extendObject3D(clonedInstance); 
    
        // Add the cloned instance to the scene and make it visible
        this.sceneHelper.addToScene(clonedInstance);
        clonedInstance.visible = true;
    
        return clonedInstance;
    }

    /**
     * Extends the functionality of an Object3D instance with custom AHU component behaviors.
     * 
     * @param {Object} ahuComponent - The Object3D instance representing the AHU component.
     */
    extendObject3D(ahuComponent) {
        ahuComponent.sceneHelper = this.sceneHelper;
        ahuComponent.setAttribute = function(value){
          console.log("setAttribute started:", ahuComponent);
    
          const ahuComponentAttributes = ahuComponent.userData.component.attributes;
          const attrKeys = Object.keys(ahuComponentAttributes);
          const methodKey = attrKeys[0];
    
          ahuComponent[methodKey](value);
        };
        ahuComponent.setAnimation = function(value){
          this.userData.component.attributes.setAnimation.value = value;
          this.sceneHelper.updateTooltip();
        };
        ahuComponent.setTargetTransforms = function(value){
          const attribute = this.userData.component.attributes.setTargetTransforms;
    
          if(value >= attribute.min && value <= attribute.max) {
            attribute.value = value;
            this.sceneHelper.updateTooltip();            
    
            this.traverse((child) => {
              if (child.isMesh) {
                if(attribute.targets.includes(child.name)) {
                  child.rotation[attribute['axis']] = attribute.states[attribute.value];
                }
              }
            });
          }            
        };
        ahuComponent.setTargetMaterials = function(value){
          const attribute = this.userData.component.attributes.setTargetMaterials;
    
          if(value >= attribute.min && value <= attribute.max) {
            attribute.value = value;
            this.sceneHelper.updateTooltip();
    
            this.traverse((child) => {
              if (child.isMesh) {
                if(child.name.includes("child")) {
                  for(const i in attribute.states.thresholds) {
                    if(attribute.value >= attribute.states.thresholds[i]['value']) {
                      if(child.name.includes(attribute.states.thresholds[i].target)) {
                        child.material.color.setHex(attribute.states.active);
                      }
                    }
                    else {
                      if(child.name.includes(attribute.states.thresholds[i].target)) {
                        child.material.color.setHex(attribute.states.inactive);
                      }
                    }
                  }
                }
              }
            });
          }
        };
        ahuComponent.setInput = function(value){
          const attribute = this.userData.component.attributes.setInput;
    
          attribute.value = value;
          this.sceneHelper.updateTooltip();
        };
        ahuComponent.setTransparency = function(value){
          for(const i in this.children) {
            if(this.children[i].isMesh) {
              this.children[i].material.opacity = 1 - value;
              this.children[i].renderOrder = 1;
            }
          }
        };
        this.sceneHelper.cacheAnimationTargets();
    }

}