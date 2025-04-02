import { sharedData } from "../Ahu3D/globals.js";
import * as THREE from 'three';
import { TubePath } from 'three-tube-path';

export default class Wiring3D {
  constructor(ahuObject) {   
    
    this.ahuObject = ahuObject;

    this.wiringData = {
      cables: [
        {
          id: "SCHP2-CS",
          label: "Current Switch Cable",
          equipment: "Switch",
          idTag: "r:novo.graphics::FanHorizontal-0",
          pointName: "Damper-1 Curr. Switch",
          markers: "SCHP2-CS",
          wires: [
            {
              id: "SCHP2-CS-Wire-1",
              fieldWiring: "Purple",
              panelWiringId: "I1-10B",
              color: "Purple",
              size: "18-2"
            },
            {
              id: "SCHP2-CS-Wire-2",
              fieldWiring: "Red",
              panelWiringId: "I1-10A",
              color: "Red",
              size: "18-2"
            }
          ]
        },
        {
          id: "SCHP1-CS",
          label: "Current Switch Cable",
          equipment: "Switch",
          idTag: "r:novo.graphics::FanPropeller-1",
          pointName: "Fan-1 Curr. Switch",
          markers: "SCHP1-CS",
          wires: [
            {
              id: "SCHP1-CS-Wire-2",
              fieldWiring: "Orange",
              panelWiringId: "I1-9A",
              color: "Orange",
              size: "18-2"
            }
          ]
        },
        {
          id: "AHU2-TEMP",
          label: "Temperature Sensor",
          equipment: "Thermometer",
          idTag: "r:novo.graphics::Fan-0",
          pointName: "Fan-3 Supply Temp",
          markers: "AHU2-TEMP",
          wires: [
            {
              id: "SCHP1-CS-Wire-1",
              fieldWiring: "Yellow",
              panelWiringId: "I1-9B",
              color: "Blue",
              size: "18-2"
            },
            {
              id: "SCHP1-CS-Wire-2",
              fieldWiring: "Orange",
              panelWiringId: "I1-9A",
              color: "Green",
              size: "18-2"
            },
            {
              id: "SCHP1-CS-Wire-2",
              fieldWiring: "Orange",
              panelWiringId: "I1-9A",
              color: "Brown",
              size: "18-2"
            }
          ]
        },
      ],
    };

    this.panelSettings = {
      position: {
        x: 'center',
        z: 'bottom'
      },
      dimensions: {
        x: 2000,
        y: 100,
        z: 500
      },
      padding: {
        x: 0,
        y: 0,
        z: 1000
      },
      wallThickness: 10,
      opacity: 0.5
    }

    this.terminalSettings = {
      dimensions: {
        x: 500,
        y: 10,
        z: 300
      },
      padding: {
        x: 100,
        y: 0,
        z: 0
      },
      opacity: 0.75
    }

    this.terminals = {};

    this.calculatePanelPosition(
      this.panelSettings
    ); 

    this.initTerminals();

    this.initPanel();

    this.initPanelCable();

    this.createCables();
    
  }

  initPanel() {
    this.panelSettings.dimensions.x = this.terminalWidthSpan;
    
    // Create a group to hold all frame parts
    const frameGroup = new THREE.Group();
    frameGroup.position.copy(this.panelSettings.position);
    
    // Dimensions for the frame parts
    const width = this.panelSettings.dimensions.x;
    const depth = this.panelSettings.dimensions.y;
    const height = this.panelSettings.dimensions.z;

    const wallThickness = this.panelSettings.wallThickness;
    
    // Material for the frame
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: sharedData.primaryColor,
        transparent: true,
        opacity: this.panelSettings.opacity
    });
    
    // Create ceiling (top face)
    const ceilingGeometry = new THREE.BoxGeometry(
      width + wallThickness*2, 
      depth, 
      wallThickness
    );
    const ceiling = new THREE.Mesh(
      ceilingGeometry, 
      new THREE.MeshStandardMaterial({
        color: sharedData.primaryColor,
        transparent: true,
        opacity: this.panelSettings.opacity
      })
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
      new THREE.MeshStandardMaterial({
        color: sharedData.primaryColor,
        transparent: true,
        opacity: this.panelSettings.opacity
      })
    );
    floor.position.z += -height/2 - wallThickness/2;
    
    // Create left wall
    const leftWallGeometry = new THREE.BoxGeometry(
      wallThickness, 
      depth, 
      height
    );
    const leftWall = new THREE.Mesh(leftWallGeometry, frameMaterial);
    leftWall.position.x -= width/2 + wallThickness/2;
    
    // Create right wall
    const rightWallGeometry = new THREE.BoxGeometry(
      wallThickness, 
      depth, 
      height
    );
    const rightWall = new THREE.Mesh(rightWallGeometry, frameMaterial);
    rightWall.position.x += width/2 + wallThickness/2;

    const backWallThickness = 10;

    const backWallGeometry = new THREE.BoxGeometry(
      width, 
      backWallThickness, 
      height
    );
    const backWallMesh = new THREE.Mesh(
      backWallGeometry, 
      new THREE.MeshStandardMaterial({
        color: sharedData.primaryColor,
        transparent: true,
        opacity: this.panelSettings.opacity
      })
    );
    backWallMesh.position.y += depth/2 - backWallThickness/2;
    
    // Add all parts to the group
    frameGroup.add(ceiling);
    frameGroup.add(floor);
    frameGroup.add(leftWall);
    frameGroup.add(rightWall);
    frameGroup.add(backWallMesh);
    
    // Add the complete frame to the scene
    sharedData.sceneHelper.addToScene(frameGroup);
    
    // Store reference to the frame for later use if needed
    this.terminalPanelFrame = frameGroup;

  }

  initPanelCable() {
    console.log("initPanelCable started:", this.ahuObject);
    const panel = {
      position: this.panelSettings.position
    }

    const closestCenterMesh = this.findCenterMesh(this.ahuObject['3d'].ducts.meshes);

    console.log("initPanelCable closestCenterMesh:", closestCenterMesh);

    const component = this.ahuObject['3d'].components.meshes['r:novo.graphics::FanPropeller-1'];

    const centerMeshBackwallYPos = closestCenterMesh.mesh.position.y + this.ahuObject.resources.ducts[closestCenterMesh.key].dimensions.y / 2;

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
        panel.position.z,
      ),
      new THREE.Vector3(
        panel.position.x,
        centerMeshBackwallYPos + travelDepth,
        closestCenterMesh.mesh.position.z
      ),
      new THREE.Vector3(
        panel.position.x,
        centerMeshBackwallYPos + travelDepth,
        closestCenterMesh.mesh.position.z
      ),
      new THREE.Vector3(
        closestCenterMesh.mesh.position.x,
        centerMeshBackwallYPos + travelDepth,
        closestCenterMesh.mesh.position.z
      ),
      new THREE.Vector3(
        closestCenterMesh.mesh.position.x,
        centerMeshBackwallYPos + travelDepth,
        closestCenterMesh.mesh.position.z
      ),
      new THREE.Vector3(
        closestCenterMesh.mesh.position.x,
        centerMeshBackwallYPos,
        closestCenterMesh.mesh.position.z
      ),
    ];

    console.log("createCables points:", points);

    const curve = new THREE.CatmullRomCurve3(points);

    console.log("createCables curve:", curve);

    const tubeGeometry = new THREE.TubeGeometry(
      curve,       // The curve to follow
      128,          // Number of segments (higher = smoother)
      64,           // Radius of the tube
      8,           // Number of sides (higher = more circular)
      false        // Closed or not (true = connect ends)
    );

    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.5
    });

    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.name = `Panel-Line`;

    tube.visible = false;

    sharedData.sceneHelper.addToScene(tube);
  }

  findCenterMesh(meshDictionary) {
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

  calculatePanelPosition(panelSettings) {   
    const boundingBox = sharedData.ahuBoundingBox;

    const position = { x: 0, y: 0, z: 0 };
    const halfCubeWidth = panelSettings.dimensions.x / 2;
    const halfCubeHeight = panelSettings.dimensions.z / 2;
    
    // X position (left-right)
    if (panelSettings.position.x === "center") {
        position.x = boundingBox.center.x;
    } else if (panelSettings.position.x === "left") {
        position.x = boundingBox.min.x - halfCubeWidth - panelSettings.padding.x;
    } else if (panelSettings.position.x === "right") {
        position.x = boundingBox.max.x + halfCubeWidth + panelSettings.padding.x;
    }
    
    // Y position (fixed to center of component height)
    position.y = boundingBox.center.y;
    
    // Z position (top-bottom)
    if (panelSettings.position.z === "bottom") {
        position.z = boundingBox.min.z - halfCubeHeight - panelSettings.padding.z;
    } else if (panelSettings.position.z === "top") {
        position.z = boundingBox.max.z + halfCubeHeight + panelSettings.padding.z;
    } else if (panelSettings.position.z === "center") {
        position.z = boundingBox.center.z;
    }

    this.panelSettings.position = position;

    this.findComponentClosestToMedian();
  }

  findComponentClosestToMedian() {
    let foundPosition = { x: 0, y: 0, z: 0 };

    // for(const i in this.ahuObject['3d'].components.meshes) {}

    this.panelSettings.position.x = this.ahuObject['3d'].components.meshes['r:novo.graphics::FanPropeller-1'].position.x;
  }

  initTerminals() {
    let wireCount = 0;

    const dimensions = this.terminalSettings.dimensions;
    const padding = this.terminalSettings.padding;

    this.terminalWidthSpan = padding.x;

    this.terminalMeshes = [];

    for(const i in this.wiringData.cables) {
      wireCount += this.wiringData.cables[i].wires.length;

      const terminalGeometry = new THREE.BoxGeometry(
        dimensions.x, 
        dimensions.y, 
        dimensions.z, 
      );
      const terminalMesh = new THREE.Mesh(
        terminalGeometry, 
        new THREE.MeshStandardMaterial({
          color: sharedData.primaryColor
        })
      );
      terminalMesh.position.copy(this.panelSettings.position);

      terminalMesh.position.x += (dimensions.x + padding.x) * i;

      this.terminalWidthSpan += dimensions.x + padding.x;

      sharedData.sceneHelper.addToScene(terminalMesh);  

      this.terminals[this.wiringData.cables[i].idTag] = terminalMesh;
    }

    for(const key in this.terminals) {
      this.terminals[key].position.x += -this.terminalWidthSpan / 2 + (dimensions.x/2 + padding.x);
    }
    
  }

  createCables() {
    console.log("createCables started:", this.ahuObject);

    const travelDepth = 1000;

    const componentIDs = Object.keys(this.ahuObject['3d'].components.meshes);

    console.log("createCables this.terminals:", this.terminals);

    for(const cable of this.wiringData.cables) {

      let terminal = null;

      if(componentIDs.includes(cable.idTag)) {
        terminal = {
          id: cable.idTag,
          position: this.terminals[cable.idTag].position
        }
      }

      if(terminal == null) {
        alert(`Cable idTag '${cable.idTag}' not found in the AHU.`)
        return
      }

      console.log("createCables terminal:", terminal);
      const points = [];

      points.push(
        new THREE.Vector3(
          terminal.position.x,
          terminal.position.y,
          terminal.position.z,
        )
      );

      points.push(
        new THREE.Vector3(
          terminal.position.x,
          terminal.position.y + travelDepth,
          terminal.position.z,
        )
      );

      points.push(
        new THREE.Vector3(
          terminal.position.x,
          this.ahuObject['3d'].components.meshes[terminal.id].position.y + travelDepth,
          this.ahuObject['3d'].components.meshes[terminal.id].position.z
        )
      );

      if(Math.abs(terminal.position.x - this.ahuObject['3d'].components.meshes[terminal.id].position.x) > 1) {
        points.push(
          new THREE.Vector3(
            this.ahuObject['3d'].components.meshes[terminal.id].position.x,
            this.ahuObject['3d'].components.meshes[terminal.id].position.y + travelDepth,
            this.ahuObject['3d'].components.meshes[terminal.id].position.z
          )
        );
      }

      points.push(
        new THREE.Vector3(
          this.ahuObject['3d'].components.meshes[terminal.id].position.x,
          this.ahuObject['3d'].components.meshes[terminal.id].position.y,
          this.ahuObject['3d'].components.meshes[terminal.id].position.z
        )
      );
  
      console.log("createCables points:", points);
  
      const curve = new THREE.CatmullRomCurve3(points);
  
      console.log("createCables curve:", curve);

      const tubeGeometry = new TubePath(
        curve, 
        TubePath.pathToUMapping(curve, 5, 2), 
        64, 
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
      tube.name = `${terminal.id}-Cable`;

      tube.visible = false;
  
      sharedData.sceneHelper.addToScene(tube);

      this.createWires(cable, points);

    }

    console.log("createCables finished");
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

  createWires(cable, points) {
    const wires = [];
    
    // Determine wire direction based on start and end points
    const wireDirection = points[0].x < points[points.length - 1].x ? 1 : -1;
    
    // Create individual wires for each wire in the cable
    for (const i in cable.wires) {
      const index = parseInt(i);
      
      // Calculate offset for this wire to position it alongside the cable
      // Alternating positive/negative offsets based on index to spread wires evenly
      const offsetFactor = Math.ceil(index/2) * (index % 2 === 0 ? -1 : 1);
      const offset = 65 * offsetFactor; // Reduced offset value for more realistic bundling
      
      // Create a deep copy of the points array for this wire
      const wirePoints = points.map(point => point.clone());
      
      // Apply offset to each point (except start and end points)
      for (let j = 1; j < wirePoints.length - 1; j++) {
        wirePoints[j].y += offset;
      }
      
      // Create curve using the modified points
      const curve = new THREE.CatmullRomCurve3(wirePoints);
      
      // Use TubePath instead of TubeGeometry
      const tubeGeometry = new TubePath(
        curve, 
        TubePath.pathToUMapping(curve, 5, 2), // Same parameters as in createCables
        32, // Slightly smaller radius than main cable
        8,  // Same sides
        false // Not closed
      );
      
      // Create material with appropriate wire color
      const tubeMaterial = new THREE.MeshStandardMaterial({
        color: this.getWireColor(cable.wires[i].color),
        metalness: 0.3,
        roughness: 0.5
      });
      
      // Create mesh
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.x += offset * wireDirection;
      
      // Name the wire for easy reference
      tube.name = `${cable.id}-${cable.wires[i].id}`;
      
      // Add to scene and store reference
      sharedData.sceneHelper.addToScene(tube);
      wires.push(tube);
    }
    
    return wires;
  }
}