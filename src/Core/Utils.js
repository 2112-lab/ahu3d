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

import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export default class Utils {
  constructor(sceneHelper) {
    this.instanceSet = null;
    this.sceneHelper = sceneHelper;
    this.library = null;
    this.object3DLoader = null;
    this.arrowInstance = this.createArrowInstance();
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

    // Add to scene
    this.sceneHelper.addToScene(arrowGroup);

    return arrowGroup;
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

      // this.sceneHelper.cacheAnimationTargets();
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
    console.log("this.instanceSet:", this.instanceSet);
  }

  createDuct(segment) {

    console.log("segment createDuct:", segment);

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
      // for (const joint of segment.segment.joints) {
      //   const instance = this.instanceSet[joint.userData.component.componentName];
      //   clonePromises.push(this.cloneInstance(joint.userData, instance, joint.userData.component.componentName));
      // }
  
      // Clone and position ends
      for (const end of segment.segment.ends) {
        const instance = this.instanceSet[end.userData.component.componentName];
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

  renderArrow(segment) {
    const clonedArrow = this.arrowInstance.clone();
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
   * getOrientation
   * 
   * Determines the orientation of a segment based on the start and end graphic locations.
   * 
   * Functions Invoked:
   * - getRow
   * 
   * @param {String} start - The start location of the segment.
   * @param {String} end - The end location of the segment.
   * @returns {String} The orientation of the segment (e.g., "north", "south", "east", "west").
   */
  getOrientation(start, end) {
    let orientation = "east";
    if(this.getRow(end) > this.getRow(start)) {
        orientation = "south";
    }
    else if(this.getRow(end) < this.getRow(start)) {
        orientation = "north";
    }
    else if(end[0] > start[0]) {
        orientation = "east";
    }
    else if(end[0] < start[0]) {
        orientation = "west";
    }
    return orientation;
  }

  /**
   * getRow
   * 
   * Extracts the row number from a location string.
   * 
   * Functions Invoked:
   * - None
   * 
   * @param {String} location - The location string (e.g., "A5").
   * @returns {Number} The row number extracted from the location.
   */
  getRow(location) {
    return parseInt(location.slice(1, location.length)); // Parse and return the row number from the location string.
  }

  setJointOpacity(opacity) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name.includes('joint')) {
          if(opacity < 1) {
            object3d.material.transparent = true;
            object3d.material.depthWrite = false;
          }
          else {
            object3d.material.transparent = false;
            object3d.material.depthWrite = true;
          }
          object3d.material.opacity = opacity;

          if(opacity <= 0.2) {
            for(const child of object3d.children) {
              if(child.type == "LineSegments") {
                child.visible = true;
              }
            }
          }
          else if(opacity >= 0.8) {
            for(const child of object3d.children) {
              if(child.type == "LineSegments") {
                child.visible = false;
              }
            }
          }
        }
      }
    });
  }

  setJointWireframe(value) {
    this.sceneHelper.scene.traverse((object3d) => {
      if(object3d.isObject3D) {
        if(object3d.name === 'joint' || object3d.name === 'jointHelper') {
          console.log("object3d:", object3d);
          for(const child of object3d.children) {
            if(child.type == "LineSegments") {
              child.visible = value;
            }
          }
        }
      }
    });
  }

  setJointProxyHelpers(value) {
    this.sceneHelper.scene.traverse((object3d) => {
      if(object3d.isObject3D) {
        if(object3d.name === 'jointHelperProxy') {
          if(value == true) {
            object3d.material.color.setHex(object3d.userData.helperColor);
          }
          else {
            object3d.material.color.setHex(object3d.userData.productionColor);
          }
        }
      }
    });
  }

  setJointVertexHelpers(value) {
    this.sceneHelper.scene.traverse((object3d) => {
      if(object3d.isObject3D) {
        if(object3d.name === 'jointHelperVertices') {
          object3d.visible = value;
        }
      }
    });
  }

  setDuctOpacity(opacity) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name === 'duct') {
          object3d.traverse(child => {
            if (child.isMesh && child.material) {
              if(opacity < 1) {
                child.material.transparent = true;
                child.material.depthWrite = false;
              }
              else {
                child.material.transparent = false;
                child.material.depthWrite = true;
              }
              child.material.opacity = opacity;
            }
          });

        }
      }
    });
  }

  setComponentOpacity(opacity) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name === 'hvac') {
          object3d.traverse(child => {
            if (child.isMesh && child.material) {
              if(opacity < 1) {
                child.material.transparent = true;
                // child.material.depthWrite = false;
              }
              else {
                child.material.transparent = false;
                // child.material.depthWrite = true;
              }
              child.material.opacity = opacity;
            }
          });

        }
      }
    });
  }

}