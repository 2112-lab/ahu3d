import { sharedData } from "../Ahu3D/globals.js";

export function setControllers(ahuObject) {
    console.log("setControllers started:", ahuObject);
    const controllers = ahuObject.xetoDictionary.ahuGroup.blockStyle.controllers;
    
    for(const i in controllers) {
        const controllerId = `Controller-${i}`;
        // Start with the controller from dictionary
        ahuObject.resources.controllers[controllerId] = controllers[i];
        
        // Get base controller template
        const asset = controllers[i].type;
        let controller = sharedData.controllers[asset];
        
        // Calculate dimensions based on ports
        controller.dimensions.x = controller.portSpacing * Math.floor(controllers[i].ports / 2);
        
        // Merge controller properties
        ahuObject.resources.controllers[controllerId] = {
            ...ahuObject.resources.controllers[controllerId],
            ...controller
        };
        
        // Calculate position based on bounding box
        const controllerPosition = calculateControllerPosition(
            ahuObject.resources.controllers[controllerId], 
            sharedData.ahuBoundingBox
        );
        
        // Add position to controller data
        ahuObject.resources.controllers[controllerId].calculatedPosition = controllerPosition;
        
        // Calculate sphere positions (for inputs and outputs)
        const spherePositions = calculateSpherePositions(
            ahuObject.resources.controllers[controllerId]
        );
        
        // Add sphere positions to controller data
        ahuObject.resources.controllers[controllerId].spherePositions = spherePositions;
    }
    
    console.log("setControllers controllers:", ahuObject.resources.controllers);
}

/**
 * Calculate the position of the controller relative to the AHU bounding box
 */
function calculateControllerPosition(controllerSettings, boundingBox) {
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
    
    // Z position (top-bottom)
    if (controllerSettings.position.z === "bottom") {
        position.z = boundingBox.min.z - halfCubeHeight - controllerSettings.padding.z;
    } else if (controllerSettings.position.z === "top") {
        position.z = boundingBox.max.z + halfCubeHeight + controllerSettings.padding.z;
    } else if (controllerSettings.position.z === "center") {
        position.z = boundingBox.center.z;
    }
    
    return position;
}

/**
 * Calculate positions for all input and output spheres
 */
function calculateSpherePositions(controllerSettings) {
    const totalSpheres = Math.floor(controllerSettings.ports / 2);
    const startX = -controllerSettings.dimensions.x / 2 + 64;
    const endX = controllerSettings.dimensions.x / 2 - 64;
    
    // Calculate spacing between spheres
    const spacing = (endX - startX) / (totalSpheres - 1 || 1); // Handle case of 1 sphere
    
    const spherePositions = {
        inputs: [],
        outputs: []
    };
    
    // Z position for inputs and outputs
    const outputZPosition = -controllerSettings.dimensions.z / 2 - 64; // Output position
    const inputZPosition = controllerSettings.dimensions.z / 2 + 64;   // Input position
    
    // Calculate positions for each sphere
    for (let i = 0; i < totalSpheres; i++) {
        const xPosition = startX + (i * spacing);
        
        // Add output sphere position
        spherePositions.outputs.push({
            position: { x: xPosition, y: 0, z: outputZPosition },
            attributeId: `output-${i}`
        });
        
        // Add input sphere position
        spherePositions.inputs.push({
            position: { x: xPosition, y: 0, z: inputZPosition },
            attributeId: `input-${i}`
        });
    }
    
    return spherePositions;
}