import { sharedData } from "../Ahu3D/globals.js";
import * as THREE from 'three';

export default class Wiring3D {
  constructor(ahuObject) {   
    
    this.ahuObject = ahuObject;

    this.wiringData = {
      cables: [
        {
          id: "SCHP1-CS",
          label: "Current Switch Cable",
          equipment: "Switch",
          idTag: "AirFilter-1",
          pointName: "Fan-1 Curr. Switch",
          markers: "SCHP1-CS",
          wires: [
            {
              id: "SCHP1-CS-Wire-1",
              fieldWiring: "Yellow",
              panelWiringId: "I1-9B",
              color: "Yellow",
              size: "18-2"
            },
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
          idTag: "FanPropeller-1",
          pointName: "Fan-3 Supply Temp",
          markers: "AHU2-TEMP",
          wires: [
          ]
        },
        {
          id: "SCHP2-CS",
          label: "Current Switch Cable",
          equipment: "Switch",
          idTag: "CoolingCoil-0",
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
        }
      ],
    };

    this.terminalPanelSettings = {
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
        x: 300,
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

    this.calculateTerminalPanelPosition(
      this.terminalPanelSettings,
      sharedData.ahuBoundingBox
    ); 

    this.initTerminals();

    this.initTerminalPanel();

    this.createCables();
    
  }

  initTerminalPanel() {
    this.terminalPanelSettings.dimensions.x = this.cableWidthSpan;
    
    // Create a group to hold all frame parts
    const frameGroup = new THREE.Group();
    frameGroup.position.copy(this.terminalPanelSettings.position);
    
    // Dimensions for the frame parts
    const width = this.terminalPanelSettings.dimensions.x;
    const depth = this.terminalPanelSettings.dimensions.y;
    const height = this.terminalPanelSettings.dimensions.z;

    const wallThickness = this.terminalPanelSettings.wallThickness;
    
    // Material for the frame
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: sharedData.primaryColor,
        transparent: true,
        opacity: this.terminalPanelSettings.opacity
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
        opacity: this.terminalPanelSettings.opacity
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
        opacity: this.terminalPanelSettings.opacity
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
        opacity: this.terminalPanelSettings.opacity
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

  calculateTerminalPanelPosition(terminalPanelSettings, boundingBox) {   
    const position = { x: 0, y: 0, z: 0 };
    const halfCubeWidth = terminalPanelSettings.dimensions.x / 2;
    const halfCubeHeight = terminalPanelSettings.dimensions.z / 2;
    
    // X position (left-right)
    if (terminalPanelSettings.position.x === "center") {
        position.x = boundingBox.center.x;
    } else if (terminalPanelSettings.position.x === "left") {
        position.x = boundingBox.min.x - halfCubeWidth - terminalPanelSettings.padding.x;
    } else if (terminalPanelSettings.position.x === "right") {
        position.x = boundingBox.max.x + halfCubeWidth + terminalPanelSettings.padding.x;
    }
    
    // Y position (fixed to center of component height)
    position.y = boundingBox.center.y;
    
    // Z position (top-bottom)
    if (terminalPanelSettings.position.z === "bottom") {
        position.z = boundingBox.min.z - halfCubeHeight - terminalPanelSettings.padding.z;
    } else if (terminalPanelSettings.position.z === "top") {
        position.z = boundingBox.max.z + halfCubeHeight + terminalPanelSettings.padding.z;
    } else if (terminalPanelSettings.position.z === "center") {
        position.z = boundingBox.center.z;
    }

    this.terminalPanelSettings.position = position;

    this.findComponentClosestToMedian();
  }

  findComponentClosestToMedian() {
    let foundPosition = { x: 0, y: 0, z: 0 };

    // for(const i in this.ahuObject['3d'].components.meshes) {}

    this.terminalPanelSettings.position.x = this.ahuObject['3d'].components.meshes['r:novo.graphics::FanPropeller-1'].position.x;
  }

  initTerminals() {
    let wireCount = 0;

    const dimensions = this.terminalSettings.dimensions;
    const padding = this.terminalSettings.padding;

    this.cableWidthSpan = padding.x;

    this.cableMeshes = [];

    for(const i in this.wiringData.cables) {
      wireCount += this.wiringData.cables[i].wires.length;

      const cableTerminalGeometry = new THREE.BoxGeometry(
        dimensions.x, 
        dimensions.y, 
        dimensions.z, 
      );
      const cableTerminalMesh = new THREE.Mesh(
        cableTerminalGeometry, 
        new THREE.MeshStandardMaterial({
          color: sharedData.primaryColor
        })
      );
      cableTerminalMesh.position.copy(this.terminalPanelSettings.position);

      cableTerminalMesh.position.x += (dimensions.x + padding.x) * i;

      this.cableWidthSpan += dimensions.x + padding.x;

      sharedData.sceneHelper.addToScene(cableTerminalMesh);  
      
      this.cableMeshes.push(cableTerminalMesh);
    }

    for(const cableMesh of this.cableMeshes) {
      cableMesh.position.x += -this.cableWidthSpan / 2 + (dimensions.x/2 + padding.x);
    }

    console.log("initTerminals this.ahuObject:", this.ahuObject);

    
  }

  createCables() {
    console.log("createCables started:", this.ahuObject);

    const travelDepth = 1000;

    const components = [
      {
        id: 'r:novo.graphics::FanPropeller-1',
        position: {
          x: this.terminalPanelSettings.position.x,
          y: this.terminalPanelSettings.position.y,
          z: this.terminalPanelSettings.position.z
        }
      },
      {
        id: 'r:novo.graphics::Fan-0',
        position: {
          x: this.terminalPanelSettings.position.x + 400,
          y: this.terminalPanelSettings.position.y,
          z: this.terminalPanelSettings.position.z
        }
      },
      {
        id: 'r:novo.graphics::FanHorizontal-0',
        position: {
          x: this.terminalPanelSettings.position.x - 400,
          y: this.terminalPanelSettings.position.y,
          z: this.terminalPanelSettings.position.z
        }
      }
    ];

    for(const component of components) {
      console.log("createCables component:", component);
      const points = [
        new THREE.Vector3(
          component.position.x,
          component.position.y,
          component.position.z,
        ),
        new THREE.Vector3(
          component.position.x,
          component.position.y + travelDepth,
          component.position.z,
        ),
        new THREE.Vector3(
          component.position.x,
          component.position.y + travelDepth,
          component.position.z,
        ),
        new THREE.Vector3(
          component.position.x,
          this.ahuObject['3d'].components.meshes[component.id].position.y + travelDepth,
          this.ahuObject['3d'].components.meshes[component.id].position.z
        ),
        new THREE.Vector3(
          component.position.x,
          this.ahuObject['3d'].components.meshes[component.id].position.y + travelDepth,
          this.ahuObject['3d'].components.meshes[component.id].position.z
        ),
        new THREE.Vector3(
          this.ahuObject['3d'].components.meshes[component.id].position.x,
          this.ahuObject['3d'].components.meshes[component.id].position.y + travelDepth,
          this.ahuObject['3d'].components.meshes[component.id].position.z
        ),
        new THREE.Vector3(
          this.ahuObject['3d'].components.meshes[component.id].position.x,
          this.ahuObject['3d'].components.meshes[component.id].position.y + travelDepth,
          this.ahuObject['3d'].components.meshes[component.id].position.z
        ),
        new THREE.Vector3(
          this.ahuObject['3d'].components.meshes[component.id].position.x,
          this.ahuObject['3d'].components.meshes[component.id].position.y,
          this.ahuObject['3d'].components.meshes[component.id].position.z
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
      tube.name = component.id + "-Wire";
  
      sharedData.sceneHelper.addToScene(tube);

    }

    console.log("createCables finished");
  }
}