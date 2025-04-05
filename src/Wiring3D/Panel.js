import { sharedData } from "../Ahu3D/globals.js";
import * as THREE from 'three';
import { TubePath } from 'three-tube-path';

export default class Panel {
  constructor(portNum = 0, rowNum = 1, labels = [], labelOrientation = "vertical", ahuObject = {}, wiringData = {}) {   

    portNum = 24;
    rowNum = 2;
    labels = [
      "I1-9A", "I1-9B", "I1-10A", "I1-10B", "I1-11A", "I1-11B", "I1-12A", "I1-12B", "I1-13A", "I1-13B", "I1-14A", "I1-14B", 
      "I2-9A", "I2-9B", "I2-10A", "I2-10B", "I2-11A", "I2-11B", "I2-12A", "I2-12B", "I2-13A", "I2-13B", null, null
    ];
    labelOrientation = "vertical";

    this.portNum = portNum;
    this.rowNum = rowNum;
    this.labels = labels;
    this.labelOrientation = labelOrientation;
    
    this.ahuObject = ahuObject;

    this.wiringData = wiringData;

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

    this.terminals = {};

    this.closestCenterDuct = this.findCenterDuct(this.ahuObject['3d'].ducts.meshes);

    this.panelSettings.position = this.calculatePanelPosition("duct"); 

    this.initTerminals();

    this.addOrbs();

    this.initPanelTrays();
  }

  addOrbs() {
    // Store references to orbs
    this.orbs = {};
    
    // Loop through all terminals
    for (const terminalId in this.terminals) {
      const terminal = this.terminals[terminalId];
      if (!terminal || terminalId == "") continue;

      const radius = 50;
      
      // Create orb geometry (small sphere)
      const orbGeometry = new THREE.SphereGeometry(radius, 16, 16);
      const orbMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,  // Blue color
        emissive: 0x003366, // Slight glow
        metalness: 0.3,
        roughness: 0.2
      });
      
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      
      // Position at the x-center and above the terminal
      orb.position.copy(terminal.position);
      
      // Calculate the height of the terminal
      let terminalHeight;
      if (this.labelOrientation === "vertical") {
        terminalHeight = this.terminalSettings.dimensions.x;
      } else {
        terminalHeight = this.terminalSettings.dimensions.z;
      }
      
      // Position orb above the terminal with some offset
      orb.position.z += terminalHeight / 2 + (radius + 60);
      
      orb.name = `Panel-Port-${terminalId}`;
      
      // Add to scene
      sharedData.sceneHelper.addToScene(orb);
      
      // Store reference
      this.orbs[terminalId] = orb;
    }
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
    }    

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
      128, 
      8, 
      false
    );

    // const tubeGeometry = new THREE.TubeGeometry(
    //   curve,       // The curve to follow
    //   128,          // Number of segments (higher = smoother)
    //   64,           // Radius of the tube
    //   8,           // Number of sides (higher = more circular)
    //   false        // Closed or not (true = connect ends)
    // );

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
      'Red': 0xff0000,
      'Green': 0x00ff00,
      'Blue': 0x0000ff,
      'Yellow': 0xffff00,
      'Orange': 0xffa500,
      'Purple': 0x800080,
      'Black': 0x000000,
      'White': 0xffffff,
      'Grey': 0x808080,
      'Brown': 0x8b4513
    };
    
    return colorMap[colorName] || 0xcccccc; // Default to gray if color not found
  }

  // Modified createCables method to map each label to a unique component
  createCables() {
    console.log("createCables started:", this.ahuObject);

    // Get all available component IDs
    const componentIDs = Object.keys(this.ahuObject['3d'].components.meshes);
    
    // Get all terminal labels that are not null
    const validLabels = this.labels.filter(label => label !== null);
    
    // Create a mapping between labels and components
    // This ensures each label connects to a unique component
    const labelToComponentMap = {};
    
    // If we have wiringData already defined with proper mapping, use it
    if (this.wiringData && this.wiringData.cables) {
      for (const cable of this.wiringData.cables) {
        if (validLabels.includes(cable.idTag) && componentIDs.includes(cable.componentId)) {
          labelToComponentMap[cable.idTag] = cable.componentId;
        }
      }
    }
    
    // For any labels that don't have a mapping yet, create one
    let unusedComponentIndex = 0;
    for (const label of validLabels) {
      if (!labelToComponentMap[label]) {
        // Find a component that hasn't been used yet
        while (unusedComponentIndex < componentIDs.length) {
          const componentId = componentIDs[unusedComponentIndex];
          
          // Check if this component is already mapped to another label
          if (!Object.values(labelToComponentMap).includes(componentId)) {
            labelToComponentMap[label] = componentId;
            unusedComponentIndex++;
            break;
          }
          unusedComponentIndex++;
        }
      }
    }
    
    // Now create a cable for each mapping
    for (const label in labelToComponentMap) {
      const componentId = labelToComponentMap[label];
      
      // Skip if terminal or component doesn't exist
      if (!this.terminals[label] || !this.ahuObject['3d'].components.meshes[componentId]) {
        console.warn(`Cannot create cable: Terminal ${label} or component ${componentId} not found`);
        continue;
      }
      
      this.createSingleCable(label, componentId);
      
      // Set orb color to indicate connection
      this.setOrbColor(label, 0x00ff00); // Green for connected
    }
    
    console.log("createCables finished with mapping:", labelToComponentMap);
    
    // Return the mapping for reference
    return labelToComponentMap;
  }

  // New method to create a single cable between an orb and component
  createSingleCable(terminalLabel, componentId) {
    const terminal = this.terminals[terminalLabel];
    const orb = this.orbs[terminalLabel];
    const component = this.ahuObject['3d'].components.meshes[componentId];
    
    if (!terminal || !component || !orb) {
      console.warn(`Missing terminal, orb, or component for cable: ${terminalLabel} -> ${componentId}`);
      return null;
    }
    
    const travelDepth = 1000;
    const componentBackYPos = component.position.y + this.ahuObject.resources.components[componentId].dimensions.y / 2;
    
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
    
    // Travel horizontally to be above component
    points.push(
      new THREE.Vector3(
        orb.position.x,
        component.position.y + travelDepth,
        component.position.z
      )
    );
    
    // Adjust horizontal position if needed
    if (Math.abs(orb.position.x - component.position.x) > 1) {
      points.push(
        new THREE.Vector3(
          component.position.x,
          component.position.y + travelDepth,
          component.position.z
        )
      );
    }
    
    // Move down to component
    points.push(
      new THREE.Vector3(
        component.position.x,
        componentBackYPos,
        component.position.z
      )
    );
    
    // Create the cable
    const curve = new THREE.CatmullRomCurve3(points);
    
    const tubeGeometry = new TubePath(
      curve, 
      TubePath.pathToUMapping(curve, 5, 2), 
      64, 
      8, 
      false
    );
    
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.5
    });
    
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.name = `${terminalLabel}-to-${componentId}-Cable`;
    
    // Make cable visible
    tube.visible = true;
    
    sharedData.sceneHelper.addToScene(tube);
    
    // Create individual wires for this cable
    this.createWiresForCable(terminalLabel, componentId, points);
    
    // Mark the terminal as connected
    this.connectPort(terminalLabel);
    
    return tube;
  }

  // New method to create wires for a specific cable
  createWiresForCable(terminalLabel, componentId, points) {
    // Define default wire colors for variety
    const defaultWireColors = ['Red', 'Green', 'Blue', 'Yellow', 'Black', 'White'];
    const numWires = Math.floor(Math.random() * 3) + 2; // Random number of wires (2-4)
    
    const wires = [];
    // Get direction from orb to component, not terminal to component
    const wireDirection = points[0].x < points[points.length - 1].x ? 1 : -1;
    
    for (let i = 0; i < numWires; i++) {
      // Select a color from the default colors
      const wireColor = defaultWireColors[i % defaultWireColors.length];
      
      // Calculate offset
      const offsetFactor = Math.ceil((i+1)/2) * (i % 2 === 0 ? -1 : 1);
      const offset = 45 * offsetFactor; // Smaller offset for tighter bundling
      
      // Create a deep copy of the points array for this wire
      const wirePoints = points.map(point => point.clone());
      
      // Apply offset to each point (except start and end points)
      for (let j = 1; j < wirePoints.length - 1; j++) {
        wirePoints[j].y += offset;
      }
      
      // Create curve and geometry
      const curve = new THREE.CatmullRomCurve3(wirePoints);
      
      const tubeGeometry = new TubePath(
        curve, 
        TubePath.pathToUMapping(curve, 5, 2),
        24, // Smaller radius for individual wires
        8,
        false
      );
      
      // Create material with wire color
      const tubeMaterial = new THREE.MeshStandardMaterial({
        color: this.getWireColor(wireColor),
        metalness: 0.3,
        roughness: 0.5
      });
      
      // Create mesh
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      
      // Name the wire
      tube.name = `${terminalLabel}-to-${componentId}-Wire-${i}`;
      
      // Make wire visible
      tube.visible = true;
      
      // Add to scene and store reference
      sharedData.sceneHelper.addToScene(tube);
      wires.push(tube);
    }
    
    return wires;
  }

  // New method to connect all terminals to unique components
  connectAllTerminalsToComponents() {
    // Clear existing connections first (if needed)
    // Implementation depends on how you track existing connections
    
    // Create new connections for all terminals
    const mapping = this.createCables();
    
    // Return the mapping for reference
    return mapping;
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
    
    // Add a subtle pulsing animation or glow effect if desired
    // This could be implemented in the animation loop elsewhere
    
    return terminal;
  }
}