import * as THREE from 'three';
import Canvas2D from "../2D/Canvas2D.js";
import { sharedData } from "../Ahu3D/globals.js";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { createTextMesh } from "./Geometry/Helpers/Geometry_Text.js"

export default class Mesh3D {
  constructor(sceneHelper){
    sharedData.sceneHelper = sceneHelper;
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

    // Clone and position meshes asynchronously
    for (const ductId in ahuObject.resources.ducts) {
        const duct = ahuObject.resources.ducts[ductId];
        const ductInstance = this.createDuct(duct, ductId);
        ahuObject["3d"].ducts.meshes[ductId] = ductInstance;

        let componentMeshes = [];
        for(const i in ahuObject.associations.ducts[ductId].components) {
          const componentId = ahuObject.associations.ducts[ductId].components[i];
          console.log("render3D componentId:", componentId);
          const componentMesh = await this.cloneAndTransformComponent(componentId, ahuObject, ductId);
          ahuObject["3d"].components.meshes[componentId] = componentMesh;
          componentMeshes.push(componentMesh);
        }
        this.rotateComponentsWithDuct(ductInstance, componentMeshes, duct.rotation.y);

        // let componentMeshes = [];
        // // Create all component meshes asynchronously
        // const componentPromises = ahuObject.associations.ducts[ductId].components.map(async (componentId) => {
        //     console.log("render3D componentId:", componentId);
        //     const componentMesh = this.cloneAndTransformComponent(componentId, ahuObject, ductId);
        //     ahuObject["3d"].components.meshes[componentId] = componentMesh;
        //     return componentMesh;
        // });

        // // Wait for all component meshes to be created
        // componentMeshes = await Promise.all(componentPromises);
        // this.rotateComponentsWithDuct(ductInstance, componentMeshes, duct.rotation.y);

        console.log("render3D addCubesFromData starting:", ahuObject);
        this.renderProxies(ahuObject.resources.joints);
        this.renderJointVertexHelpers(ahuObject.resources.joints);

        console.log("render3D renderJoints starting:", ahuObject["3d"]);
        this.renderJoints(ahuObject["3d"]);

        
    }

    console.log("render3D renderJoints finished:", ahuObject);
    this.renderEnds(ahuObject);

    // this.renderHelpers(ahuObject);

    return renderedAssembly;
  }

  renderHelpers(ahuObject) {
    console.log("renderHelpers started:", ahuObject);
    for(const arrowId in ahuObject.auxiliary["3d"].arrows) {
      const arrowResource = ahuObject.auxiliary["3d"].arrows[arrowId];

      const ductKey = ahuObject.associations.arrows[arrowId];
      const duct = ahuObject.resources.ducts[ductKey];

      const blockStyle = ahuObject.xetoDictionary.edges[ductKey].blockStyle;

      console.log("renderHelpers arrowResource:", arrowResource, arrowId);

      let arrowMesh = sharedData.sceneHelper.instanceSet.arrow.clone();
      arrowMesh.position.copy(arrowResource.position);
      arrowMesh.rotation.y = THREE.MathUtils.degToRad( duct.rotation.y);
      // arrowMesh.rotation.y += THREE.MathUtils.degToRad( arrowResource.rotation.y);
      arrowMesh.visible = true;
      console.log("renderHelpers arrowMesh:", arrowMesh);
      sharedData.sceneHelper.addToScene(arrowMesh);
    }

    for(const labelId in ahuObject.auxiliary["3d"].labels) {
      const labelResource = ahuObject.auxiliary["3d"].labels[labelId];

      const ductKey = ahuObject.associations.labels[labelId];
      const duct = ahuObject.resources.ducts[ductKey];

      const blockStyle = ahuObject.xetoDictionary.edges[ductKey].blockStyle;

      this.createTextMesh(blockStyle, labelResource.position);
    }
  }

  createTextMesh(blockStyle, position) {
    console.log("createTextMesh started:", blockStyle, position);
    const textValue = blockStyle.helpers.text.value || "Default";

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

        const material = blockStyle.helpers.text.material || { color: "#AAAAAA", opacity: 1 };
        const color = material.color || '#AAAAAA';
        const opacity = material.opacity || 1;

        textMesh.material.color = new THREE.Color(color);
        textMesh.material.opacity = opacity;
    
        textMesh.rotation.x = THREE.MathUtils.degToRad(90);

        textMesh.position.copy(position);

        textMesh.visible = true;

        sharedData.sceneHelper.addToScene(textMesh);
        
    });
  }

  renderEnds(ahuObject) {
    for(const endId in ahuObject.resources.ends) {
      const endResource = ahuObject.resources.ends[endId];

      console.log("renderEnds endResource:", endResource, endId);

      let ductEndMesh = null;
      if(endId.includes('Insert')) {
        ductEndMesh = this.createParametricInsert(endResource.dimensions.y);
      }
      else if(endId.includes('Cap')) {
        ductEndMesh = this.createParametricCap(endResource.dimensions.y);
      }

      if(ductEndMesh != null) {
        ductEndMesh.position.copy(endResource.position);
        ductEndMesh.rotation.y = THREE.MathUtils.degToRad( endResource.rotation.y);
      }
    }
  }

  createParametricInsert(size = 500) {
    const sectionHeight = 60;
    
    const topGeometry = new THREE.BoxGeometry(size + 30, size + 30, sectionHeight);
    const leftGeometry = new THREE.BoxGeometry(30, size + 30, sectionHeight);
    const rightGeometry = new THREE.BoxGeometry(30, size + 30, sectionHeight);
    const backGeometry = new THREE.BoxGeometry(size + 30, 30, sectionHeight);

    const topGeometryMatrix = new THREE.Matrix4();
    topGeometryMatrix.makeTranslation(0, 0, 30); 
    topGeometry.applyMatrix4(topGeometryMatrix);

    const leftGeometryMatrix = new THREE.Matrix4();
    leftGeometryMatrix.makeTranslation(size/-2, 0, sectionHeight/2 - 15); 
    leftGeometry.applyMatrix4(leftGeometryMatrix);

    const rightGeometryMatrix = new THREE.Matrix4();
    rightGeometryMatrix.makeTranslation(size/2, 0, sectionHeight/2 - 15); 
    rightGeometry.applyMatrix4(rightGeometryMatrix);

    const backGeometryMatrix = new THREE.Matrix4();
    backGeometryMatrix.makeTranslation(0, size/2, sectionHeight/2 - 15); 
    backGeometry.applyMatrix4(backGeometryMatrix);
    
    let mergedGeometry = BufferGeometryUtils.mergeGeometries([
        leftGeometry,
        rightGeometry,
        backGeometry
    ], false);

    let mergedGeometry2 = mergedGeometry.clone();
    let mergedConeGeometry = mergedGeometry.clone();

    const mergedConeGeometryMatrix = new THREE.Matrix4();
    mergedConeGeometryMatrix.makeTranslation(0, 0, sectionHeight); 
    mergedConeGeometry.applyMatrix4(mergedConeGeometryMatrix);

    const mergedGeometry2Matrix = new THREE.Matrix4();
    mergedGeometry2Matrix.makeTranslation(0, 0, sectionHeight * 2); 
    mergedGeometry2.applyMatrix4(mergedGeometry2Matrix);

    this.moveInsertTopVertices(mergedConeGeometry, sectionHeight, sectionHeight);
    this.moveInsertTopVertices(mergedGeometry2, sectionHeight, sectionHeight);

    let mergedGeometryTotal = BufferGeometryUtils.mergeGeometries([
        mergedGeometry,
        mergedConeGeometry,
        mergedGeometry2
    ], false);
    
    const material = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor, side: THREE.DoubleSide });
    const mergedMesh = new THREE.Mesh(mergedGeometryTotal, material);
    mergedMesh.name = "ductEnd";
    sharedData.sceneHelper.addToScene(mergedMesh);
    
    return mergedMesh;
  }

  createParametricCap(size = 500) {        
      const topGeometry = new THREE.BoxGeometry(size + 30, size + 30, 30);
      const leftGeometry = new THREE.BoxGeometry(30, size + 30, 30);
      const rightGeometry = new THREE.BoxGeometry(30, size + 30, 30);
      const backGeometry = new THREE.BoxGeometry(size + 30, 30, 30);

      const topGeometryMatrix = new THREE.Matrix4();
      topGeometryMatrix.makeTranslation(0, 0, 30); 
      topGeometry.applyMatrix4(topGeometryMatrix);

      const leftGeometryMatrix = new THREE.Matrix4();
      leftGeometryMatrix.makeTranslation(size/-2, 0, 0); 
      leftGeometry.applyMatrix4(leftGeometryMatrix);

      const rightGeometryMatrix = new THREE.Matrix4();
      rightGeometryMatrix.makeTranslation(size/2, 0, 0); 
      rightGeometry.applyMatrix4(rightGeometryMatrix);

      const backGeometryMatrix = new THREE.Matrix4();
      backGeometryMatrix.makeTranslation(0, size/2, 0); 
      backGeometry.applyMatrix4(backGeometryMatrix);
      
      let mergedGeometry = BufferGeometryUtils.mergeGeometries([
          topGeometry,
          leftGeometry,
          rightGeometry,
          backGeometry
      ], false);

      const material = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });        
      const mergedMesh = new THREE.Mesh(mergedGeometry, material);
      mergedMesh.name = "ductEnd";
      sharedData.sceneHelper.addToScene(mergedMesh);
      
      return mergedMesh;
  }

  moveInsertTopVertices(geometry, topPosition, moveDistance) {
      // Access the position attribute
      const positionAttribute = geometry.attributes.position;
  
      // Create a center point for reference
      const center = new THREE.Vector3(0, 0, 0);
  
      for (let i = 0; i < positionAttribute.count; i++) {
          const x = positionAttribute.getX(i);
          const y = positionAttribute.getY(i);
          const z = positionAttribute.getZ(i);
  
          // Check if the vertex is a "top vertex" (based on z-axis height)
          if (z >= topPosition) { // Adjust the threshold as needed for "top" vertices
              const vertex = new THREE.Vector3(x, y, z);
  
              // Calculate the direction vector from the center to the vertex
              const direction = vertex.clone().sub(center).normalize();
  
              // Move the vertex outward along the direction vector
              const newPosition = vertex.add(direction.multiplyScalar(moveDistance));
  
              // Update the vertex position
              positionAttribute.setXYZ(i, newPosition.x, newPosition.y, newPosition.z);
          }
      }
  
      // Mark the position attribute as needing an update
      positionAttribute.needsUpdate = true;
  }

  renderJoints(items3d) {
      const jointGeometries = items3d.joints.geometry;
      const geometriesArray = [];

      // Collect all joint geometries
      for (const jointGeometryKey in jointGeometries) {
          const jointGeometry = jointGeometries[jointGeometryKey];

          if(jointGeometry) {
            // Clone to prevent modifying the original geometry
            geometriesArray.push(jointGeometry.clone());
          }
          
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

    const material1 = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor, side: THREE.DoubleSide });
    

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

  async cloneAndTransformComponent(componentId, ahuObject, ductId) {
    console.log("cloneAndTransformComponent started:", componentId, ahuObject);
    console.log("cloneAndTransformComponent sharedData.sceneHelper.instanceSet:", sharedData.sceneHelper.instanceSet);

    const libraryKey = ahuObject.xetoDictionary.components[componentId].componentId.split("r:novo.graphics::")[1];
    const instanceKey = sharedData.componentLibrary[libraryKey].componentName;

    console.log("cloneAndTransformComponent libraryKey:", libraryKey);
    console.log("cloneAndTransformComponent instanceKey:", instanceKey);

    // Ensure cloning is asynchronous if necessary
    const clonedComponent = sharedData.sceneHelper.instanceSet[instanceKey].clone();

    clonedComponent.position.copy(ahuObject.resources.components[componentId].position);
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

        // Flip locally along the x-axis if rotation is 180 degrees
        if (rotation == 180) {
          componentMesh.scale.z *= -1;
        }
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
    const ductMaterial = new THREE.MeshStandardMaterial({ color: 0xAEB9C2, side: THREE.DoubleSide });
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