/**
 * @file Ahu.js
 * @description This module defines the Ahu class, which is responsible for managing and rendering 2D and 3D representations of Air Handling Units (AHUs).
 * It includes methods for translating and calculating the dimensions of AHU assemblies.
 */

export default class Ahu {

    /**
     * Translates each assembly segment along the x and z axes.
     * 
     * @param {Array} assemblySegments - An array of assembly segment objects to be translated.
     */
    translate(assemblySegments) {
        for (const segment of assemblySegments) {
            // Translate the segment along the x-axis by half the assembly width minus 50 units.
            this.translateAssemblySegment(segment.segment, 'x', (this.assemblyDimensions.width / 2) - 50);

            // Translate the segment along the z-axis by the assembly height plus 200 units.
            this.translateAssemblySegment(segment.segment, 'z', this.assemblyDimensions.height + 200);
        }
    }

    /**
     * Calculates and returns the dimensions (width and height) of the entire assembly.
     * This is determined by evaluating the positions and sizes of the segments.
     * 
     * @returns {Object} An object containing the calculated width and height of the assembly.
     */
    getAssemblyDimensions() {
        // Filter assembly segments to find those in the last row.
        let lastRow = this.assemblySegments.filter(child => 
            this.getRow(child.xetoDuct.graphicLocation.end) === this.getRow(this.assemblyGridBounds.end)
        );

        // Initialize z-position tracking variables.
        let z = this.assemblySegments[0].segment.duct.userData.component.object.position.z;
        let minZPos = z;
        let lowestSegment = this.assemblySegments[0];

        // Iterate over each segment to find the lowest one based on its z-position.
        for (const segment of this.assemblySegments) {
            z = segment.segment.duct.userData.component.object.position.z;
            if (z < minZPos) {
                minZPos = z;
                lowestSegment = segment;
            }
        }

        let minZ = 0;

        // Determine the minimum z-position based on the segment's graphic location.
        if (lowestSegment.xetoDuct.graphicLocation.start[0] === lowestSegment.xetoDuct.graphicLocation.end[0]) {
            minZ = minZPos - (lowestSegment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2);
        } else if (this.getRow(lowestSegment.xetoDuct.graphicLocation.start) === this.getRow(lowestSegment.xetoDuct.graphicLocation.end)) {
            minZ = minZPos - 530;
        }

        // Calculate the total height of the assembly.
        const calcHeight = minZ * -1;

        // Initialize min and max x-position tracking variables for the last row.
        let minX = 0;
        let maxX = 0;
        let x = 0;

        // Iterate over the segments in the last row to determine the minimum x-position.
        for (const lastRowSegment of lastRow) {
            x = lastRowSegment.segment.duct.userData.component.object.position.x 
                - (lastRowSegment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2);
            if (x < minX) {
                minX = x;
            }
        }

        // Iterate again to determine the maximum x-position.
        for (const lastRowSegment of lastRow) {
            x = lastRowSegment.segment.duct.userData.component.object.position.x 
                + (lastRowSegment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2);
            if (x > maxX) {
                maxX = x;
            }
        }

        // Return the calculated width and height of the assembly.
        return { width: (0 - maxX - minX), height: calcHeight };
    }
}
