import * as THREE from 'three';

export default class Helpers {
    createFlowHelpers(assemblySegments) {
        console.log("createFlowHelpers started");
        for (const segment of assemblySegments) { // Iterate over each segment.

            if (segment.xetoDuct.blockStyle.helpers &&
                segment.xetoDuct.blockStyle.helpers.arrow && 
                segment.xetoDuct.blockStyle.helpers.arrow.display ||
                segment.xetoDuct.blockStyle.helpers &&
                segment.xetoDuct.blockStyle.helpers.text &&
                segment.xetoDuct.blockStyle.helpers.text.display) {
                console.log("createFlowHelpers segment:", segment);

                const segmentLoc = segment.xetoDuct.graphicLocation; // Get the segment's graphic location.

                const startIntersections = assemblySegments.filter(child => 
                    segmentLoc.start === child.xetoDuct.graphicLocation.start &&
                    segment != child ||
                    segmentLoc.start === child.xetoDuct.graphicLocation.end &&
                    segment != child
                ); // Find intersections at the start of the segment.

                const endIntersections = assemblySegments.filter(child => 
                    segmentLoc.end === child.xetoDuct.graphicLocation.start &&
                    segment != child ||
                    segmentLoc.end === child.xetoDuct.graphicLocation.end &&
                    segment != child
                ); // Find intersections at the end of the segment.

                if (startIntersections.length == 0) { // If no start intersections are found.
                    console.log("createFlowHelpers: 0 starts found");

                    if(segment.xetoDuct.blockStyle.helpers.arrow) {
                        if (segment.xetoDuct.blockStyle.helpers.arrow.display) {
                            this.calcArrow(segment, "start");
                        }
                    }
                    if(segment.xetoDuct.blockStyle.helpers.text) {
                        if (segment.xetoDuct.blockStyle.helpers.text.display) {
                            this.calcTextMesh(segment, "start");                      
                        }
                    }
                }

                if (endIntersections.length == 0) { // If no end intersections are found.
                    console.log("createFlowHelpers: 0 ends found");   

                    if(segment.xetoDuct.blockStyle.helpers.arrow) {
                        if (segment.xetoDuct.blockStyle.helpers.arrow.display) {
                            this.calcArrow(segment, "end");
                        }
                    }
                    if(segment.xetoDuct.blockStyle.helpers.text) {
                        if (segment.xetoDuct.blockStyle.helpers.text.display) {
                            this.calcTextMesh(segment, "end");             
                        }
                    }
                }
            }
        }
    }

    calcTextMesh(segment, intersectionKey) {
        console.log("calcTextMesh started");

        let textMesh = {
            userData: {
                component: {
                    object: {}
                }
            }
        }

        let object = this.calcIndicator(segment, "textMesh", intersectionKey);

        textMesh.userData.component.object.position = object.position;

        segment.segment.textMeshes.push(textMesh);
    }

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
        }

        // let segmentOrientation = this.getOrientation(segment.xetoDuct.graphicLocation.start, segment.xetoDuct.graphicLocation.end);
        let segmentOrientation = segment.xetoDuct.orientation;

        if(segmentOrientation === "east") {

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

            if(indicatorKey == 'textMesh') {
                object.position.x -= 500; // -500 for an offset
                object.position.z += 120; // +120 for an offset
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
                object.position.x += segment.segment.duct.userData.endHeight;
            }
        }

        if(segmentOrientation === "west") {
            if(indicatorKey == 'arrow') {
                object.rotation.y += THREE.MathUtils.degToRad(180); 
            }

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
            
            if(indicatorKey == 'textMesh') {
                object.position.x -= 500; // -500 for an offset
                object.position.z += 120; // +120 for an offset
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
                object.position.x += segment.segment.duct.userData.endHeight;
            }
        } 

        if(segmentOrientation === "north") {
            if(intersectionKey === "start") {
                object.position.z -= segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.z -= 500;
                object.position.z -= segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
                object.position.z -= segment.segment.duct.userData.endHeight;
            }
            if(intersectionKey === "end") {
                object.position.z += segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.z += 500;
                object.position.z += segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
                object.position.z += segment.segment.duct.userData.endHeight;
            }

            object.rotation.y = THREE.MathUtils.degToRad(-90);
            if(indicatorKey == 'textMesh') {
                object.position.x += 100; // +100 for an offset
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
                object.position.x += segment.segment.duct.userData.endHeight;
            }
        }

        if(segmentOrientation === "south") {
            if(intersectionKey === "start") {
                object.position.z += segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.z += 500;
                object.position.z += segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
                object.position.z += segment.segment.duct.userData.endHeight;
            }
            if(intersectionKey === "end") {
                object.position.z -= segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.z -= 500;
                object.position.z -= segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
                object.position.z -= segment.segment.duct.userData.endHeight;
            }

            object.rotation.y = THREE.MathUtils.degToRad(90);
            if(indicatorKey == 'textMesh') {
                object.position.x += 100; // +100 for an offset
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
                object.position.x += segment.segment.duct.userData.endHeight;
            }
        } 

        if(segment.xetoDuct.blockStyle.flowDirection == "endToStart") {
            if(indicatorKey == 'arrow') {
                object.rotation.y += THREE.MathUtils.degToRad(180); 
            }
        }

        return object;
    }

    calcArrow(segment, intersectionKey) {
        console.log("calcArrow started");

        let arrow = {
            userData: {
                component: {
                    object: {}
                }
            }
        }

        let object = this.calcIndicator(segment, "arrow", intersectionKey);

        arrow.userData.component.object = object;

        segment.segment.arrows.push(arrow);
    }
}