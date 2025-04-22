import { sharedData } from "../Ahu3D/globals.js";
import * as THREE from 'three';
import { TubePath } from 'three-tube-path';

export default class Panel {
  constructor(rowNum = 1, labelOrientation = "vertical", ahuObject = {}, wiringData = {}) {       
    // Set defaults for panel parameters
    this.portNum = 24;
    this.rowNum = rowNum || 1;
    this.labelOrientation = labelOrientation || "vertical";      

    this.cableRadiusMax = 18;
    this.cablePaddingMax = 5;

    this.wireRadiusMax = 2.5;
    this.wirePaddingMax = 5;

    if (process.env.NODE_ENV === "development") {
      this.wireRadiusMax = 6;
    }

    this.set3dWiringData(ahuObject, wiringData);
  }

  set3dWiringData(ahuObject, wiringData) {

    this.ahuObject = ahuObject;

    // Store the new wiringData
    this.wiringData = wiringData || { cables: [] };

    // Reset all panel settings to defaults
    this.panelSettings = {
      position: {
        x: 'center',
        z: 'bottom'
      },
      dimensions: {
        x: 2000,
        y: 40,
        z: 500
      },
      padding: {
        x: 0,
        y: 0,
        z: 1000
      },
      wallThickness: 15,
      opacity: 0.5
    }

    this.terminalSettings = {
      dimensions: {
        x: 500,
        y: 40,
        z: 200
      },
      padding: {
        x: 20,
        y: 0,
        z: 160
      },
      opacity: 0.75
    }

    // Clean up existing elements
    this.removeExistingConnections();
    
    // Update rowNum if specified in wiringData
    if (wiringData && wiringData.panelRows) {
      this.rowNum = wiringData.panelRows;
    }

    // Reset internal data structures
    this.labels = [];
    this.terminals = {};
    this.orbs = {};
    this.terminalPanelFrames = [];

    // Re-extract terminal labels from the new wiringData
    this.labels = this.extractLabelsFromWiringData();

    // Find the center duct for positioning
    this.closestCenterDuct = this.findCenterDuct(this.ahuObject['3d']?.ducts?.meshes || {});

    // Calculate the panel position based on the center duct or default position
    this.panelSettings.position = this.calculatePanelPosition("duct"); 

    // Rebuild terminal interface
    this.initTerminals();

    // Add connection orbs on terminals
    this.addOrbs();

    const orbKeys = Object.keys(this.orbs);

    // Calculate orb distance if orbs exist
    if (orbKeys.length >= 2) {
      this.orbDistanceX = Math.abs(this.orbs[orbKeys[0]].position.x - this.orbs[orbKeys[1]].position.x);
    }

    // Rebuild panel trays
    this.initPanelTrays();
    
    // Initialize the panel pipe for cable routing
    this.initPanelPipe();
    
    // Create cables and wires based on the new wiring data
    this.createCablesFromWiringData();
  }

  // Remove existing cables and wires from the scene
  removeExistingConnections() {
    // Find and remove all meshes with names that match our cable/wire pattern
    const objectsToRemove = [];
    
    sharedData.sceneHelper.scene.traverse((object) => {
      if(
        object.name.includes('Cable') || 
        object.name.includes('Wire') ||
        object.name.includes('Panel')
      ) {
        objectsToRemove.push(object);
      }
    });
    
    // Remove all found objects from the scene
    objectsToRemove.forEach(object => {
      sharedData.sceneHelper.removeFromScene(object);
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  // Reset terminals and orbs to their default visual state
  resetTerminalsAndOrbs() {
    // Reset all terminals to default appearance
    for (const terminalId in this.terminals) {
      const terminal = this.terminals[terminalId];
      const materials = terminal.material;
      
      // Reset to default color
      const defaultColor = new THREE.Color(sharedData.primaryColor);
      
      // Update all materials except labels
      for (let i = 0; i < materials.length; i++) {
        if (i !== 2 && i !== 3) { // Don't change the label textures (front and back)
          materials[i].color = defaultColor;
          materials[i].needsUpdate = true;
        }
      }
    }
    
    // Reset all orbs to default appearance
    for (const orbId in this.orbs) {
      // Reset color to default blue
      this.setOrbColor(orbId, 0x3366cc);
      
      // Reset scale to normal
      this.orbs[orbId].scale.set(1.0, 1.0, 1.0);
    }
  }

  // New method to extract terminal labels from wiringData
  extractLabelsFromWiringData() {
    const uniqueTerminalIds = new Set();
    
    // Extract unique panel wiring IDs from each cable's wires
    if (this.wiringData && this.wiringData.cables) {
      this.wiringData.cables.forEach(cable => {
        if (cable.wires && Array.isArray(cable.wires)) {
          cable.wires.forEach(wire => {
            // Only add if panelWiringId exists
            if (wire.panelWiringId) {
              uniqueTerminalIds.add(wire.panelWiringId);
            }
          });
        }
      });
    }
    
    // Convert the Set to an array and sort to ensure consistent ordering
    const uniqueLabels = Array.from(uniqueTerminalIds);
    console.log("Unique terminal IDs from wiringData:", uniqueLabels);
    
    this.portNum = uniqueLabels.length + (uniqueLabels.length % this.rowNum);
    
    // Create the labels array with the appropriate size
    const labels = new Array(this.portNum).fill(null);
    
    // Fill the labels array with the unique labels
    for (let i = 0; i < uniqueLabels.length; i++) {
      labels[i] = uniqueLabels[i];
    }
    
    console.log("Final labels from wiringData:", labels);
    return labels;
  }

  // New method to create cables based on wiring data
  createCablesFromWiringData() {
    if (!this.wiringData || !this.wiringData.cables || !Array.isArray(this.wiringData.cables)) {
      console.warn("No valid wiring data available");
      return;
    }
    
    console.log("Creating cables from wiring data:", this.wiringData);
    
    // Create a map to track which components are connected to which terminals
    const terminalToComponentMap = {};
    
    // Process each cable in the wiring data
    this.wiringData.cables.forEach(cable => {
      // Skip if no wires or invalid cable
      if (!cable.wires || !Array.isArray(cable.wires) || cable.wires.length === 0) {
        return;
      }
      
      // Get component ID from the cable
      const componentId = cable.idTag;
      
      // Check if component exists in the ahuObject
      if (!componentId) {
        console.warn(`Component ID missing for cable ${cable.id}`);
        return;
      }
      
      // If the component doesn't exist in the scene, we'll handle this gracefully
      const componentExists = this.ahuObject && 
                             this.ahuObject['3d'] && 
                             this.ahuObject['3d'].components && 
                             this.ahuObject['3d'].components.meshes && 
                             this.ahuObject['3d'].components.meshes[componentId];
      
      if (!componentExists) {
        console.warn(`Component ${componentId} not found in scene for cable ${cable.id}`);
        // Instead of returning, we'll continue and connect to a fallback position later
      }
      
      // Process each wire in the cable
      cable.wires.forEach(wire => {
        const terminalId = wire.panelWiringId;
        
        // Skip if terminal doesn't exist
        if (!terminalId || !this.terminals[terminalId]) {
          console.warn(`Terminal ${terminalId} not found for wire ${wire.id}`);
          return;
        }
        
        // Map this terminal to the component
        terminalToComponentMap[terminalId] = componentId;
        
        // Set orb color to indicate connection
        this.setOrbColor(terminalId, 0x00ff00);
      });
    });
    
    console.log("Terminal to component mapping:", terminalToComponentMap);
    
    // Create cables for mapped terminals
    for (const terminalId in terminalToComponentMap) {
      const componentId = terminalToComponentMap[terminalId];
      this.createCableWithWires(terminalId, componentId);
    }
  }
  
  // Enhanced method to create a cable with its wires based on wiring data
  createCableWithWires(terminalId, componentId) {
    // Find the cable data that connects this terminal to this component
    const cableData = this.findCableData(terminalId, componentId);
    
    if (!cableData) {
      console.warn(`No cable data found for ${terminalId} to ${componentId}`);
      
      // Create a default cable with generic wires (for terminals without specific wire data)
      const cable = this.createSingleCable(terminalId, componentId);
      
      if (cable) {
        // Create default wires with standard colors
        const defaultWireColors = ['Red', 'Yellow'];
        const cablePoints = cable.userData.cablePoints;
        
        if (cablePoints) {
          // Create a couple of default wires
          for (let i = 0; i < 2; i++) {
            // Use the exact same path as the cable
            const wirePoints = cablePoints.map(point => point.clone());
            const curve = new THREE.CatmullRomCurve3(wirePoints);
            
            const tubeGeometry = new TubePath(
              curve, 
              TubePath.pathToUMapping(curve, 5, 2),
              this.wireRadiusMax,
              4,
              false
            );
            
            const tubeMaterial = new THREE.MeshStandardMaterial({
              color: this.getWireColor(defaultWireColors[i])
            });
            
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            tube.name = `${terminalId}-to-${componentId}-Wire-Default-${i}`;
            tube.visible = true;
            
            sharedData.sceneHelper.addToScene(tube);
          }
        }
        
        // Mark the terminal as connected
        this.connectPort(terminalId);
      }
      
      return cable;
    }
    
    // Create the main cable path
    const cable = this.createSingleCable(terminalId, componentId);
    
    if (!cable) {
      return null;
    }
    
    // Create individual wires using the wire data
    this.createWiresFromData(terminalId, componentId, cableData, cable.userData.cablePoints);
    
    // Mark the terminal as connected
    this.connectPort(terminalId);
    
    return cable;
  }
  
  // Helper to find cable data for a specific terminal and component
  findCableData(terminalId, componentId) {
    if (!this.wiringData || !this.wiringData.cables) {
      return null;
    }
    
    // Find the cable that connects to this component
    for (const cable of this.wiringData.cables) {
      if (cable.idTag === componentId) {
        // Check if any of its wires connect to this terminal
        if (cable.wires && Array.isArray(cable.wires)) {
          for (const wire of cable.wires) {
            if (wire.panelWiringId === terminalId) {
              return cable;
            }
          }
        }
      }
    }
    
    // If we didn't find an exact match, just find any cable with this terminal
    for (const cable of this.wiringData.cables) {
      if (cable.wires && Array.isArray(cable.wires)) {
        for (const wire of cable.wires) {
          if (wire.panelWiringId === terminalId) {
            return cable;
          }
        }
      }
    }
    
    return null;
  }
  
  // Create wires using the wiring data instead of random generation
  createWiresFromData(terminalId, componentId, cableData, cablePoints) {
    if (!cablePoints || cablePoints.length === 0) {
      console.warn(`No path found for cable ${terminalId} to ${componentId}`);
      return [];
    }
    
    const wires = [];
    
    // Create a wire for each wire in the cable data
    if (cableData.wires && Array.isArray(cableData.wires)) {
      cableData.wires.forEach((wireData) => {
        // Skip if this wire doesn't match the current terminal
        if (wireData.panelWiringId !== terminalId) {
          return;
        }
        
        // Get the wire color from the data
        const wireColor = wireData.color || 'Red';
        
        // Create unique orb ID for this wire
        const wireOrbId = `${terminalId}-${wireData.id}`;
        
        // Get the orb for this specific wire or fall back to terminal orb
        const wireOrb = this.orbs[wireOrbId] || this.orbs[terminalId];
        
        if (!wireOrb) {
          console.warn(`No orb found for wire ${wireData.id} at terminal ${terminalId}`);
          return;
        }
        
        // Create wire path from orb to component
        const wirePath = this.createWirePath(wireOrb, componentId);
        
        if (!wirePath || wirePath.length === 0) {
          return;
        }
        
        // Create curve and geometry for this specific wire
        const curve = new THREE.CatmullRomCurve3(wirePath);
        
        const tubeGeometry = new TubePath(
          curve, 
          TubePath.pathToUMapping(curve, 5, 2),
          this.wireRadiusMax,
          8,
          false
        );
        
        // Create material with wire color
        const tubeMaterial = new THREE.MeshStandardMaterial({
          color: this.getWireColor(wireColor)
        });
        
        // Create mesh
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        // Name the wire
        tube.name = `${terminalId}-to-${componentId}-Wire-${wireData.id}`;
        
        // Make wire visible
        tube.visible = true;
        
        // Add to scene and store reference
        sharedData.sceneHelper.addToScene(tube);
        wires.push(tube);
        
        // Mark the orb as connected
        this.setOrbColor(wireOrbId, this.getWireColor(wireColor));
        wireOrb.scale.set(1.2, 1.2, 1.2);
      });
    }
    
    return wires;
  }
  
  // Remove the redundant getCablePath method since we're storing path data with the cable

  addOrbs() {
    // Store references to orbs
    this.orbs = {};
    
    // Loop through all terminals
    for (const terminalId in this.terminals) {
      const terminal = this.terminals[terminalId];
      if (!terminal || terminalId == "") continue;
      
      // Get all wires connected to this terminal
      const connectedWires = this.getWiresForTerminal(terminalId);
      
      // If no wires or a single wire, create just one orb
      if (connectedWires.length <= 1) {
        this.createOrb(terminal, terminalId);
      } 
      // If multiple wires, create an orb for each wire
      else {
        connectedWires.forEach((wire, index) => {
          const wireOrbId = `${terminalId}-${wire.id}`;
          this.createOrb(terminal, wireOrbId, index, connectedWires.length);
        });
      }
    }
  }

  // New helper method to create an orb
  createOrb(terminal, orbId, index = 0, totalOrbs = 1) {
    const radius = 50;
    
    // Create orb geometry (small sphere)
    const orbGeometry = new THREE.SphereGeometry(radius, 16, 16);
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,  // Default white color
      emissive: 0x003366, // Slight glow
      metalness: 0.3,
      roughness: 0.2
    });
    
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    
    // Position at terminal
    orb.position.copy(terminal.position);
    
    // Calculate the height of the terminal
    let terminalHeight;
    if (this.labelOrientation === "vertical") {
      terminalHeight = this.terminalSettings.dimensions.x;
    } else {
      terminalHeight = this.terminalSettings.dimensions.z;
    }
    
    // If multiple orbs, distribute them horizontally
    let horizontalOffset = 0;
    if (totalOrbs > 1) {
      // Distribute orbs horizontally
      const orbSpacing = 120; // Space between orbs
      horizontalOffset = (index - (totalOrbs - 1) / 2) * orbSpacing;
    }
    
    // Position orb above the terminal with some offset and horizontal spacing
    orb.position.z += terminalHeight / 2 + (radius + 60);
    orb.position.x += horizontalOffset;
    
    orb.name = `Panel-Port-${orbId}`;
    
    // Add to scene
    sharedData.sceneHelper.addToScene(orb);
    
    // Store reference
    this.orbs[orbId] = orb;
    
    return orb;
  }

  // New helper method to get all wires for a terminal
  getWiresForTerminal(terminalId) {
    const wires = [];
    
    if (!this.wiringData || !this.wiringData.cables) {
      return wires;
    }
    
    // Search all cables for wires connected to this terminal
    for (const cable of this.wiringData.cables) {
      if (cable.wires && Array.isArray(cable.wires)) {
        for (const wire of cable.wires) {
          if (wire.panelWiringId === terminalId) {
            wires.push(wire);
          }
        }
      }
    }
    
    return wires;
  }

  // New helper method to create a path for a specific wire
  createWirePath(orb, componentId) {
    if (!orb) {
      return null;
    }
    
    // Check if component exists in the scene
    let component = null;
    let ductId = null;
    let ductHalfDepth = 0;
    let targetPosition = null;
    
    // If we have a valid component, use its position
    if (this.ahuObject && 
        this.ahuObject['3d'] && 
        this.ahuObject['3d'].components && 
        this.ahuObject['3d'].components.meshes && 
        this.ahuObject['3d'].components.meshes[componentId]) {
      
      component = this.ahuObject['3d'].components.meshes[componentId];
      targetPosition = component.position.clone();
      
      if (this.ahuObject.associations && 
          this.ahuObject.associations.components && 
          this.ahuObject.associations.components[componentId]) {
        
        ductId = this.ahuObject.associations.components[componentId];
        
        if (this.ahuObject.resources && 
            this.ahuObject.resources.ducts && 
            this.ahuObject.resources.ducts[ductId]) {
          
          ductHalfDepth = this.ahuObject.resources.ducts[ductId].dimensions.y / 2;
        }
      }
    } 
    // If component doesn't exist, create a fallback position
    else {
      console.warn(`Component ${componentId} not found, using fallback position`);
      
      // Use the center duct position if available, or create a reasonable default
      if (this.closestCenterDuct && this.closestCenterDuct.mesh) {
        targetPosition = this.closestCenterDuct.mesh.position.clone();
        
        // Offset by a random factor to avoid cables overlapping
        const randomOffsetX = (Math.random() - 0.5) * 500;
        const randomOffsetZ = (Math.random() - 0.5) * 300;
        
        targetPosition.x += randomOffsetX;
        targetPosition.z += randomOffsetZ;
        
        ductHalfDepth = 100; // Default height
      } else {
        // Completely fallback position if no reference points
        targetPosition = new THREE.Vector3(0, 500, 0);
        ductHalfDepth = 0;
      }
    }
    
    const orbToCenterDistanceX = Math.abs(this.panelSettings.position.x - orb.position.x) / 10;
    const orbToCenterDistanceZ = Math.abs(this.panelSettings.position.z - orb.position.z);
    
    const travelDepth = 750 + orbToCenterDistanceZ;
    
    const points = [];
    
    // Starting point (orb position)
    points.push(
      new THREE.Vector3(
        orb.position.x,
        orb.position.y,
        orb.position.z,
      )
    );
    
    // Rise up from the orb
    points.push(
      new THREE.Vector3(
        orb.position.x,
        orb.position.y + travelDepth,
        orb.position.z,
      )
    );

    points.push(
      new THREE.Vector3(
        orb.position.x,
        orb.position.y + travelDepth,
        orb.position.z + 500
      )
    );

    const convergenceFactor = 6;

    // The point where the points should approach each other very closely on the x-axis.
    points.push(
      new THREE.Vector3(
        orb.position.x / convergenceFactor,
        orb.position.y + travelDepth,
        orb.position.z + 500 + this.cableRadiusMax + (orbToCenterDistanceX)
      )
    );

    const zStep = Math.abs(0 - targetPosition.x) / 20;
    
    // Travel horizontally to be above target position
    points.push(
      new THREE.Vector3(
        orb.position.x / convergenceFactor,
        orb.position.y + travelDepth,
        targetPosition.z + zStep - ductHalfDepth/2
      )
    );        

    points.push(
      new THREE.Vector3(
        targetPosition.x,
        orb.position.y + travelDepth,
        targetPosition.z + zStep - ductHalfDepth/2 + this.cableRadiusMax*2
      )
    );
    
    // Move down to target position
    points.push(
      new THREE.Vector3(
        targetPosition.x,
        0 + ductHalfDepth,
        targetPosition.z + zStep - ductHalfDepth/2 + this.cableRadiusMax*2
      )
    );
    
    return points;
  }

  // Modify the createCableWithWires method to use individual wire paths
  createCableWithWires(terminalId, componentId) {
    // Find the cable data that connects this terminal to this component
    const cableData = this.findCableData(terminalId, componentId);
    
    if (!cableData || !cableData.wires || !Array.isArray(cableData.wires)) {
      console.warn(`No valid cable data found for ${terminalId} to ${componentId}`);
      return null;
    }
    
    // Now create individual wires for this cable
    const wires = [];
    
    // For each wire in the cable data
    cableData.wires.forEach(wireData => {
      // Skip if this wire doesn't match the current terminal
      if (wireData.panelWiringId !== terminalId) {
        return;
      }
      
      // Create unique orb ID for this wire
      const wireOrbId = `${terminalId}-${wireData.id}`;
      
      // Get the orb for this specific wire or fall back to terminal orb
      const wireOrb = this.orbs[wireOrbId] || this.orbs[terminalId];
      
      if (!wireOrb) {
        console.warn(`No orb found for wire ${wireData.id} at terminal ${terminalId}`);
        return;
      }
      
      // Create wire path and mesh
      const wirePath = this.createWirePath(wireOrb, componentId);
      
      if (!wirePath || wirePath.length === 0) {
        return;
      }
      
      // Create curve and geometry
      const curve = new THREE.CatmullRomCurve3(wirePath);
      
      const tubeGeometry = new TubePath(
        curve, 
        TubePath.pathToUMapping(curve, 5, 2),
        this.wireRadiusMax,
        8,
        false
      );
      
      // Get color from wire data
      const wireColor = wireData.color || 'Red';
      
      const tubeMaterial = new THREE.MeshStandardMaterial({
        color: this.getWireColor(wireColor)
      });
      
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.name = `${terminalId}-to-${componentId}-Wire-${wireData.id}`;
      tube.visible = true;
      
      // Add to scene
      sharedData.sceneHelper.addToScene(tube);
      wires.push(tube);
      
      // Mark the orb as connected with the wire's color
      this.setOrbColor(wireOrbId, this.getWireColor(wireColor));
      wireOrb.scale.set(1.2, 1.2, 1.2);
    });
    
    return wires.length > 0 ? { wires } : null;
  }

  setOrbColor(terminalId, color) {
    const orb = this.orbs[terminalId];
    if (orb) {
      orb.material.color.set(color);
      orb.material.needsUpdate = true;
    }
  }

  toggleOrbVisibility(terminalId, visible) {
    const orb = this.orbs[terminalId];
    if (orb) {
      orb.visible = visible;
    }
  }

  createLabel(label) {
    // Create front and back textures with text
    const frontCanvas = document.createElement('canvas');
    const frontContext = frontCanvas.getContext('2d');
    frontCanvas.width = 512;
    frontCanvas.height = 256;

    // Fill background for front
    frontContext.fillStyle = 'white';
    frontContext.fillRect(0, 0, frontCanvas.width, frontCanvas.height);

    // Setup front text rendering
    frontContext.imageSmoothingEnabled = true;
    frontContext.imageSmoothingQuality = 'high';
    frontContext.font = 'bold 140px Arial, Helvetica, sans-serif';
    frontContext.textAlign = 'center';
    frontContext.textBaseline = 'middle';
    frontContext.fillStyle = 'black';
    frontContext.fillText(label, frontCanvas.width / 2, frontCanvas.height / 2);

    // Create front texture
    const frontTexture = new THREE.CanvasTexture(frontCanvas);
    frontTexture.generateMipmaps = true;
    frontTexture.minFilter = THREE.LinearMipMapLinearFilter;
    frontTexture.magFilter = THREE.LinearFilter;
    frontTexture.anisotropy = sharedData.sceneHelper.renderer.capabilities.getMaxAnisotropy();

    // Create a properly oriented back texture
    const backCanvas = document.createElement('canvas');
    const backContext = backCanvas.getContext('2d');
    backCanvas.width = 512;
    backCanvas.height = 256;

    // Fill background for back
    backContext.fillStyle = 'white';
    backContext.fillRect(0, 0, backCanvas.width, backCanvas.height);

    // Setup back text rendering - apply rotation transformation
    backContext.imageSmoothingEnabled = true;
    backContext.imageSmoothingQuality = 'high';
    backContext.font = 'bold 140px Arial, Helvetica, sans-serif';
    backContext.textAlign = 'center';
    backContext.textBaseline = 'middle';
    backContext.fillStyle = 'black';
    backContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
    backContext.shadowBlur = 4;
    backContext.shadowOffsetX = 2;
    backContext.shadowOffsetY = 2;

    // Apply 180-degree rotation for the back side text
    backContext.translate(backCanvas.width / 2, backCanvas.height / 2);
    backContext.rotate(Math.PI);
    backContext.fillText(label, 0, 0);
    backContext.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation
    backContext.shadowColor = 'transparent';

    // Create back texture
    const backTexture = new THREE.CanvasTexture(backCanvas);
    backTexture.generateMipmaps = true;
    backTexture.minFilter = THREE.LinearMipMapLinearFilter;
    backTexture.magFilter = THREE.LinearFilter;
    backTexture.anisotropy = sharedData.sceneHelper.renderer.capabilities.getMaxAnisotropy();

    // Create materials array for BoxGeometry with different textures for front and back
    return [
      new THREE.MeshStandardMaterial({ color: sharedData.primaryColor }), // right
      new THREE.MeshStandardMaterial({ color: sharedData.primaryColor }), // left
      new THREE.MeshStandardMaterial({ map: backTexture }), // top (front face)
      new THREE.MeshStandardMaterial({ map: frontTexture }), // bottom (back face)
      new THREE.MeshStandardMaterial({ color: sharedData.primaryColor }), // front
      new THREE.MeshStandardMaterial({ color: sharedData.primaryColor })  // back
    ];
  }

  initTerminals() {
    const dimensions = this.terminalSettings.dimensions;
    const padding = this.terminalSettings.padding;
  
    // Calculate ports per row (evenly distribute ports across rows)
    const portsPerRow = Math.ceil(this.portNum / this.rowNum);
    
    // Calculate the maximum width span needed for any row
    if(this.labelOrientation === "vertical") {
      this.terminalWidthSpan = padding.x + (dimensions.z + padding.x) * portsPerRow;
    } else {
      this.terminalWidthSpan = padding.x + (dimensions.x + padding.x) * portsPerRow;
    }
    
    this.terminalMeshes = [];
  
    for(let rowIndex = 0; rowIndex < this.rowNum; rowIndex++) {
      // Calculate the number of ports in this specific row
      const portsInThisRow = Math.min(
        portsPerRow, 
        this.portNum - (rowIndex * portsPerRow)
      );
      
      // Skip if there are no ports left for this row
      if (portsInThisRow <= 0) break;
      
      for(let colIndex = 0; colIndex < portsInThisRow; colIndex++) {
        // Calculate the absolute index of this terminal
        const terminalIndex = rowIndex * portsPerRow + colIndex;
        
        // Skip if we've already placed all ports
        if (terminalIndex >= this.portNum) break;
        
        const label = this.labels[terminalIndex] || "";

        const boxLabel = this.createLabel(label);
    
        // Create terminal with the materials
        const terminalGeometry = new THREE.BoxGeometry(
          dimensions.x, 
          dimensions.y, 
          dimensions.z
        );
        
        const terminalMesh = new THREE.Mesh(terminalGeometry, boxLabel);
        terminalMesh.position.copy(this.panelSettings.position);
        
        if(this.labelOrientation === "vertical") {
          terminalMesh.rotation.y = Math.PI/2;
          
          // Position in the X axis (columns)
          terminalMesh.position.x += (dimensions.z + padding.x) * colIndex;
          terminalMesh.position.x += -this.terminalWidthSpan / 2 + (dimensions.z/2 + padding.x);
          
          // Position in the Z axis (rows) - with additional padding between rows
          // MODIFIED: Use negative values to position new rows below the previous ones
          const rowHeightWithPadding = dimensions.x + padding.z * 2;
          terminalMesh.position.z -= rowHeightWithPadding * rowIndex; // Changed += to -=
        } else {
          // Position in the X axis (columns)
          terminalMesh.position.x += (dimensions.x + padding.x) * colIndex;
          terminalMesh.position.x += -this.terminalWidthSpan / 2 + (dimensions.x/2 + padding.x);
          
          // Position in the Z axis (rows) - with additional padding between rows
          // MODIFIED: Use negative values to position new rows below the previous ones
          const rowHeightWithPadding = dimensions.z + padding.z * 2;
          terminalMesh.position.z -= rowHeightWithPadding * rowIndex; // Changed += to -=
        }
  
        terminalMesh.name = `Panel-Terminal-${label}`;
        
        sharedData.sceneHelper.addToScene(terminalMesh);  
        this.terminals[label] = terminalMesh;
      }
    }
  }

  findCenterDuct(meshDictionary) {
    // If dictionary is empty, return null
    if (Object.keys(meshDictionary).length === 0) {
      return null;
    }
  
    // First, calculate the average (center) position of all meshes
    let totalX = 0;
    let totalZ = 0;
    let count = 0;
  
    for (const key in meshDictionary) {
      const mesh = meshDictionary[key];
      totalX += mesh.position.x;
      totalZ += mesh.position.z;
      count++;
    }
  
    const centerX = totalX / count;
    const centerZ = totalZ / count;
  
    // Find the mesh closest to this center position
    let closestMesh = null;
    let closestDistance = Infinity;
  
    for (const key in meshDictionary) {
      const mesh = meshDictionary[key];
      const distance = Math.sqrt(
        Math.pow(mesh.position.x - centerX, 2) + 
        Math.pow(mesh.position.z - centerZ, 2)
      );
  
      if (distance < closestDistance) {
        closestDistance = distance;
        closestMesh = {
          key: key,
          mesh: mesh,
          distance: distance
        };
      }
    }
  
    return closestMesh;
  }

  calculatePanelPosition(alignmentMode = "duct") {   
    const boundingBox = sharedData.ahuBoundingBox;

    const position = { x: 0, y: 0, z: 0 };
    const halfPanelHeight = this.panelSettings.dimensions.z / 2;
    
    if (alignmentMode.toLowerCase() === "duct" && this.closestCenterDuct !== null) {
      position.x = this.closestCenterDuct.mesh.position.x;
    }
    else {
      position.x = boundingBox.center.x;
    }    
    position.y = boundingBox.center.y;
    position.z = boundingBox.min.z - halfPanelHeight - this.panelSettings.padding.z;

    return position;
  }

  initPanelTrays() {
    // Calculate ports per row (evenly distribute ports across rows)
    const portsPerRow = Math.ceil(this.portNum / this.rowNum);
    
    // Material for the frame
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: sharedData.primaryColor,
      transparent: true,
      opacity: this.panelSettings.opacity
    });
    
    // Store reference to the frames for later use if needed
    this.terminalPanelFrames = [];
    
    // Create a tray for each row
    for(let rowIndex = 0; rowIndex < this.rowNum; rowIndex++) {
      // Calculate the number of ports in this specific row
      const portsInThisRow = Math.min(
        portsPerRow, 
        this.portNum - (rowIndex * portsPerRow)
      );
      
      // Skip if there are no ports left for this row
      if (portsInThisRow <= 0) break;
      
      // Calculate the width for this specific row's tray
      let rowWidth;
      if(this.labelOrientation === "vertical") {
        rowWidth = this.terminalSettings.padding.x + 
                  (this.terminalSettings.dimensions.z + this.terminalSettings.padding.x) * portsInThisRow;
      } else {
        rowWidth = this.terminalSettings.padding.x + 
                  (this.terminalSettings.dimensions.x + this.terminalSettings.padding.x) * portsInThisRow;
      }
      
      // Create a group to hold all frame parts for this row
      const frameGroup = new THREE.Group();
      frameGroup.position.copy(this.panelSettings.position);
      
      // Dimensions for the frame parts
      const width = rowWidth;
      const depth = this.panelSettings.dimensions.y;
      
      const wallThickness = this.panelSettings.wallThickness;
  
      // Set height to match the labels based on orientation
      const height = this.labelOrientation === "vertical" 
                    ? this.terminalSettings.dimensions.x + (wallThickness / 2)  // Use X dimension if vertical
                    : this.terminalSettings.dimensions.z + (wallThickness / 2); // Use Z dimension if horizontal
      
      // Adjust Z position for this row with additional padding between rows
      // MODIFIED: Use negative values to position new rows below the previous ones
      if(this.labelOrientation === "vertical") {
        // Calculate the row height plus padding
        const rowHeightWithPadding = this.terminalSettings.dimensions.x + this.terminalSettings.padding.z * 2;
        frameGroup.position.z -= rowHeightWithPadding * rowIndex; // Changed += to -=
      } else {
        // Calculate the row height plus padding
        const rowHeightWithPadding = this.terminalSettings.dimensions.z + this.terminalSettings.padding.z * 2;
        frameGroup.position.z -= rowHeightWithPadding * rowIndex; // Changed += to -=
      }
      
      // Create ceiling (top face)
      const ceilingGeometry = new THREE.BoxGeometry(
        width + wallThickness*2, 
        depth, 
        wallThickness
      );
      const ceiling = new THREE.Mesh(
        ceilingGeometry, 
        frameMaterial.clone()
      );
      ceiling.position.z += height/2 + wallThickness/2;
      
      // Create floor (bottom face)
      const floorGeometry = new THREE.BoxGeometry(
        width + wallThickness*2, 
        depth, 
        wallThickness
      );
      const floor = new THREE.Mesh(
        floorGeometry, 
        frameMaterial.clone()
      );
      floor.position.z += -height/2 - wallThickness/2;
      
      // Create left wall
      const leftWallGeometry = new THREE.BoxGeometry(
        wallThickness, 
        depth, 
        height
      );
      const leftWall = new THREE.Mesh(leftWallGeometry, frameMaterial.clone());
      leftWall.position.x -= width/2 + wallThickness/2;
      
      // Create right wall
      const rightWallGeometry = new THREE.BoxGeometry(
        wallThickness, 
        depth, 
        height
      );
      const rightWall = new THREE.Mesh(rightWallGeometry, frameMaterial.clone());
      rightWall.position.x += width/2 + wallThickness/2;
      
      // Create back wall
      const backWallGeometry = new THREE.BoxGeometry(
        width, 
        1, 
        height
      );
      const backWallMesh = new THREE.Mesh(
        backWallGeometry, 
        frameMaterial.clone()
      );
      
      // Add all parts to the group
      frameGroup.add(ceiling);
      frameGroup.add(floor);
      frameGroup.add(leftWall);
      frameGroup.add(rightWall);
      frameGroup.add(backWallMesh);
      
      frameGroup.name = `Panel-Tray-Row-${rowIndex}`;
      
      // Add the complete frame to the scene
      sharedData.sceneHelper.addToScene(frameGroup);
      
      // Store reference to the frame
      this.terminalPanelFrames.push(frameGroup);
    }
  }

  initPanelPipe() {
    console.log("initPanelPipe started:", this.ahuObject);
    const panel = {
      position: this.panelSettings.position
    };    

    const centerMeshBackwallYPos = this.closestCenterDuct.mesh.position.y + this.ahuObject.resources.ducts[this.closestCenterDuct.key].dimensions.y / 2;

    const travelDepth = 1000;

    const points = [
      new THREE.Vector3(
        panel.position.x,
        panel.position.y,
        panel.position.z,
      ),
      new THREE.Vector3(
        panel.position.x,
        panel.position.y + travelDepth,
        panel.position.z,
      ),
      new THREE.Vector3(
        panel.position.x,
        panel.position.y + travelDepth,
        this.closestCenterDuct.mesh.position.z
      ),
      new THREE.Vector3(
        this.closestCenterDuct.mesh.position.x,
        centerMeshBackwallYPos,
        this.closestCenterDuct.mesh.position.z
      ),
    ];

    const curve = new THREE.CatmullRomCurve3(points);

    const tubeGeometry = new TubePath(
      curve, 
      TubePath.pathToUMapping(curve, 5, 2), 
      this.cableRadiusMax * 2, 
      8, 
      false
    );

    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.5
    });

    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.name = `Panel-Pipe`;

    tube.visible = false;

    sharedData.sceneHelper.addToScene(tube);
  }  

  getWireColor(colorName) {
    const colorMap = {
      'Red':    0xE57373,
      'Green':  0x81C784,
      'Blue':   0x4FC3F7,
      'Yellow': 0xFFEB3B,
      'Orange': 0xFFA726,
      'Purple': 0xCE93D8,
      'Black':  0x000000,
      'White':  0xffffff,
      'Grey':   0x808080,
      'Brown':  0xBCAAA4
    };
    
    return colorMap[colorName] || 0xcccccc; // Default to gray if color not found
  }

  // Create a cable and return its path points
  createSingleCable(terminalId, componentId) {
    const terminal = this.terminals[terminalId];
    const orb = this.orbs[terminalId];
    
    if (!terminal || !orb) {
      console.warn(`Missing terminal or orb for cable: ${terminalId}`);
      return null;
    }
    
    // Check if component exists in the scene
    let component = null;
    let ductId = null;
    let ductHalfDepth = 0;
    let targetPosition = null;
    
    // If we have a valid component, use its position
    if (this.ahuObject && 
        this.ahuObject['3d'] && 
        this.ahuObject['3d'].components && 
        this.ahuObject['3d'].components.meshes && 
        this.ahuObject['3d'].components.meshes[componentId]) {
      
      component = this.ahuObject['3d'].components.meshes[componentId];
      targetPosition = component.position.clone();
      
      if (this.ahuObject.associations && 
          this.ahuObject.associations.components && 
          this.ahuObject.associations.components[componentId]) {
        
        ductId = this.ahuObject.associations.components[componentId];
        
        if (this.ahuObject.resources && 
            this.ahuObject.resources.ducts && 
            this.ahuObject.resources.ducts[ductId]) {
          
          ductHalfDepth = this.ahuObject.resources.ducts[ductId].dimensions.y / 2;
        }
      }
    } 
    // If component doesn't exist, create a fallback position
    else {
      console.warn(`Component ${componentId} not found, using fallback position`);
      
      // Use the center duct position if available, or create a reasonable default
      if (this.closestCenterDuct && this.closestCenterDuct.mesh) {
        targetPosition = this.closestCenterDuct.mesh.position.clone();
        
        // Offset by a random factor to avoid cables overlapping
        const randomOffsetX = (Math.random() - 0.5) * 500;
        const randomOffsetZ = (Math.random() - 0.5) * 300;
        
        targetPosition.x += randomOffsetX;
        targetPosition.z += randomOffsetZ;
        
        ductHalfDepth = 100; // Default height
      } else {
        // Completely fallback position if no reference points
        targetPosition = new THREE.Vector3(0, 500, 0);
        ductHalfDepth = 0;
      }
    }
    
    const orbToCenterDistanceX = Math.abs(this.panelSettings.position.x - orb.position.x) / 10;
    const orbToCenterDistanceZ = Math.abs(this.panelSettings.position.z - orb.position.z);
    
    const travelDepth = 750 + orbToCenterDistanceZ;
    
    const points = [];
    
    // Starting point (orb position instead of terminal)
    points.push(
      new THREE.Vector3(
        orb.position.x,
        orb.position.y,
        orb.position.z,
      )
    );
    
    // Rise up from the orb
    points.push(
      new THREE.Vector3(
        orb.position.x,
        orb.position.y + travelDepth,
        orb.position.z,
      )
    );

    points.push(
      new THREE.Vector3(
        orb.position.x,
        orb.position.y + travelDepth,
        orb.position.z + 500
      )
    );

    const convergenceFactor = 6;

    // The point where the points should approach each other very closely on the x-axis.
    points.push(
      new THREE.Vector3(
        orb.position.x / convergenceFactor,
        orb.position.y + travelDepth,
        orb.position.z + 500 + this.cableRadiusMax + (orbToCenterDistanceX)
      )
    );

    const zStep = Math.abs(0 - targetPosition.x) / 20;
    
    // Travel horizontally to be above target position
    points.push(
      new THREE.Vector3(
        orb.position.x / convergenceFactor,
        orb.position.y + travelDepth,
        targetPosition.z + zStep - ductHalfDepth/2
      )
    );        

    points.push(
      new THREE.Vector3(
        targetPosition.x,
        orb.position.y + travelDepth,
        targetPosition.z + zStep - ductHalfDepth/2 + this.cableRadiusMax*2
      )
    );
    
    // Move down to target position
    points.push(
      new THREE.Vector3(
        targetPosition.x,
        0 + ductHalfDepth,
        targetPosition.z + zStep - ductHalfDepth/2 + this.cableRadiusMax*2
      )
    );
    
    // Create the cable
    const curve = new THREE.CatmullRomCurve3(points);
    
    const tubeGeometry = new TubePath(
      curve, 
      TubePath.pathToUMapping(curve, 5, 2), 
      this.cableRadiusMax, 
      8, 
      false
    );
    
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.5
    });
    
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.name = `${terminalId}-to-${componentId}-Cable`;
    
    // Make cable visible
    tube.visible = true;
    
    // sharedData.sceneHelper.addToScene(tube);
    
    // Store the points with the cable for wire creation
    tube.userData = {
      cablePoints: points
    };
    
    return tube;
  }

  // Enhanced version of connectPort to visually indicate connection
  connectPort(terminalId) {
    // Find the terminal mesh by its ID
    const terminal = this.terminals[terminalId];
    const orb = this.orbs[terminalId];
    
    if (!terminal) {
      console.warn(`Terminal with ID ${terminalId} not found`);
      return;
    }
    
    if (!orb) {
      console.warn(`Orb with ID ${terminalId} not found`);
      return;
    }
    
    // Change terminal color to indicate connection
    const materials = terminal.material;
    const connectedColor = new THREE.Color('#cccccc');
    
    // Update all materials directly
    for (let i = 0; i < materials.length; i++) {
      if (i !== 2 && i !== 3) { // Don't change the label textures (front and back)
        materials[i].color = connectedColor;
        materials[i].needsUpdate = true;
      }
    }
    
    // Make orb green and larger to indicate it's an active connection point
    this.setOrbColor(terminalId, 0x00ff00);
    
    // Scale the orb slightly to make it more prominent
    orb.scale.set(1.2, 1.2, 1.2);
    
    return terminal;
  }
}