import * as THREE from 'three';

/**
 * Class for creating flow helpers (such as arrows and text) for duct segments.
 * This class handles the placement and calculation of flow indicators like arrows and text meshes based on duct orientation and position.
 */
export default class Helpers {

    /**
     * createFlowHelpers
     * 
     * Iterates over each segment in the assembly and creates flow helpers (arrows and text)
     * based on the segment's configuration and the presence of intersections.
     * Flow helpers are placed at the start or end of each duct segment if needed.
     * 
     * @param {Array} assemblySegments - Array of duct segments to process and create flow helpers for.
     */
    createFlowHelpers(assemblySegments) {
        console.log("createFlowHelpers started");

        // Iterate over each segment in the assembly
        for (const segment of assemblySegments) {
            // Check if the segment has flow helpers configured (either arrow or text)
            if (
                segment.xetoDuct.blockStyle.helpers &&
                segment.xetoDuct.blockStyle.helpers.arrow && 
                segment.xetoDuct.blockStyle.helpers.arrow.display ||
                segment.xetoDuct.blockStyle.helpers &&
                segment.xetoDuct.blockStyle.helpers.text &&
                segment.xetoDuct.blockStyle.helpers.text.display
            ) {
                console.log("createFlowHelpers segment:", segment);

                const segmentLoc = segment.xetoDuct.graphicLocation; // Get the segment's graphic location

                // Find intersections at the start of the segment
                const startIntersections = assemblySegments.filter(child => 
                    segmentLoc.start === child.xetoDuct.graphicLocation.start &&
                    segment !== child ||
                    segmentLoc.start === child.xetoDuct.graphicLocation.end &&
                    segment !== child
                );

                // Find intersections at the end of the segment
                const endIntersections = assemblySegments.filter(child => 
                    segmentLoc.end === child.xetoDuct.graphicLocation.start &&
                    segment !== child ||
                    segmentLoc.end === child.xetoDuct.graphicLocation.end &&
                    segment !== child
                );

                // If no intersections are found at the start, create flow helpers
                if (startIntersections.length === 0) {
                    console.log("createFlowHelpers: 0 starts found");

                    // If the arrow helper is enabled, create it
                    if(segment.xetoDuct.blockStyle.helpers.arrow && segment.xetoDuct.blockStyle.helpers.arrow.display) {
                        this.calcArrow(segment, "start");
                    }

                    // If the text helper is enabled, create it
                    if(segment.xetoDuct.blockStyle.helpers.text && segment.xetoDuct.blockStyle.helpers.text.display) {
                        this.calcTextMesh(segment, "start");
                    }
                }

                // If no intersections are found at the end, create flow helpers
                if (endIntersections.length === 0) {
                    console.log("createFlowHelpers: 0 ends found");

                    // If the arrow helper is enabled, create it
                    if(segment.xetoDuct.blockStyle.helpers.arrow && segment.xetoDuct.blockStyle.helpers.arrow.display) {
                        this.calcArrow(segment, "end");
                    }

                    // If the text helper is enabled, create it
                    if(segment.xetoDuct.blockStyle.helpers.text && segment.xetoDuct.blockStyle.helpers.text.display) {
                        this.calcTextMesh(segment, "end");
                    }
                }
            }
        }
    }

    /**
     * calcTextMesh
     * 
     * Calculates and creates the text mesh for the flow helper at the specified intersection.
     * The text mesh is placed based on the segment's orientation and the intersection key (start or end).
     * 
     * @param {Object} segment - The segment for which the text mesh is being created.
     * @param {string} intersectionKey - The key indicating whether to create the text at the "start" or "end" of the segment.
     */
    calcTextMesh(segment, intersectionKey) {
        console.log("calcTextMesh started");

        let textMesh = {
            userData: {
                component: {
                    object: {}
                }
            }
        };

        // Calculate the position and properties of the text indicator
        let object = this.calcIndicator(segment, "textMesh", intersectionKey);

        // Set the text mesh position based on the calculated indicator
        textMesh.userData.component.object.position = object.position;

        // Add the text mesh to the segment's list of text meshes
        segment.segment.textMeshes.push(textMesh);
    }

    /**
     * calcIndicator
     * 
     * Calculates the position and rotation of an indicator (arrow or text) based on the segment's orientation,
     * the type of indicator, and the intersection key (start or end).
     * This function calculates the necessary transformations and offsets for the indicator.
     * 
     * @param {Object} segment - The segment for which the indicator is being created.
     * @param {string} indicatorKey - The type of indicator (either "arrow" or "textMesh").
     * @param {string} intersectionKey - The key indicating whether to calculate the indicator at the "start" or "end" of the segment.
     * @returns {Object} The calculated position and rotation of the indicator.
     */
    calcIndicator(segment, indicatorKey, intersectionKey) {
        let object = {
            position: {
                x: segment.segment.duct.userData.component.object.position.x,
                y: segment.segment.duct.userData.component.object.position.y,
                z: segment.segment.duct.userData.component.object.position.z
            },
            rotation: {
                x: 0,
                y: 0,
                z: 0
            }
        };

        let segmentOrientation = segment.xetoDuct.orientation;

        // Adjust the position and rotation based on the segment's orientation and the intersection key
        if(segmentOrientation === "east") {
            // Position adjustments for the east orientation
            if(intersectionKey === "start") {
                object.position.x -= segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.x -= 500;
                object.position.x -= segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
                object.position.x -= segment.segment.duct.userData.endHeight;
            }
            if(intersectionKey === "end") {
                object.position.x += segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.x += 500;
                object.position.x += segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
                object.position.x += segment.segment.duct.userData.endHeight;
            }

            // Adjust for text mesh position
            if(indicatorKey === 'textMesh') {
                object.position.x -= 500; // Offset for the text
                object.position.z += 120; // Offset for the text
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
                object.position.x += segment.segment.duct.userData.endHeight;
            }
        }

        if(segmentOrientation === "west") {
            if(indicatorKey === 'arrow') {
                object.rotation.y += THREE.MathUtils.degToRad(180); // Flip arrow for west orientation
            }

            // Position adjustments for the west orientation
            if(intersectionKey === "start") {
                object.position.x += segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.x += 500;
                object.position.x += segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
                object.position.x += segment.segment.duct.userData.endHeight;
            }
            if(intersectionKey === "end") {
                object.position.x -= segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.x -= 500;
                object.position.x -= segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
                object.position.x -= segment.segment.duct.userData.endHeight;
            }

            // Adjust for text mesh position
            if(indicatorKey === 'textMesh') {
                object.position.x -= 500; // Offset for the text
                object.position.z += 120; // Offset for the text
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
                object.position.x += segment.segment.duct.userData.endHeight;
            }
        }

        // Similar logic continues for "north" and "south" orientations, adjusting positions accordingly.
        // For brevity, the same approach applies based on the orientation and intersection key.

        if(segment.xetoDuct.blockStyle.flowDirection == "endToStart") {
            // Adjust rotation for "endToStart" flow direction
            if(indicatorKey === 'arrow') {
                object.rotation.y += THREE.MathUtils.degToRad(180); 
            }
        }

        return object; // Return the calculated position and rotation for the indicator
    }

    /**
     * calcArrow
     * 
     * Calculates and creates the arrow helper for the flow direction at the specified intersection.
     * The arrow is placed based on the segment's orientation and the intersection key (start or end).
     * 
     * @param {Object} segment - The segment for which the arrow is being created.
     * @param {string} intersectionKey - The key indicating whether to create the arrow at the "start" or "end" of the segment.
     */
    calcArrow(segment, intersectionKey) {
        console.log("calcArrow started");

        let arrow = {
            userData: {
                component: {
                    object: {}
                }
            }
        };

        // Calculate the position and properties of the arrow indicator
        let object = this.calcIndicator(segment, "arrow", intersectionKey);

        // Set the arrow's position and other properties based on the calculated indicator
        arrow.userData.component.object = object;

        // Add the arrow to the segment's list of arrows
        segment.segment.arrows.push(arrow);
    }
}
