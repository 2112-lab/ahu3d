export default class Ahu {
    translate(assemblySegments) {
        for (const segment of assemblySegments) { // Iterate over each segment.
            this.translateAssemblySegment(segment.segment, 'x', ((this.assemblyDimensions.width / 2) - 50)); // Translate the segment on the x-axis.
            this.translateAssemblySegment(segment.segment, 'z', this.assemblyDimensions.height + 200); // Translate the segment on the z-axis.

            this.setGuideline(segment);
        }
    }
}
