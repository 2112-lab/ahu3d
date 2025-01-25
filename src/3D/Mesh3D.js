import * as THREE from 'three';
import Canvas2D from "../2D/Canvas2D.js";
import { sharedData } from "../Ahu3D/globals.js";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { createTextMesh } from "./Geometry/Helpers/Geometry_Text.js"

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

    async render3D(ahuObject) {
      console.log("render3D started:", ahuObject);
      let renderedAssembly = [];

      // Clone and position meshes
      for(const ductId in ahuObject.resources.ducts) {

        const duct = ahuObject.resources.ducts[ductId];
        const ductInstance = this.createDuct(duct, ductId);
        ahuObject["3d"].ducts.meshes[ductId] = ductInstance;

        let componentMeshes = [];
        console.log("render3D ductId:", ductId);

        for(const i in ahuObject.associations.ducts[ductId].components) {
          const componentId = ahuObject.associations.ducts[ductId].components[i];
          console.log("render3D componentId:", componentId);
          const componentMesh = this.cloneAndTransformComponent(componentId, ahuObject, ductId);
          ahuObject["3d"].components.meshes[componentId] = componentMesh;
          componentMeshes.push(componentMesh);
        }

        console.log("render3D rotateComponentsWithDuct");

        this.rotateComponentsWithDuct(ductInstance, componentMeshes, duct.rotation.y);

        console.log("render3D addCubesFromData starting:", ahuObject);

        this.renderProxies(ahuObject.resources.joints);
        this.renderJointVertexHelpers(ahuObject.resources.joints);

        console.log("render3D renderJoints starting:", ahuObject["3d"]);

        this.renderJoints(ahuObject["3d"]);

        console.log("render3D renderJoints finished:", ahuObject);
        
      }
    
      return [];
  }

  renderJoints(items3d) {
      const jointGeometries = items3d.joints.geometry;
      const geometriesArray = [];

      // Collect all joint geometries
      for (const jointGeometryKey in jointGeometries) {
          const jointGeometry = jointGeometries[jointGeometryKey];

          // Clone to prevent modifying the original geometry
          geometriesArray.push(jointGeometry.clone());
      }

      if (geometriesArray.length > 0) {
          // Merge all geometries into a single one
          const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometriesArray);

          // Create a material and mesh for the merged geometry
          const material = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor, side: THREE.DoubleSide });
          const mergedMesh = new THREE.Mesh(mergedGeometry, material);
          mergedMesh.name = "joint";

          // Create a triangle wireframe from the merged geometry
          const wireframeGeometry = new THREE.WireframeGeometry(mergedGeometry);
          const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
          const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

          wireframe.visible = false;

          mergedMesh.add(wireframe);

          // Add the combined object to the scene
          sharedData.sceneHelper.addToScene(mergedMesh);

          // Store the merged mesh reference
          items3d.joints.mergedMesh = mergedMesh;
      }

      // Clean up the original geometry data
      delete items3d.joints.geometry;
  }

  renderProxies(data) {
    console.log("renderProxies data:", data);

    const wt = sharedData.moduleConfigs.parametricOptions.wallThickness;

    let length = 0;
    let position = {x: 0, y: 0, z:0};

    const material1 = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });
    

    function renderProxy(proxy) {
      position.x = (proxy.coordinates[0].x + proxy.coordinates[3].x) / 2;
      position.y = (proxy.coordinates[7].y + proxy.coordinates[0].y) / 2;
      position.z = (proxy.coordinates[0].z + proxy.coordinates[1].z) / 2;
  
      length = Math.abs(proxy.coordinates[7].y - proxy.coordinates[0].y);

      const geometry = new THREE.BoxGeometry(wt, length, wt);
      const proxyMesh = new THREE.Mesh(geometry, material1);
      proxyMesh.name = "jointProxy";
      proxyMesh.position.copy(position);
      sharedData.sceneHelper.addToScene(proxyMesh);
    }

    for (const jointKey in data) {
        const directions = data[jointKey];

        for (const direction in directions) {
          const proxies = data[jointKey][direction];
          console.log("renderProxies proxies:", proxies);

          renderProxy(proxies['proxy1']);
          renderProxy(proxies['proxy2']);
          renderProxy(proxies['proxyMedian']);
            
        }
    }
  }

  renderJointVertexHelpers(data) {
    console.log("renderJointVertexHelpers data:", data);
    const geometry = new THREE.BoxGeometry(26, 26, 26);

    for (const jointKey in data) {
        const directions = data[jointKey];

        for (const direction in directions) {
            console.log("renderJointVertexHelpers direction:", direction);
          
            const proxies = directions[direction];

            console.log("renderJointVertexHelpers proxies:", proxies);

            const vertexMaterialConfigs = {
              transparent: true,
              depthWrite: false,
              opacity: 0
            }

            const material1 = new THREE.MeshStandardMaterial({ color: 0xff0000, ...vertexMaterialConfigs });
            proxies.proxy1.coordinates.forEach(coord => {
              const proxy = new THREE.Mesh(geometry, material1);
              proxy.name = "jointVertexHelpers";
              proxy.position.set(coord.x, coord.y, coord.z);
              proxy.visible = false;
              sharedData.sceneHelper.addToScene(proxy);
            });

            const material2 = new THREE.MeshStandardMaterial({ color: 0x0000ff, ...vertexMaterialConfigs });
            proxies.proxy2.coordinates.forEach(coord => {
              const proxy = new THREE.Mesh(geometry, material2);
              proxy.name = "jointVertexHelpers";
              proxy.position.set(coord.x, coord.y, coord.z);
              proxy.visible = false;
              sharedData.sceneHelper.addToScene(proxy);
            });

            const material3 = new THREE.MeshStandardMaterial({ color: 0x00ff00, ...vertexMaterialConfigs });
            proxies.proxyMedian.coordinates.forEach(coord => {
              const proxy = new THREE.Mesh(geometry, material3);
              proxy.name = "jointVertexHelpers";
              proxy.position.set(coord.x, coord.y, coord.z);
              proxy.visible = false;
              sharedData.sceneHelper.addToScene(proxy);
            });
        }
    }
  }

    cloneAndTransformComponent(componentId, ahuObject, ductId) {
      console.log("cloneAndTransformComponent started:", componentId, ahuObject);
      console.log("cloneAndTransformComponent sharedData.sceneHelper.instanceSet:", sharedData.sceneHelper.instanceSet);
      
      
      const libraryKey = ahuObject.xetoDictionary.components[componentId].componentId.split("r:novo.graphics::")[1];

      console.log("cloneAndTransformComponent step 1");

      const instanceKey = sharedData.componentLibrary[libraryKey].componentName;

      console.log("cloneAndTransformComponent libraryKey:", libraryKey);
      console.log("cloneAndTransformComponent instanceKey:", instanceKey);

      const clonedComponent = sharedData.sceneHelper.instanceSet[instanceKey].clone();

      clonedComponent.position.copy(ahuObject.resources.components[componentId].position);
      // clonedComponent.rotation.y = THREE.MathUtils.degToRad(ahuObject.resources.components[componentId].rotation.y);

      // this.rotateAroundPivot(
      //   clonedComponent, 
      //   ahuObject.resources.ducts[ductId].position, 
      //   THREE.MathUtils.degToRad(ahuObject.resources.ducts[ductId].rotation.y)
      // );

      clonedComponent.scale.copy(ahuObject.resources.components[componentId].scale);

      clonedComponent.visible = true;
      this.extendObject3D(clonedComponent); 

      console.log("cloneAndTransformComponent clonedComponent:", clonedComponent);
      sharedData.sceneHelper.addToScene(clonedComponent);

      return clonedComponent;
    }

    rotateComponentsWithDuct(ductMesh, componentMeshes, rotation) {
      const pivot = ductMesh.position.clone();
      const angle = THREE.MathUtils.degToRad(rotation);
  
      componentMeshes.forEach(componentMesh => {
          componentMesh.position.sub(pivot);  // Move relative to pivot
          componentMesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);  // Rotate around pivot
          componentMesh.position.add(pivot);  // Move back to world position
          componentMesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), angle);  // Rotate the component itself
      });
  
      ductMesh.rotateY(angle);
    }

    createDuct(duct, ductKey) {
      console.log("createDuct started:", duct, ductKey, sharedData.moduleConfigs);
      const dims = duct.dimensions;
      const wt = sharedData.moduleConfigs.parametricOptions.wallThickness; // wall-thickness
  
      // Create geometries with specified dimensions
      const ceilingGeometry = new THREE.BoxGeometry(dims.x, dims.y + wt, wt);
      const backWallGeometry = new THREE.BoxGeometry(dims.x, wt, dims.z);
      const floorGeometry = new THREE.BoxGeometry(dims.x, dims.y + wt, wt);
  
      // Position the geometries to align properly
      ceilingGeometry.translate(0, 0, dims.z / 2);
      backWallGeometry.translate(0, dims.y / 2, 0);
      floorGeometry.translate(0, 0, -dims.z / 2);
  
      // Merge geometries into a single one
      const mergedGeometry = BufferGeometryUtils.mergeGeometries([
          ceilingGeometry, 
          backWallGeometry, 
          floorGeometry
      ]);
  
      // Create a material and mesh for the merged geometry
      const ductMaterial = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
      const mergedMesh = new THREE.Mesh(mergedGeometry, ductMaterial);
  
      // Create the wireframe from the merged geometry
      const edges = new THREE.EdgesGeometry(mergedGeometry);
      const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
  
      // Create an empty Object3D to hold both the solid mesh and wireframe
      const parentObject = new THREE.Object3D();
      parentObject.add(mergedMesh);
      // parentObject.add(wireframe);
  
      // Position the entire parent object
      parentObject.position.copy(duct.position);
      parentObject.name = "duct";
  
      // Add the combined object to the scene
      sharedData.sceneHelper.addToScene(parentObject);

      console.log("createDuct parentObject:", parentObject);
  
      return parentObject;
    }  

    renderArrow(segment) {
        const clonedArrow = sharedData.sceneHelper.instanceSet.arrow.clone();
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
        sharedData.sceneHelper.addToScene(clonedArrow);
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
  
      // clonedInstance.sceneHelper = this.sceneHelper;
  
      this.extendObject3D(clonedInstance); 
  
      // Add the cloned instance to the scene and make it visible
      sharedData.sceneHelper.addToScene(clonedInstance);
      clonedInstance.visible = true;
  
      return clonedInstance;
    }

    /**
     * Extends the functionality of an Object3D instance with custom AHU component behaviors.
     * 
     * @param {Object} ahuComponent - The Object3D instance representing the AHU component.
     */
    extendObject3D(ahuComponent) {
        ahuComponent.sceneHelper = sharedData.sceneHelper;
        ahuComponent.setAttribute = function(value){
          console.log("setAttribute started:", ahuComponent);
    
          const ahuComponentAttributes = ahuComponent.userData.component.attributes;
          const attrKeys = Object.keys(ahuComponentAttributes);
          const methodKey = attrKeys[0];
    
          ahuComponent[methodKey](value);
        };
        ahuComponent.setAnimation = function(value){
          this.userData.component.attributes.setAnimation.value = value;
          sharedData.sceneHelper.updateTooltip();
        };
        ahuComponent.setTargetTransforms = function(value){
          const attribute = this.userData.component.attributes.setTargetTransforms;
    
          if(value >= attribute.min && value <= attribute.max) {
            attribute.value = value;
            sharedData.sceneHelper.updateTooltip();            
    
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
            sharedData.sceneHelper.updateTooltip();
    
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
          sharedData.sceneHelper.updateTooltip();
        };
        ahuComponent.setTransparency = function(value){
          for(const i in this.children) {
            if(this.children[i].isMesh) {
              this.children[i].material.opacity = 1 - value;
              this.children[i].renderOrder = 1;
            }
          }
        };
        sharedData.sceneHelper.cacheAnimationTargets();
    }

}