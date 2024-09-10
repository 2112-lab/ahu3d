/*
 * Utils.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module contains a set of methods for generic utility functions that don't categorize into any other class.
 * 
 */

export default class Utils {
  constructor(sceneHelper) {
    this.instanceSet = null;
    this.sceneHelper = sceneHelper;
    this.library = null;
    this.object3DLoader = null;
  }

  /**
   * Extends the functionality of an Object3D instance with custom AHU component behaviors.
   * 
   * @param {Object} ahuComponent - The Object3D instance representing the AHU component.
   */
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

  /**
   * Initializes the attributes and states of an AHU component.
   * 
   * @param {Object} ahuComponent - The Object3D instance representing the AHU component.
   */
  initializeAttributeStates(ahuComponent) {
    const ahuComponentAttributes = ahuComponent.userData.component.attributes;

    const attrKeys = Object.keys(ahuComponentAttributes);
    const methodKey = attrKeys[0];
    const attributeValue = ahuComponentAttributes[methodKey].value;
    ahuComponent[methodKey](attributeValue);
  }

  /**
   * Loads component instances into the instanceSet object by importing 3D mesh data.
   * 
   * @returns {Promise<Object>} A dictionary of loaded component instances.
   */
  async loadInstanceSet() {
    let instanceSet = {};

    // Loop through each component entry and import its corresponding 3D mesh
    for (const key in this.library) {
      const mesh = await this.object3DLoader.loadComponent(this.library[key], false);
      instanceSet[this.library[key].componentName] = mesh; // Store mesh in instanceSet
    }

    this.instanceSet = instanceSet;
  }

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
    await this.sceneHelper.addToScene(clonedInstance);
    clonedInstance.visible = true;
  }
}