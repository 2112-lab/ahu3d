export function moveOriginalProxyVertices(proxyGeometry) {
    // Access the position attribute
    const positionAttribute = proxyGeometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i);

        if (y < 0.5) {
            positionAttribute.setY(i, 0);
        }
    }

    // Mark the position attribute as needing an update
    positionAttribute.needsUpdate = true;
}

export function moveProxyVertices(proxyGeometry, ductDepth, proxyLength, maxLength) {

    const globalLength = ((maxLength - ductDepth) / 2);
    const adjacentLength = ((proxyLength - ductDepth) / 2);

    // Access the position attribute
    const positionAttribute = proxyGeometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i);

        // Move vertices with y > 0.5 upwards by "globalLength/adjacentLength" units
        if (y > 0.5) {
            positionAttribute.setY(i, y + globalLength + 30);
        }
        else if (y < 0.5) {
            positionAttribute.setY(i, y - adjacentLength - 30);
        }
    }

    // Mark the position attribute as needing an update
    positionAttribute.needsUpdate = true;
}