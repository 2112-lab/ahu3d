export default class Ahu {

    translate(assemblySegments) {
        for (const segment of assemblySegments) { // Iterate over each segment.
            this.translateAssemblySegment(segment.segment, 'x', ((this.assemblyDimensions.width / 2) - 50)); // Translate the segment on the x-axis.
            this.translateAssemblySegment(segment.segment, 'z', this.assemblyDimensions.height + 200); // Translate the segment on the z-axis.
        }
    }

    /**
     * getAssemblyDimensions
     * 
     * Calculates the width and height of the entire assembly based on the positions of segments.
     * 
     * @returns {Object} The dimensions of the assembly (width and height).
     */
    getAssemblyDimensions() {
        let lastRow = this.assemblySegments.filter(child => 
            this.getRow(child.xetoDuct.graphicLocation.end) === this.getRow(this.assemblyGridBounds.end) 
        ); // Get the segments in the last row.

        let z = this.assemblySegments[0].segment.duct.userData.component.object.position.z; // Get the initial z-position.
        let minZPos = z; // Initialize the minimum z-position.
        let lowestSegment = this.assemblySegments[0]; // Initialize the lowest segment.

        for (const segment of this.assemblySegments) { // Iterate over each segment.
            z = segment.segment.duct.userData.component.object.position.z; // Get the z-position of the current segment.
            if (z < minZPos) { // If the current segment is lower.
                minZPos = z; // Update the minimum z-position.
                lowestSegment = segment; // Update the lowest segment.
            }
        }

        let minZ = 0;

        if (lowestSegment.xetoDuct.graphicLocation.start[0] == lowestSegment.xetoDuct.graphicLocation.end[0]) {
            minZ = minZPos - (lowestSegment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2); // Calculate the minimum z-position.
        } else if (this.getRow(lowestSegment.xetoDuct.graphicLocation.start) == this.getRow(lowestSegment.xetoDuct.graphicLocation.end)) {
            minZ = minZPos - 530; // Adjust the minimum z-position.
        }

        const calcHeight = minZ * -1; // Calculate the height of the assembly.

        let minX = 0;
        let x = 0;
        for (const lastRowSegment of lastRow) { // Iterate over each segment in the last row.
            x = lastRowSegment.segment.duct.userData.component.object.position.x - (lastRowSegment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2);
            if (x < minX) { // If the current x-position is less than the minimum.
                minX = x; // Update the minimum x-position.
            }
        }

        let maxX = 0;
        x = 0;
        for (const lastRowSegment of lastRow) { // Iterate over each segment in the last row.
            x = lastRowSegment.segment.duct.userData.component.object.position.x + (lastRowSegment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2);
            if (x > maxX) { // If the current x-position is greater than the maximum.
                maxX = x; // Update the maximum x-position.
            }
        }

        return { width: (0 - maxX - minX), height: calcHeight }; // Return the calculated width and height of the assembly.
    }
}
