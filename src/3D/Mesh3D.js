import * as THREE from 'three';
import Canvas2D from "../2D/Canvas2D.js";
import { sharedData } from "../Ahu3D/globals.js";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { createTextMesh } from "./Geometry/Helpers/Geometry_Text.js"

/**
 * Class for rendering 3D meshes in an assembly, including components, ducts, joints, and auxiliary elements.
 * This class is responsible for creating, transforming, and rendering various 3D objects for the AHU assembly.
 */
export default class Mesh3D {
  constructor(sceneHelper){
    sharedData.sceneHelper = sceneHelper; // Set the shared scene helper for scene management
    this.Canvas2D = new Canvas2D(); // Initialize the Canvas2D class
  }

  /**
   * loadAssemblyMeshes
   * 
   * Loads the component meshes for the given components and returns them as promises.
   * This method filters the components from the cleaned assembly data and loads their mesh representations.
   * 
   * @param {Array} cleanedXeto - The cleaned Xeto data containing components.
   * @param {Array} components - The list of components to load meshes for.
   * @param {Object} componentLibrary - A library of components used for loading mesh data.
   * @returns {Promise<Array>} A promise that resolves to an array of loaded meshes.
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

  /**
   * render3D
   * 
   * Renders the 3D meshes for the AHU assembly, including ducts, components, and proxies.
   * It manages the transformation and positioning of components based on their associated ducts.
   * 
   * @param {Object} ahuObject - The AHU object containing the resources and associations for the assembly.
   * @returns {Array} An array of rendered meshes.
   */
  async render3D(ahuObject) {
    console.log("render3D started:", ahuObject);
    let renderedAssembly = [];

    // Clone and position meshes asynchronously for each duct in the AHU assembly
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

        this.renderProxies(ahuObject.resources.joints);
        this.renderJointVertexHelpers(ahuObject.resources.joints);

        this.renderJoints(ahuObject["3d"]);
    }

    console.log("render3D renderJoints finished:", ahuObject);
    this.renderEnds(ahuObject);

    this.renderHelpers(ahuObject);

    // this.renderControllers(ahuObject);

    const wireframeBox = this.createBoundingBoxWireframe(sharedData.ahuBoundingBox);
    // sharedData.sceneHelper.addToScene(wireframeBox);

    const controllerSettings = ahuObject.resources.controllers['Controller-0'];

    // Calculate cube position based on settings
    const controllerPosition = this.calculateCubePosition(controllerSettings, sharedData.ahuBoundingBox);
    
    // Create cube
    const controllerGeometry = new THREE.BoxGeometry(
        controllerSettings.dimensions.x,
        controllerSettings.dimensions.y,
        controllerSettings.dimensions.z
    );
    const controllerMaterial = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });
    const controllerMesh = new THREE.Mesh(controllerGeometry, controllerMaterial);
    controllerMesh.position.set(controllerPosition.x, controllerPosition.y, controllerPosition.z);
    sharedData.sceneHelper.addToScene(controllerMesh);

    ahuObject['3d'].controllers.meshes['Controller-0'] = controllerMesh;

    console.log("setControllers controllerSettings:", controllerSettings);

    this.positionSpheres(controllerMesh, controllerSettings, false, "input"); // For inputs
    this.positionSpheres(controllerMesh, controllerSettings, true, "output"); // For outputs

  }

  positionSpheres(controllerMesh, controllerSettings, isOutput, attributeType) {
    // Get the attributes based on whether we're handling inputs or outputs
    const attributes = isOutput 
        ? controllerSettings.attributes.outputs 
        : controllerSettings.attributes.inputs;
    
    const totalSpheres = Object.keys(attributes).length;
    const startX = controllerMesh.position.x - (controllerSettings.dimensions.x / 2) + 64;
    const endX = controllerMesh.position.x + (controllerSettings.dimensions.x / 2) - 64;
    
    // Calculate z position based on whether it's input or output
    const zPosition = isOutput
        ? (controllerMesh.position.z - controllerSettings.dimensions.z / 2) - 150 // Output position
        : (controllerMesh.position.z + controllerSettings.dimensions.z / 2) + 150; // Input position (your original code)
    
    // Calculate spacing between spheres
    const spacing = (endX - startX) / (totalSpheres - 1 || 1); // Handle case of 1 sphere
    
    // Create and position each sphere
    for(let i = 0; i < totalSpheres; i++) {
        const geometry = new THREE.SphereGeometry(64, 32, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(geometry, material);
        
        // Position on x-axis with equal spacing
        sphere.position.set(
            startX + (i * spacing), // Distribute along x-axis
            controllerMesh.position.y,  // Keep original y position
            zPosition // Use calculated z position based on input/output
        );
        
        // You could store a reference to the attribute for this sphere if needed
        sphere.userData.attributeKey = Object.keys(attributes)[i];
        sphere.userData.attributeType = attributeType; // "input" or "output"
        
        sharedData.sceneHelper.addToScene(sphere);
    }
    
    return; // Could return the created spheres if needed
  }

  calculateCubePosition(controllerSettings, boundingBox) {
    const position = { x: 0, y: 0, z: 0 };
    const halfCubeWidth = controllerSettings.dimensions.x / 2;
    const halfCubeHeight = controllerSettings.dimensions.z / 2;
    
    // X position (left-right)
    if (controllerSettings.position.x === "center") {
      position.x = boundingBox.center.x;
    } else if (controllerSettings.position.x === "left") {
      position.x = boundingBox.min.x - halfCubeWidth - controllerSettings.padding.x;
    } else if (controllerSettings.position.x === "right") {
      position.x = boundingBox.max.x + halfCubeWidth + controllerSettings.padding.x;
    }
    
    // Y position (fixed to center of component height)
    position.y = boundingBox.center.y;
    
    // Z position (top-bottom) - note that in Three.js, positive Z is coming out of the screen,
    // but in your settings Z appears to be vertical (top-bottom)
    if (controllerSettings.position.z === "bottom") {
      position.z = boundingBox.min.z - halfCubeHeight - controllerSettings.padding.z;
    } else if (controllerSettings.position.z === "top") {
      position.z = boundingBox.max.z + halfCubeHeight + controllerSettings.padding.z;
    } else if (controllerSettings.position.z === "center") {
      position.z = boundingBox.center.z;
    }
    
    return position;
  }

  createBoundingBoxWireframe(boundingBox) {
    // Extract min and max points
    const min = new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.min.z);
    const max = new THREE.Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.max.z);
    
    // Create a Box3 from the min and max points
    const box3 = new THREE.Box3(min, max);
    
    // Get the center and size of the box
    const center = new THREE.Vector3();
    box3.getCenter(center);
    
    const size = new THREE.Vector3();
    box3.getSize(size);
    
    // Create a BoxGeometry with the dimensions of our bounding box
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    
    // Create a wireframe material
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,     // Green color, can be changed
      transparent: true,
      opacity: 0.5
    });
    
    // Create the mesh and position it at the center of the bounding box
    const wireframeMesh = new THREE.Mesh(geometry, material);
    wireframeMesh.position.copy(center);
    
    return wireframeMesh;
  }

  renderControllers(ahuObject) {
    console.log("renderControllers started:", ahuObject);

    for (const controllerId in ahuObject.resources.controllers) {
        const controllerResource = ahuObject.resources.controllers[controllerId];

        console.log("renderControllers controllerResource:", controllerResource);

        const geometry = new THREE.BoxGeometry(700, 700, 700, 10, 10, 10);
        const material = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });
        const controllerMesh = new THREE.Mesh(geometry, material);

        // controllerMesh.position.copy(controllerResource.position);
        sharedData.sceneHelper.addToScene(controllerMesh);
        ahuObject["3d"].controllers.meshes[controllerId] = controllerMesh; // Store it in the 3d object
    }
  }

  /**
   * renderHelpers
   * 
   * Renders the 3D helper objects, such as arrows and labels, for the AHU assembly.
   * These helpers assist with visualizing directions and labels in the 3D scene.
   * 
   * @param {Object} ahuObject - The AHU object containing auxiliary 3D data for arrows and labels.
   */
  async renderHelpers(ahuObject) {
    console.log("renderHelpers started:", ahuObject);

    // Ensure the "3d" object structure includes "helpers"
    if (!ahuObject["3d"]) {
        ahuObject["3d"] = {};
    }
    if (!ahuObject["3d"].helpers) {
        ahuObject["3d"].helpers = { meshes: {} };
    }

    // Render arrow helpers
    for (const arrowId in ahuObject.auxiliary["3d"].arrows) {
        const arrowResource = ahuObject.auxiliary["3d"].arrows[arrowId];

        const ductKey = ahuObject.associations.arrows[arrowId];
        const duct = ahuObject.resources.ducts[ductKey];

        const blockStyle = ahuObject.xetoDictionary.edges[ductKey]?.blockStyle;
        if (!blockStyle) {
            console.warn(`Missing blockStyle for ductKey: ${ductKey}`);
            continue;
        }

        console.log("renderHelpers arrowResource:", arrowResource, arrowId);

        let arrowMesh = sharedData.sceneHelper.instanceSet?.arrow?.clone();
        if (!arrowMesh) {
            console.error(`Failed to clone arrow instance for arrowId: ${arrowId}`);
            continue;
        }

        arrowMesh.position.copy(arrowResource.position);
        arrowMesh.rotation.y = THREE.MathUtils.degToRad(arrowResource.rotation.y);
        arrowMesh.visible = true;

        if (arrowMesh.children.length > 1) {
            arrowMesh.children[0].material = arrowMesh.children[0].material.clone();
            arrowMesh.children[0].material.color = new THREE.Color(blockStyle.helpers.arrow.material.color);
            arrowMesh.children[1].material = arrowMesh.children[1].material.clone();
            arrowMesh.children[1].material.color = new THREE.Color(blockStyle.helpers.arrow.material.color);
        } else {
            console.warn(`Arrow mesh has unexpected children structure for arrowId: ${arrowId}`);
        }

        console.log("arrowMesh:", arrowMesh);
        arrowMesh.name = "arrow";

        // Store arrow mesh in ahuObject["3d"].helpers.meshes
        ahuObject["3d"].helpers.meshes[arrowId] = arrowMesh;

        sharedData.sceneHelper.addToScene(arrowMesh);
    }

    // Render label helpers
    for (const labelId in ahuObject.auxiliary["3d"].labels) {
        const labelResource = ahuObject.auxiliary["3d"].labels[labelId];

        const ductKey = ahuObject.associations.labels[labelId];
        const duct = ahuObject.resources.ducts[ductKey];

        const blockStyle = ahuObject.xetoDictionary.edges[ductKey]?.blockStyle;
        if (!blockStyle) {
            console.warn(`Missing blockStyle for ductKey: ${ductKey}`);
            continue;
        }

        console.log(`📝 Creating text mesh for labelId: ${labelId} at`, labelResource.position);

        try {
            await createTextMesh(blockStyle, labelResource.position, ahuObject, labelId); // Await the async function
            console.log(`Label mesh for ${labelId} stored in ahuObject["3d"].helpers.meshes`);
        } catch (error) {
            console.error(`Error creating text mesh for labelId: ${labelId}`, error);
        }
    }
  }

  /**
   * renderEnds
   * 
   * Renders the parametric end meshes (inserts or caps) for ducts.
   * The appropriate end type is determined based on the end ID and geometry is created accordingly.
   * 
   * @param {Object} ahuObject - The AHU object containing the end resources for ducts.
   */
  renderEnds(ahuObject) {
    if (!ahuObject["3d"].ends) {
        ahuObject["3d"].ends = { meshes: {} };
    }

    for (const endId in ahuObject.resources.ends) {
        const endResource = ahuObject.resources.ends[endId];

        console.log("renderEnds endResource:", endResource, endId);

        let ductEndMesh = null;
        if (endId.includes('Insert')) {
            ductEndMesh = this.createParametricInsert(endResource.dimensions.y);
        } else if (endId.includes('Cap')) {
            ductEndMesh = this.createParametricCap(endResource.dimensions.y);
        }

        if (ductEndMesh != null) {
            ductEndMesh.position.copy(endResource.position);
            ductEndMesh.rotation.y = THREE.MathUtils.degToRad(endResource.rotation.y);
            ahuObject["3d"].ends.meshes[endId] = ductEndMesh; // Store it in the 3d object
        }
    }
  }

  /**
   * createParametricInsert
   * 
   * Creates a parametric insert mesh for the duct end, based on the provided size.
   * This mesh consists of several box geometries combined to form the insert shape.
   * 
   * @param {number} size - The size of the insert to be created.
   * @returns {THREE.Mesh} The created insert mesh.
   */
  createParametricInsert(size = 500) {
    const sectionHeight = 60;
    
    const topGeometry = new THREE.BoxGeometry(size + 30, size + 30, sectionHeight);
    const leftGeometry = new THREE.BoxGeometry(30, size + 30, sectionHeight);
    const rightGeometry = new THREE.BoxGeometry(30, size + 30, sectionHeight);
    const backGeometry = new THREE.BoxGeometry(size + 30, 30, sectionHeight);

    // Apply transformations to position the parts of the insert
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

    // Apply transformations to vertices of the insert mesh
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

  /**
   * createParametricCap
   * 
   * Creates a parametric cap mesh for the duct end, based on the provided size.
   * This mesh is made of several box geometries combined to form the cap shape.
   * 
   * @param {number} size - The size of the cap to be created.
   * @returns {THREE.Mesh} The created cap mesh.
   */
  createParametricCap(size = 500) {        
      const topGeometry = new THREE.BoxGeometry(size + 30, size + 30, 30);
      const leftGeometry = new THREE.BoxGeometry(30, size + 30, 30);
      const rightGeometry = new THREE.BoxGeometry(30, size + 30, 30);
      const backGeometry = new THREE.BoxGeometry(size + 30, 30, 30);

      // Apply transformations to position the parts of the cap
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

  /**
   * moveInsertTopVertices
   * 
   * Moves the top vertices of the insert geometry outward along a specific direction.
   * This is useful for positioning parts of the parametric insert mesh in the 3D scene.
   * 
   * @param {THREE.BufferGeometry} geometry - The geometry of the insert to modify.
   * @param {number} topPosition - The z-coordinate defining the top position.
   * @param {number} moveDistance - The distance to move the vertices outward.
   */
  moveInsertTopVertices(geometry, topPosition, moveDistance) {
      const positionAttribute = geometry.attributes.position;
      const center = new THREE.Vector3(0, 0, 0); // Create a reference center point

      for (let i = 0; i < positionAttribute.count; i++) {
          const x = positionAttribute.getX(i);
          const y = positionAttribute.getY(i);
          const z = positionAttribute.getZ(i);

          if (z >= topPosition) { // Move vertices that are above the topPosition
              const vertex = new THREE.Vector3(x, y, z);
              const direction = vertex.clone().sub(center).normalize();
              const newPosition = vertex.add(direction.multiplyScalar(moveDistance));
              positionAttribute.setXYZ(i, newPosition.x, newPosition.y, newPosition.z);
          }
      }

      positionAttribute.needsUpdate = true; // Mark the attribute as needing an update
  }

  /**
   * renderJoints
   * 
   * Renders the 3D joints by merging joint geometries into one and creating a mesh with a wireframe.
   * This allows the joints in the AHU assembly to be visualized in the 3D scene.
   * 
   * @param {Object} items3d - The 3D items containing joint geometries to be rendered.
   */
  renderJoints(items3d) {
      const jointGeometries = items3d.joints.geometry;
      const geometriesArray = [];

      for (const jointGeometryKey in jointGeometries) {
          const jointGeometry = jointGeometries[jointGeometryKey];

          if(jointGeometry) {
            geometriesArray.push(jointGeometry.clone());
          }
      }

      if (geometriesArray.length > 0) {
          const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometriesArray);
          const material = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor, side: THREE.DoubleSide });
          const mergedMesh = new THREE.Mesh(mergedGeometry, material);
          mergedMesh.name = "joint";

          const wireframeGeometry = new THREE.WireframeGeometry(mergedGeometry);
          const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
          const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

          wireframe.visible = false;
          mergedMesh.add(wireframe);

          sharedData.sceneHelper.addToScene(mergedMesh);
          items3d.joints.mergedMesh = mergedMesh;
      }

      for (const arc of items3d.joints.arcs) {
        sharedData.sceneHelper.addToScene(arc);
      }

      delete items3d.joints.geometry; // Clean up the original geometry data
  }

  /**
   * renderProxies
   * 
   * Renders the proxies for joints, displaying them as box geometries with the specified thickness.
   * 
   * @param {Object} data - The joint proxy data containing coordinates for rendering.
   */
  renderProxies(data) {
    console.log("renderProxies data:", data);

    const wt = sharedData.moduleConfigs.parametricOptions.wallThickness;

    let length = 0;
    let position = {x: 0, y: 0, z:0};
    const material = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });

    /**
     * renderProxy
     * 
     * Helper function to render a proxy from the provided coordinates.
     * 
     * @param {Object} proxy - The proxy data to render.
     */
    function renderProxy(proxy) {
      position.x = (proxy.coordinates[0].x + proxy.coordinates[3].x) / 2;
      position.y = (proxy.coordinates[7].y + proxy.coordinates[0].y) / 2;
      position.z = (proxy.coordinates[0].z + proxy.coordinates[1].z) / 2;
  
      length = Math.abs(proxy.coordinates[7].y - proxy.coordinates[0].y);

      const geometry = new THREE.BoxGeometry(wt, length, wt);
      const proxyMesh = new THREE.Mesh(geometry, material);
      proxyMesh.name = "jointProxy";
      proxyMesh.position.copy(position);
      sharedData.sceneHelper.addToScene(proxyMesh);
    }

    for (const jointKey in data) {
        const directions = data[jointKey];

        for (const direction in directions) {
          const proxies = data[jointKey][direction];
          renderProxy(proxies['proxy1']);
          renderProxy(proxies['proxy2']);
          renderProxy(proxies['proxyMedian']);
        }
    }
  }

  /**
   * renderJointVertexHelpers
   * 
   * Renders vertex helpers for each joint, displaying them as small mesh indicators.
   * The helpers are positioned based on the proxy coordinates.
   * 
   * @param {Object} data - The joint proxy data containing vertex coordinates for rendering.
   */
  renderJointVertexHelpers(data) {
    console.log("renderJointVertexHelpers data:", data);
    const geometry = new THREE.BoxGeometry(26, 26, 26);

    for (const jointKey in data) {
        const directions = data[jointKey];

        for (const direction in directions) {
            const proxies = directions[direction];
            const vertexMaterialConfigs = {
              transparent: true,
              depthWrite: false,
              opacity: 0
            };

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

  /**
   * cloneAndTransformComponent
   * 
   * Clones and transforms a component mesh, adjusting its position and scale based on the provided data.
   * 
   * @param {string} componentId - The ID of the component to clone and transform.
   * @param {Object} ahuObject - The AHU object containing the component data.
   * @param {string} ductId - The ID of the duct associated with the component.
   * @returns {THREE.Mesh} The cloned and transformed component mesh.
   */
  async cloneAndTransformComponent(componentId, ahuObject, ductId) {
    console.log("cloneAndTransformComponent started:", componentId, ahuObject);

    const libraryKey = ahuObject.xetoDictionary.components[componentId].componentId.split("r:novo.graphics::")[1];
    const instanceKey = sharedData.componentLibrary[libraryKey].componentName;

    const clonedComponent = sharedData.sceneHelper.instanceSet[instanceKey].clone();

    clonedComponent.position.copy(ahuObject.resources.components[componentId].position);
    clonedComponent.scale.copy(ahuObject.resources.components[componentId].scale);
    clonedComponent.userData.name = componentId;
    clonedComponent.visible = true;

    this.extendObject3D(clonedComponent);

    sharedData.sceneHelper.addToScene(clonedComponent);

    return clonedComponent;
  }

  /**
   * rotateComponentsWithDuct
   * 
   * Rotates the components relative to their associated duct based on the duct's rotation.
   * This method ensures the components are positioned correctly relative to the duct orientation.
   * 
   * @param {THREE.Mesh} ductMesh - The mesh representing the duct to which the components are attached.
   * @param {Array} componentMeshes - The list of component meshes to rotate with the duct.
   * @param {number} rotation - The rotation angle to apply to the components (in degrees).
   */
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

    ductMesh.rotateY(angle); // Rotate the duct itself
  }

  /**
   * createDuct
   * 
   * Creates a duct mesh based on the provided dimensions and material options.
   * This method generates the geometry for the duct and returns a mesh that can be added to the scene.
   * 
   * @param {Object} duct - The duct data containing the dimensions and position for the duct.
   * @param {string} ductKey - The key representing the duct in the AHU resources.
   * @returns {THREE.Object3D} The created duct mesh, positioned and ready to be added to the scene.
   */
  createDuct(duct, ductKey) {
    console.log("createDuct started:", duct, ductKey, sharedData.moduleConfigs);
    const dims = duct.dimensions;
    const wt = sharedData.moduleConfigs.parametricOptions.wallThickness; // wall-thickness

    // Create geometries for the ceiling, back wall, and floor of the duct
    const ceilingGeometry = new THREE.BoxGeometry(dims.x, dims.y + wt, wt);
    const backWallGeometry = new THREE.BoxGeometry(dims.x, wt, dims.z);
    const floorGeometry = new THREE.BoxGeometry(dims.x, dims.y + wt, wt);

    // Position the geometries
    ceilingGeometry.translate(0, 0, dims.z / 2);
    backWallGeometry.translate(0, dims.y / 2, 0);
    floorGeometry.translate(0, 0, -dims.z / 2);

    // Merge all geometries into a single geometry for efficiency
    const mergedGeometry = BufferGeometryUtils.mergeGeometries([
        ceilingGeometry, 
        backWallGeometry, 
        floorGeometry
    ]);

    // Create a material and mesh for the merged geometry
    const ductMaterial = new THREE.MeshStandardMaterial({ color: 0xAEB9C2, side: THREE.DoubleSide });
    const mergedMesh = new THREE.Mesh(mergedGeometry, ductMaterial);

    // Create a wireframe to visualize the edges of the duct
    const edges = new THREE.EdgesGeometry(mergedGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(edges, wireframeMaterial);

    // Add the wireframe to the merged mesh
    wireframe.visible = false;
    mergedMesh.add(wireframe);

    // Add the combined duct mesh to the scene
    const parentObject = new THREE.Object3D();
    parentObject.add(mergedMesh);
    parentObject.position.copy(duct.position);
    parentObject.name = "duct";
    sharedData.sceneHelper.addToScene(parentObject);

    console.log("createDuct parentObject:", parentObject);

    return parentObject;
  }

  /**
   * Extends the functionality of an Object3D instance with custom AHU component behaviors.
   * 
   * @param {Object} ahuComponent - The Object3D instance representing the AHU component.
   */
  extendObject3D(ahuComponent) {
    // Attach the sceneHelper to the ahuComponent to allow it to interact with the scene
    ahuComponent.sceneHelper = sharedData.sceneHelper;

    // Set custom behavior for setting attributes
    ahuComponent.setAttribute = function(value) {
        console.log("setAttribute started:", ahuComponent);

        // Get the component's attributes and the first key (assumed to be the function name)
        const ahuComponentAttributes = ahuComponent.userData.component.attributes;
        const attrKeys = Object.keys(ahuComponentAttributes);
        const methodKey = attrKeys[0];  // Get the first attribute method

        // Call the method on the ahuComponent with the value
        ahuComponent[methodKey](value);
    };

    // Set custom behavior for animation control
    ahuComponent.setAnimation = function(value) {
        this.userData.component.attributes.setAnimation.value = value;
        sharedData.sceneHelper.updateTooltip();  // Update the tooltip with the animation value
    };

    // Set custom behavior for controlling transforms of specific targets
    ahuComponent.setTargetTransforms = function(value) {
        const attribute = this.userData.component.attributes.setTargetTransforms;

        // Ensure the value is within the valid range
        if (value >= attribute.min && value <= attribute.max) {
            attribute.value = value;
            sharedData.sceneHelper.updateTooltip();  // Update the tooltip with the transform value

            // Traverse all children of the component and apply transformations
            this.traverse((child) => {
                if (child.isMesh) {
                    // Apply transformation to specified targets
                    if (attribute.targets.includes(child.name)) {
                        child.rotation[attribute['axis']] = attribute.states[attribute.value];
                    }
                }
            });
        }
    };

    // Set custom behavior for controlling materials based on specific thresholds
    ahuComponent.setTargetMaterials = function(value) {
        const attribute = this.userData.component.attributes.setTargetMaterials;

        // Ensure the value is within the valid range
        if (value >= attribute.min && value <= attribute.max) {
            attribute.value = value;
            sharedData.sceneHelper.updateTooltip();  // Update the tooltip with the material value

            // Traverse all children of the component and apply material changes
            this.traverse((child) => {
                if (child.isMesh) {
                    // Apply material changes based on thresholds
                    if (child.name.includes("child")) {
                        for (const i in attribute.states.thresholds) {
                            if (attribute.value >= attribute.states.thresholds[i]['value']) {
                                if (child.name.includes(attribute.states.thresholds[i].target)) {
                                    child.material.color.setHex(attribute.states.active);  // Set active color
                                }
                            } else {
                                if (child.name.includes(attribute.states.thresholds[i].target)) {
                                    child.material.color.setHex(attribute.states.inactive);  // Set inactive color
                                }
                            }
                        }
                    }
                }
            });
        }
    };

    // Set custom behavior for controlling input values
    ahuComponent.setInput = function(value) {
        const attribute = this.userData.component.attributes.setInput;
        attribute.value = value;  // Set the input value
        sharedData.sceneHelper.updateTooltip();  // Update the tooltip with the input value
    };

    // Set custom behavior for controlling transparency of the component
    ahuComponent.setTransparency = function(value) {
        // Iterate over the children and apply transparency based on the input value
        for (const i in this.children) {
            if (this.children[i].isMesh) {
                this.children[i].material.opacity = 1 - value;  // Adjust opacity based on value
                this.children[i].renderOrder = 1;  // Ensure proper rendering order
            }
        }
    };

    // Cache animation targets to optimize the performance and avoid redundant computations
    sharedData.sceneHelper.cacheAnimationTargets();
  }

}
