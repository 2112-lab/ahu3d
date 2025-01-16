import * as THREE from 'three';

/**
 * getSegmentDirection
 * 
 * Determines the direction of a segment based on its start and end positions.
 * 
 * @param {Object} segment - The segment object containing start and end positions.
 * @returns {String} The direction of the segment (e.g., "north", "south", "east", "west").
 */
export function getSegmentDirection(queriedSegment, key) {
    let joiningLocation;
    let secondaryLocation;
    if(queriedSegment.xetoDuct.graphicLocation.start == key) {
        joiningLocation = queriedSegment.xetoDuct.graphicLocation.start;
        secondaryLocation = queriedSegment.xetoDuct.graphicLocation.end;
    }
    else {
        joiningLocation = queriedSegment.xetoDuct.graphicLocation.end;
        secondaryLocation = queriedSegment.xetoDuct.graphicLocation.start;
    }

    let relativePosition = "none";
    if(secondaryLocation[0] < joiningLocation[0]) {
        relativePosition = "left";
    }
    else if(secondaryLocation[0] > joiningLocation[0]) {
        relativePosition = "right";
    }
    else if(secondaryLocation[1] > joiningLocation[1]) {
        relativePosition = "down";
    }
    else if(secondaryLocation[1] < joiningLocation[1]) {
        relativePosition = "up";
    }

    queriedSegment.relativePosition = relativePosition;
}

/**
 * seperateByDirections
 * 
 * Separates a list of segments into groups based on their direction (e.g., "north", "south", "east", "west").
 * 
 * @param {Array} segments - The array of segments to separate.
 * @returns {Object} An object grouping segments by their directions.
 */
export function seperateByDirections(intersectSegments, adjacentSegment, currentSegments) {
    for(const currentSegment of currentSegments) {
        intersectSegments[currentSegment.relativePosition] = currentSegment;
    }
    intersectSegments[adjacentSegment.relativePosition] = adjacentSegment;
}

/**
 * translateAssemblySegment
 * 
 * Translates an assembly segment by a specified value along a specified axis (x, z).
 * 
 * @param {Object} assemblySegment - The assembly segment to translate.
 * @param {String} translationKey - The axis to translate along ('x' or 'z').
 * @param {Number} translationValue - The value to translate by.
 */
export function translateAssemblySegment(assemblySegment, translationKey, translationValue) {
    for (const component of assemblySegment.meshes) { // Iterate over each component in the segment.
        component.userData.component.object.position[translationKey] += translationValue; // Translate the component's position.
    }
    if (assemblySegment.joints !== undefined) { // If the segment has joints defined.
        for (const joint of assemblySegment.joints) { // Translate each joint's position.
            joint.userData.component.object.position[translationKey] += translationValue;
        }
    }
    if (assemblySegment.ends !== undefined) { // If the segment has ends defined.
        for (const end of assemblySegment.ends) { // Translate each end's position.
            end.userData.component.object.position[translationKey] += translationValue;
        }
    }
    assemblySegment.duct.userData.component.object.position[translationKey] += translationValue; // Translate the duct's position.
}

/**
 * orientAssemblySegment
 * 
 * Orients an assembly segment to match a specified orientation (north, south, east, west).
 * Adjusts the rotation and position of components and duct ends as needed.
 * 
 * @param {Object} assemblySegment - The assembly segment to orient.
 * @param {String} orientation - The orientation to apply ('north', 'south', 'east', 'west').
 */
export function orientAssemblySegment(assemblySegment, orientation) {
    let originalPos = new THREE.Vector3(); // Initialize the original position vector.
    if (orientation == 'north') { // If the orientation is 'north'.
        assemblySegment.duct.userData.component.object.rotation.y = THREE.MathUtils.degToRad(-90); // Rotate the duct 90 degrees counterclockwise.
        for (const component of assemblySegment.meshes) { // Iterate over each component in the segment.
            let originalPosZ = component.userData.component.object.position.x - assemblySegment.duct.userData.component.object.position.x; // Calculate the original position.
            let originalPosX = assemblySegment.duct.userData.component.object.position.z - component.userData.component.object.position.z; // Calculate the original position.
            component.userData.component.object.position = new THREE.Vector3(); // Reset the component's position.
            component.userData.component.object.rotation.y += THREE.MathUtils.degToRad(-90); // Rotate the component 90 degrees counterclockwise.
            component.userData.component.object.position.z = originalPosZ; // Set the component's z-position to its original x-position.
            component.userData.component.object.position.x = originalPosX; // Set the component's z-position to its original x-position.
            component.userData.component.object.position.z += 530; // Adjust the component's z-position.
        }
        if (assemblySegment.ends !== undefined) { // If the segment has ends defined.
            for (const end of assemblySegment.ends) { // Iterate over each end in the segment.
                originalPos = end.userData.component.object.position.x - assemblySegment.duct.userData.component.object.position.x; // Calculate the original position.
                end.userData.component.object.position = new THREE.Vector3(); // Reset the end's position.
                end.userData.component.object.rotation.y += THREE.MathUtils.degToRad(-90); // Rotate the end 90 degrees clockwise.
                end.userData.component.object.position.z = originalPos; // Set the end's z-position to its original x-position.
                end.userData.component.object.position.z += 530; // Adjust the end's z-position.
            }
        }
    }
    else if (orientation == 'south') { // If the orientation is 'south'.
        assemblySegment.duct.userData.component.object.rotation.y = THREE.MathUtils.degToRad(90); // Rotate the duct 90 degrees clockwise.
        for (const component of assemblySegment.meshes) { // Iterate over each component in the segment.
            let originalPosZ = component.userData.component.object.position.x - assemblySegment.duct.userData.component.object.position.x; // Calculate the original position.
            let originalPosX = component.userData.component.object.position.z - assemblySegment.duct.userData.component.object.position.z; // Calculate the original position.
            component.userData.component.object.position = new THREE.Vector3(); // Reset the component's position.
            component.userData.component.object.rotation.y += THREE.MathUtils.degToRad(90); // Rotate the component 90 degrees clockwise.
            component.userData.component.object.position.z = originalPosZ; // Set the component's z-position to its original x-position.
            component.userData.component.object.position.x = originalPosX; // Set the component's z-position to its original x-position.
            component.userData.component.object.position.z += 530; // Adjust the component's z-position.
        }
        if (assemblySegment.ends !== undefined) { // If the segment has ends defined.
            for (const end of assemblySegment.ends) { // Iterate over each end in the segment.
                originalPos = end.userData.component.object.position.x - assemblySegment.duct.userData.component.object.position.x; // Calculate the original position.
                end.userData.component.object.position = new THREE.Vector3(); // Reset the end's position.
                end.userData.component.object.rotation.y += THREE.MathUtils.degToRad(-90); // Rotate the end 90 degrees counterclockwise.
                end.userData.component.object.position.z = originalPos; // Set the end's z-position to its original x-position.
                end.userData.component.object.position.z += 530; // Adjust the end's z-position.
            }
        }
    }
    else if (orientation == 'west') { // If the orientation is 'west'.
        for (const component of assemblySegment.meshes) { // Iterate over each component in the segment.
            let originalPosZ = component.userData.component.object.position.x - assemblySegment.duct.userData.component.object.position.x; // Calculate the original position.
            let originalPosX = component.userData.component.object.position.z - assemblySegment.duct.userData.component.object.position.z; // Calculate the original position.
            component.userData.component.object.position = new THREE.Vector3(); // Reset the component's position.
            component.userData.component.object.rotation.z = THREE.MathUtils.degToRad(180); // Set the component's rotation to 0 degrees.
            component.userData.component.object.position.x = originalPosZ; // Set the component's z-position to its original x-position.
            component.userData.component.object.position.z = originalPosX; // Set the component's z-position to its original x-position.
            component.userData.component.object.position.z += 530; // Adjust the component's z-position.
        }
        if (assemblySegment.ends !== undefined) { // If the segment has ends defined.
            for (const end of assemblySegment.ends) { // Iterate over each end in the segment.
                originalPos = end.userData.component.object.position.x - assemblySegment.duct.userData.component.object.position.x; // Calculate the original position.
                end.userData.component.object.position = new THREE.Vector3(); // Reset the end's position.
                end.userData.component.object.rotation.y += THREE.MathUtils.degToRad(0); // Rotate the end 90 degrees counterclockwise.
                end.userData.component.object.position.x = originalPos; // Set the end's z-position to its original x-position.
                end.userData.component.object.position.z += 530; // Adjust the end's z-position.
            }
        }
    }
    else if (orientation == 'east') {
        // if (assemblySegment.ends !== undefined) { // If the segment has ends defined.
        //     for (const end of assemblySegment.ends) { // Iterate over each end in the segment.
        //         originalPos = end.userData.component.object.position.x - assemblySegment.duct.userData.component.object.position.x; // Calculate the original position.
        //         end.userData.component.object.position = new THREE.Vector3(); // Reset the end's position.
        //         end.userData.component.object.rotation.y += THREE.MathUtils.degToRad(0); // Rotate the end 90 degrees counterclockwise.
        //         end.userData.component.object.position.x = originalPos; // Set the end's z-position to its original x-position.
        //         end.userData.component.object.position.z += 530; // Adjust the end's z-position.
        //     }
        // }
    }
}