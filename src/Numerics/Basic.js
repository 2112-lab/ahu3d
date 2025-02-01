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

export function getDuctDirection(queriedSegment, key) {
    console.log("getDuctDirection started:", queriedSegment, key);
    let joiningLocation;
    let secondaryLocation;
    if(queriedSegment.graphicLocation.start == key) {
        joiningLocation = queriedSegment.graphicLocation.start;
        secondaryLocation = queriedSegment.graphicLocation.end;
    }
    else {
        joiningLocation = queriedSegment.graphicLocation.end;
        secondaryLocation = queriedSegment.graphicLocation.start;
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

    return relativePosition;
}

export function seperateByDirections(intersectSegments, adjacentSegment, currentSegments) {
    for(const currentSegment of currentSegments) {
        
        intersectSegments[currentSegment.relativePosition] = currentSegment;
    }
    intersectSegments[adjacentSegment.relativePosition] = adjacentSegment;

    console.log("seperateByDirections intersectSegments:", intersectSegments);
}

export function translateDuct(duct, translationKey, translationValue) {
    duct.position[translationKey] += translationValue;
}

export function orientDuct(duct, orientation) {
    if (orientation == 'north') { // If the orientation is 'north'.
        duct.rotation.y = -90;
    }
    else if (orientation == 'south') { // If the orientation is 'south'.
        duct.rotation.y = 90;
    }
    else if (orientation == 'west') { // If the orientation is 'west'.
        duct.rotation.y = 180;
    }
}