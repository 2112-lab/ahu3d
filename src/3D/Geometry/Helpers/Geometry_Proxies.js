/**
 * moveOriginalProxyVertices
 * 
 * This function adjusts the Y-coordinate of the vertices in the given proxy geometry.
 * If a vertex has a Y-coordinate less than 0.5, it is set to 0. This function helps in 
 * repositioning certain vertices based on their Y-value.
 * 
 * @param {THREE.BufferGeometry} proxyGeometry - The geometry whose vertices will be adjusted.
 */
export function moveOriginalProxyVertices(proxyGeometry) {
    // Access the position attribute of the geometry, which contains the vertex positions
    const positionAttribute = proxyGeometry.attributes.position;

    // Iterate through all vertices in the geometry
    for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i); // Get the Y-coordinate of the current vertex

        // If the Y-coordinate is less than 0.5, set it to 0
        if (y < 0.5) {
            positionAttribute.setY(i, 0); // Move vertex along the Y-axis to 0
        }
    }

    // After modifying the geometry, we mark the position attribute as needing an update
    positionAttribute.needsUpdate = true;
}

/**
 * moveProxyVertices
 * 
 * This function moves the vertices of a given proxy geometry along the Y-axis, based on specific conditions.
 * The function adjusts the vertices based on their Y-coordinate, shifting them upwards or downwards 
 * depending on whether they are above or below 0.5.
 * 
 * @param {THREE.BufferGeometry} proxyGeometry - The geometry whose vertices will be adjusted.
 * @param {number} ductDepth - The depth of the duct, used to calculate adjustments.
 * @param {number} proxyLength - The length of the proxy geometry, used to calculate adjustments.
 * @param {number} largestGlobalSize - The largest global size for reference when calculating adjustments.
 */
export function moveProxyVertices(proxyGeometry, ductDepth, proxyLength, largestGlobalSize) {
    // Calculate the global length and adjacent length based on the largest global size and duct depth
    const globalLength = ((largestGlobalSize - ductDepth) / 2);
    const adjacentLength = ((proxyLength - ductDepth) / 2);

    // Access the position attribute of the geometry, which contains the vertex positions
    const positionAttribute = proxyGeometry.attributes.position;

    // Iterate through all vertices in the geometry
    for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i); // Get the Y-coordinate of the current vertex

        // Move vertices with a Y-coordinate greater than 0.5 upwards by "globalLength + 30"
        if (y > 0.5) {
            positionAttribute.setY(i, y + globalLength + 30);
        }
        // Move vertices with a Y-coordinate less than 0.5 downwards by "adjacentLength + 30"
        else if (y < 0.5) {
            positionAttribute.setY(i, y - adjacentLength - 30);
        }
    }

    // After modifying the geometry, we mark the position attribute as needing an update
    positionAttribute.needsUpdate = true;
}

