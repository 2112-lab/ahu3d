/*
 * Ahu3D.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This class manages the 3D representation of an AHU (Air Handling Unit) within the scene, 
 * handling loading of models, animations, and interactions within the 3D environment.
 * 
 */
import Scene from "./sceneHelper/Scene.js"
import Import from "./core/Import.js"
import Object3DLoader from "./core/Object3DLoader.js"
import Arithmetics from "./core/Arithmetics.js"

class Ahu3D {

    constructor() {
        this.sceneHelper = new Scene();
        this.imports = new Import();
        this.object3DLoader = new Object3DLoader(this.sceneHelper);
        this.library = null;
        this.assetConfigs = null;
        this.instanceSet = null;
    }

    attachScene(selectorTag) {
        const container = document.querySelector(selectorTag);
        container.appendChild(this.sceneHelper.renderer.domElement);
    }

    async loadLibraryFromApp(assetConfigs) {
        this.assetConfigs = assetConfigs;
        this.object3DLoader.assetConfigs = assetConfigs;

        this.library = await this.imports.loadLibraryFromApp(assetConfigs);

        this.instanceSet = await this.loadInstanceSet();
        console.log('Instances are ready')

        this.arithmetics = new Arithmetics(this.library);

        return this.library;
    }

    async loadXeto(xeto) {
        const cleanedXeto = this.imports.preprocessXeto(xeto);

        if(!cleanedXeto) {
            return;
        }

        const assembly = await this.calculateAssembly(cleanedXeto);

        this.sceneHelper.clearScene();

        await this.renderAssembly(assembly);

        this.sceneHelper.fitAssemblyIntoView();

        return assembly;
    }

    async loadComponent(componentKey, isVisible) {
        const ahuComponent = await this.object3DLoader.loadComponent(this.library[componentKey], isVisible);

        // Attach sceneHelper to the component
        ahuComponent.sceneHelper = this.sceneHelper;

        // Extend Object3D instance.
        this.extendObject3D(ahuComponent);  
        
        // Initialize the ahu component attributes for animations/transforms/etc.
        this.initializeAttributeStates(ahuComponent);

        return ahuComponent;
    }

    extendObject3D(ahuComponent) {
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
    }

    initializeAttributeStates(ahuComponent) {
        const ahuComponentAttributes = ahuComponent.userData.component.attributes;

        const attrKeys = Object.keys(ahuComponentAttributes);
        const methodKey = attrKeys[0];
        const attributeValue = ahuComponentAttributes[methodKey].value;
        ahuComponent[methodKey](attributeValue);
    }

    /**
     * loadInstanceSet
     * 
     * Loads component instances into the instanceSet object by importing
     * 3D mesh data for each HVAC component from the library.
     * 
     * Functions Invoked:
     * - importComponentLibEntries
     * - HvacObject.importComponent
     * 
     * @returns {Object} A dictionary of loaded component instances
     */
    async loadInstanceSet() {
        let instanceSet = {};

        // Loop through each component entry and import its corresponding 3D mesh
        for (const key in this.library) {
          const mesh = await this.object3DLoader.loadComponent(this.library[key], false);
          mesh.position.z -= 1500;
          instanceSet[this.library[key].componentName] = mesh; // Store mesh in instanceSet
        }
  
        return instanceSet;
    }

    async calculateAssembly(cleanedXeto) {
        console.log("setAhuAssembly started");
        this.assembly = await this.arithmetics.calculateAssembly(cleanedXeto);
        return this.assembly;
    }

    /**
     * transformAndRenderAssembly
     * 
     * Transforms and renders the entire HVAC assembly by cloning instances of 
     * components and applying position, rotation, and scale transformations.
     * 
     * Functions Invoked:
     * - cloneInstance
     * - instanceSet
     * - segment
     */
    async renderAssembly(assembly) {
        console.log("renderAssembly started");
        for (const segment of assembly) {
          // Clone and position meshes, joints, ends, and ducts
          for (const mesh of segment.segment.meshes) {
            const instance = this.instanceSet[mesh.userData.component.componentName];
            this.cloneInstance(mesh.userData, instance, mesh.userData.component.componentName);
          }
          for (const joint of segment.segment.joints) {
            const instance = this.instanceSet[joint.userData.component.componentName];
            this.cloneInstance(joint.userData, instance, joint.userData.component.componentName);
          }
          for (const end of segment.segment.ends) {
            const instance = this.instanceSet[end.userData.component.componentName];
            this.cloneInstance(end.userData, instance, end.userData.component.componentName);
          }
          const instance = this.instanceSet[segment.segment.duct.userData.component.componentName];
          this.cloneInstance(segment.segment.duct.userData, instance, segment.xetoDuct.id);
        }
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

        // if(clonedInstance.userData.component.componentId.includes('Duct')) {
        //   console.log("clonedInstance:", clonedInstance);
        // }
    
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
        // this.initializeAttributeStates(clonedInstance);
    
        // Add the cloned instance to the scene and make it visible
        await this.sceneHelper.addToScene(clonedInstance);
        clonedInstance.visible = true;

        
    }
}

export default Ahu3D