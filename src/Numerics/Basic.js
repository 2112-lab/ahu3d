/**
 * @function getDuctDirection
 * @description Determines the relative direction of a duct based on its start and end graphic locations.
 * @param {Object} queriedSegment - The segment object containing graphicLocation data.
 * @param {String} key - The key representing the joining location.
 * @returns {String} The relative direction (e.g., "left", "right", "up", "down").
 */
export function getDuctDirection(queriedSegment, key) {
    console.log("getDuctDirection started:", queriedSegment, key);

    let joiningLocation; // The starting location of the duct.
    let secondaryLocation; // The end location of the duct.

    // Determine which point is the joining location and which is the secondary location.
    if (queriedSegment.graphicLocation.start === key) {
        joiningLocation = queriedSegment.graphicLocation.start;
        secondaryLocation = queriedSegment.graphicLocation.end;
    } else {
        joiningLocation = queriedSegment.graphicLocation.end;
        secondaryLocation = queriedSegment.graphicLocation.start;
    }

    let relativePosition = "none"; // Default relative position.

    // Determine the relative position of the secondary location compared to the joining location.
    if (secondaryLocation[0] < joiningLocation[0]) {
        relativePosition = "left";
    } else if (secondaryLocation[0] > joiningLocation[0]) {
        relativePosition = "right";
    } else if (secondaryLocation[1] > joiningLocation[1]) {
        relativePosition = "down";
    } else if (secondaryLocation[1] < joiningLocation[1]) {
        relativePosition = "up";
    }

    return relativePosition; // Return the determined relative position.
}

/**
 * @function seperateByDirections
 * @description Separates the provided segments into different directions based on their relative positions.
 * @param {Object} intersectSegments - An object to store the segments categorized by direction.
 * @param {Object} adjacentSegment - The segment adjacent to the current one.
 * @param {Array} currentSegments - Array of current segments to be categorized.
 */
export function seperateByDirections(intersectSegments, adjacentSegment, currentSegments) {
    for (const currentSegment of currentSegments) {
        // Add each current segment to the intersectSegments object under its relative position.
        intersectSegments[currentSegment.relativePosition] = currentSegment;
    }

    // Add the adjacent segment to the intersectSegments object.
    intersectSegments[adjacentSegment.relativePosition] = adjacentSegment;

    console.log("seperateByDirections intersectSegments:", intersectSegments);
}

/**
 * @function translateDuct
 * @description Translates (moves) a duct along a specified axis by a given value.
 * @param {Object} duct - The duct object to be translated.
 * @param {String} translationKey - The axis to translate on (e.g., 'x', 'y', 'z').
 * @param {Number} translationValue - The amount by which to translate the duct.
 */
export function translateDuct(duct, translationKey, translationValue) {
    duct.position[translationKey] += translationValue; // Apply the translation to the specified axis.
}
