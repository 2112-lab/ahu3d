//////////////////////////////////////////////////////////////////////////////////////
//
//	AHU3D - A Javascript Module for Parametric Design Tool for Air Handling Units.
//
//
//	    LIMITED TEMPORARY LICENSE FOR DEMO PURPOSES ONLY - EXPIRES 2025/01/01
//
//
//		   NOT AUTHORIZED FOR PRODUCTION DEPLOYENT OR REDISTRIBUTION.
//
//
//				PROPERTY OF COGNITIVE DYNAMICS LTD.
//
//
//				    ALL RIGHTS RESERVED - 2024.
//
//////////////////////////////////////////////////////////////////////////////////////

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
  
    // Create an array of promises for loading each component's 3D mesh
    const loadPromises = Object.keys(this.library).map(async (key) => {
      const mesh = await this.object3DLoader.loadComponent(this.library[key], false);
      instanceSet[this.library[key].componentName] = mesh; // Store mesh in instanceSet
    });
  
    // Wait for all promises to resolve
    await Promise.all(loadPromises);
  
    this.instanceSet = instanceSet;
  }

  async renderAssembly(assembly) {
    console.log("renderAssembly started");
    let renderedAssembly = [];
  
    // Iterate over the assembly segments
    for (const segment of assembly) {
      const clonePromises = [];
  
      // Clone and position meshes
      for (const mesh of segment.segment.meshes) {
        const instance = this.instanceSet[mesh.userData.component.componentName];
        clonePromises.push(this.cloneInstance(mesh.userData, instance, mesh.userData.component.componentName));
      }
  
      // Clone and position joints
      for (const joint of segment.segment.joints) {
        const instance = this.instanceSet[joint.userData.component.componentName];
        clonePromises.push(this.cloneInstance(joint.userData, instance, joint.userData.component.componentName));
      }
  
      // Clone and position ends
      for (const end of segment.segment.ends) {
        const instance = this.instanceSet[end.userData.component.componentName];
        clonePromises.push(this.cloneInstance(end.userData, instance, end.userData.component.componentName));
      }
  
      // Clone and position duct
      const instance = this.instanceSet[segment.segment.duct.userData.component.componentName];
      clonePromises.push(this.cloneInstance(segment.segment.duct.userData, instance, segment.xetoDuct.id));
  
      // Wait for all clones in the current segment to complete
      const clonedInstances = await Promise.all(clonePromises);
  
      // Add the cloned instances to the rendered assembly
      renderedAssembly.push(...clonedInstances);
    }
  
    return renderedAssembly;
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
}