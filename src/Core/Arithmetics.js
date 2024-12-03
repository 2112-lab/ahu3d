//////////////////////////////////////////////////////////////////////////////////////
//
//	AHU3D - A Javascript Module for Parametric Design Tool for Air Handling Units.
//
//
//	    LIMITED TEMPORARY LICENSE FOR DEMO PURPOSES ONLY - EXPIRES 2025/01/01
//
//
//		   NOT AUTHORIZED FOR PRODUCTION DEPLOYENT OR REDISTRIBUTION.
//
//
//				PROPERTY OF COGNITIVE DYNAMICS LTD.
//
//
//				    ALL RIGHTS RESERVED - 2024.
//
//////////////////////////////////////////////////////////////////////////////////////

/*
 * Arithmetics.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This class handles the calculation, placement, and orientation of HVAC assembly segments 
 * using the provided component library entries and cleaned assembly data. It ensures that 
 * all segments are correctly aligned, dimensioned, and positioned within the scene.
 * 
 */
/*
 * Arithmetic.js
 * 
 * Author: Caleb Ebers
 * Date: 8/16/2024
 * 
 * This class handles the calculation, placement, and orientation of HVAC assembly segments 
 * using the provided component library entries and cleaned assembly data. It ensures that 
 * all segments are correctly aligned, dimensioned, and positioned within the scene.
 * 
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export default class Arithmetics {
    /**
     * Constructor
     * 
     * Initializes the Arithmetics class with the component library entries and cleaned assembly data.
     * Precalculates the assembly segments and returns them.
     * 
     * @param {Object} componentLibEntries - The library entries for the HVAC components.
     * @returns {Array} The precalculated assembly segments.
     */
    constructor(componentLibEntries, sceneHelper) {
        this.sceneHelper = sceneHelper;
        console.log("componentLibEntries:", componentLibEntries);
        this.componentLibEntries = componentLibEntries; // Store the component library entries.
        this.ductEntry = this.componentLibEntries['LinearDuctSliced']; // Retrieve the duct component from the library.
        this.TJointEntry = this.componentLibEntries['TJointSliced']; // Retrieve the T-Joint component from the library.
        this.LJointEntry = this.componentLibEntries['LJointSliced']; // Retrieve the L-Joint component from the library.
        this.CrossJointEntry = this.componentLibEntries['CrossJointSliced']; // Retrieve the Cross-Joint component from the library.
        this.InsertEndEntry = this.componentLibEntries['InsertEndSliced']; // Retrieve the Insert End component from the library.
        this.CapEndEntry = this.componentLibEntries['CapEndSliced']; // Retrieve the Cap End component from the library.
        this.assemblySegments = []; // Initialize an empty array to store assembly segments.
        this.assemblyDimensions = { width: 0, height: 0 }; // Initialize assembly dimensions.

        // this.joints = new Joints(sceneHelper);

        this.innerDim = {
            small: 500,
            medium: 1000,
            large: 1500
        }

        this.componentScales = {
            small: 0.5,
            medium: 1,
            large: 1.5
        }     

        // const assemblySegments = this.calculateAssembly(); // Precalculate the assembly segments.

        // return assemblySegments; // Return the precalculated segments.
    }

    /**
     * calculateAssembly
     * 
     * Precalculates the assembly by processing ducts, building segments, creating duct ends,
     * placing segments in the scene, and calculating assembly dimensions.
     * 
     * @param {Object} cleanedXeto - The cleaned HVAC assembly data.
     * @returns {Array} The calculated assembly segments.
     */
    async calculateAssembly(cleanedXeto) {

        console.log("calculateAssembly cleanedXeto:", cleanedXeto);

        this.ductsDictionary = cleanedXeto[0];

        delete cleanedXeto[0]

        this.cleanedXeto = cleanedXeto; // Store the cleaned assembly data.
        this.ahuGroup = cleanedXeto.filter(child => child.spec.includes('AhuGroup'))[0];
        this.assemblyGridBounds = this.ahuGroup.graphicLocation; // Get the grid bounds for the AHU group.

        const ductsList = this.cleanedXeto.filter(child => child.spec.includes('DuctEdge')); // Filter the ducts from the cleaned assembly.

        // let primarySegment = this.getPrimaryDuct(ductsList); // Get the primary duct segment.
        let xetoDuctKeys = this.cleanedXeto.filter(child => child.spec.includes('AhuGroup'))[0].ducts; // Retrieve the list of duct keys.

        this.assemblySegments = []; // Initialize the assembly segments array.

        console.log("calculateAssembly this.ductsDictionary:", this.ductsDictionary);

        for (const i in xetoDuctKeys) { // Iterate over each duct key.
            const duct = {
                userData: {
                    component: JSON.parse(JSON.stringify(this.ductEntry)), // Clone the duct component.
                }
            }

            let xetoDuctKey = xetoDuctKeys[i]; // Get the current duct key.

            let xetoDuct = this.cleanedXeto.filter(child => child.id.includes(xetoDuctKey))[0]; // Find the corresponding duct in the assembly.
            
            const segment = await this.buildAssembly(duct, xetoDuct); // Build the assembly segment for the duct.

            this.assemblySegments.push({ xetoDuct: xetoDuct, segment: segment }); // Add the segment to the assembly segments array.
        }

        this.createDuctEnds(); // Create the ends for the ducts.

        const primaryKey = this.getPrimaryKey();

        this.assemblySegments = await this.placeSegments(primaryKey); // Place the segments in the correct positions.

        this.assemblyDimensions = this.getAssemblyDimensions(this.assemblyGridBounds); // Calculate the dimensions of the assembly.

        // for (const segment of this.assemblySegments) { // Iterate over each segment.
        //     this.translateAssemblySegment(segment.segment, 'x', ((this.assemblyDimensions.width / 2) - 50)); // Translate the segment on the x-axis.
        //     this.translateAssemblySegment(segment.segment, 'z', this.assemblyDimensions.height + 200); // Translate the segment on the z-axis.

        //     this.setGuideline(segment);
        // }

        this.determineFlowDirections(this.assemblySegments); // Determine and adjust flow directions for ducts

        this.createFlowIndicators(); // Create arrows for the ducts with open ends.

        // this.locateDuctCorners();

        return this.assemblySegments; // Return the assembly segments.
    }

    getPrimaryKey() {
        for(const key in this.ductsDictionary) {
            if(this.ductsDictionary[key].length == 1) {
                return key;
            }
        }
    }

    setGuideline(segmentBlock) {
        const pos = segmentBlock.segment.duct.userData.component.object.position;
        const length = segmentBlock.segment.duct.userData.component.object.boundingBox.dimensions.x;

        segmentBlock.segment.duct.guideline = null;
        
        if(segmentBlock.segment.duct.isVertical == false) {
            segmentBlock.segment.duct.guideline = {
                start: {
                    x: pos.x - length/2,
                    z: pos.z
                },
                end: {
                    x: pos.x + length/2,
                    z: pos.z
                }
            }
        }
        else {
            segmentBlock.segment.duct.guideline = {
                start: {
                    x: pos.x,
                    z: pos.z - (length/2)
                },
                end: {
                    x: pos.x,
                    z: pos.z + (length/2)
                }
            }
        }
    }

    computeIntersection(line1, line2) {
        // down part of intersection point formula
        let p1 = line1.start
        let p2 = line1.end
        let p3 = line2.start
        let p4 = line2.end
    
        var d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
        var d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
        var d = d1 - d2;
    
        if (d == 0) {
          return this.status = "zero_or_infinity";
        }
    
        // upper part of intersection point formula
        var u1 = p1.x * p2.y - p1.y * p2.x; // (x1 * y2 - y1 * x2)
        var u4 = p3.x * p4.y - p3.y * p4.x; // (x3 * y4 - y3 * x4)
    
        var u2x = p3.x - p4.x; // (x3 - x4)
        var u3x = p1.x - p2.x; // (x1 - x2)
        var u2y = p3.y - p4.y; // (y3 - y4)
        var u3y = p1.y - p2.y; // (y1 - y2)
    
        // intersection point formula
        var px = (u1 * u2x - u3x * u4) / d;
        var py = (u1 * u2y - u3y * u4) / d;
    
        var p = { x: px, y: py };
        this.xPoint.setXY(Number(Number(px).toFixed(2)), Number(Number(py).toFixed(2)))
    
        this.lines.push(line1)
        this.lines.push(line2)
    
        const isIntersection = this.checkLineIntersection(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
    
        if (!isIntersection) {
          return this.status = "no_intersection";
        }
    
        this.status = "computed";
    
        return p;
    }
    
    checkLineIntersection(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
        var denominator = (p4y - p3y) * (p2x - p1x) - (p4x - p3x) * (p2y - p1y);
        if (denominator == 0) {
            return false;
        }
    
        var ua = ((p4x - p3x) * (p1y - p3y) - (p4y - p3y) * (p1x - p3x)) / denominator;
        var ub = ((p2x - p1x) * (p1y - p3y) - (p2y - p1y) * (p1x - p3x)) / denominator;
    
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return true;
        }
        return false;
    }

    /**
     * getPrimaryDuct
     * 
     * Identifies the primary duct in a list of ducts based on intersection analysis.
     * 
     * @param {Array} ductsList - List of all ducts in the assembly.
     * @returns {Object} The primary duct.
     */
    getPrimaryDuct(ductsList) {
        for (const duct of ductsList) { // Iterate over each duct.
            const startIntersections = ductsList.filter(child => 
                duct.graphicLocation.start === child.graphicLocation.start &&
                duct != child ||
                duct.graphicLocation.start === child.graphicLocation.end &&
                duct != child
            ); // Find intersections at the start of the duct.

            const endIntersections = ductsList.filter(child => 
                duct.graphicLocation.end === child.graphicLocation.start &&
                duct != child ||
                duct.graphicLocation.end === child.graphicLocation.end &&
                duct != child
            ); // Find intersections at the end of the duct.

            if (startIntersections.length == 0 || endIntersections.length == 0) { // If no intersections are found at either end.
                console.log("getPrimaryDuct returning duct:", duct); // Log the selected primary duct.
                return duct; // Return the primary duct.
            }
        }
    }

    /**
     * createDuctEnds
     * 
     * Creates the necessary duct ends based on the segment's orientation and style,
     * and positions them correctly within the assembly.
     */
    createDuctEnds() {
        console.log("createDuctEnds started");
        for (const segment of this.assemblySegments) { // Iterate over each segment.

            if (segment.xetoDuct.blockStyle.ductEnds != 'none') { // Check if the segment has defined duct ends.

                const segmentLoc = segment.xetoDuct.graphicLocation; // Get the segment's graphic location.

                const startIntersections = this.assemblySegments.filter(child => 
                    segmentLoc.start === child.xetoDuct.graphicLocation.start &&
                    segment != child ||
                    segmentLoc.start === child.xetoDuct.graphicLocation.end &&
                    segment != child
                ); // Find intersections at the start of the segment.

                const endIntersections = this.assemblySegments.filter(child => 
                    segmentLoc.end === child.xetoDuct.graphicLocation.start &&
                    segment != child ||
                    segmentLoc.end === child.xetoDuct.graphicLocation.end &&
                    segment != child
                ); // Find intersections at the end of the segment.

                if (startIntersections.length == 0) { // If no start intersections are found.

                    if (segment.xetoDuct.blockStyle.ductEnds == 'insert' || segment.xetoDuct.blockStyle.ductEnds == 'cap') {
                        segment.segment.ends.unshift({
                            userData: {
                                component: segment.xetoDuct.blockStyle.ductEnds == 'insert' ? 
                                    JSON.parse(JSON.stringify(this.InsertEndEntry)) : // Clone and add the Insert End component.
                                    JSON.parse(JSON.stringify(this.CapEndEntry)) // Clone and add the Cap End component.
                            }
                        });
                    }

                    if (segment.xetoDuct.blockStyle.ductEnds == 'cap') {
                        console.log("Arithmetic createDuctEnds segment:", segment);
                    }

                    // let segmentOrientation = this.getOrientation(segment.xetoDuct.graphicLocation.start, segment.xetoDuct.graphicLocation.end); // Determine the segment's orientation.
                    let segmentOrientation = segment.xetoDuct.orientation // Determine the segment's orientation.
                    
                    let translationVector = -1; // Initialize the translation vector.

                    if (segmentOrientation == 'west') { // If the segment is oriented west.
                        translationVector = 2;
                        segment.segment.ends[0].userData.component.object.position.x -= 100;
                        segment.segment.ends[0].userData.component.object.rotation.y = THREE.MathUtils.degToRad(180); // Rotate the end component 180 degrees.
                    } else if (segmentOrientation == 'east') {
                        translationVector = -2;
                        segment.segment.ends[0].userData.component.object.position.x += 100;
                        // segment.segment.ends[0].userData.component.object.rotation.y = THREE.MathUtils.degToRad(0); // Rotate the end component 180 degrees.
                    } else if (segmentOrientation == 'north') {
                        translationVector = -1;
                        segment.segment.ends[0].userData.component.object.rotation.y = THREE.MathUtils.degToRad(0); // Rotate the end component 90 degrees.
                    } else if (segmentOrientation == 'south') {
                        translationVector = 1;
                        segment.segment.ends[0].userData.component.object.rotation.y = THREE.MathUtils.degToRad(180); // Rotate the end component 90 degrees.
                    }

                    let ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / 2 * translationVector; // Calculate the half-length of the duct.
                    segment.segment.ends[0].userData.component.object.position.x += ductHalfLength; // Adjust the position of the end component.

                    let endHalfLength = segment.segment.ends[0].userData.component.object.boundingBox.dimensions.x / 2 * translationVector; // Calculate the half-length of the end component.
                    segment.segment.ends[0].userData.component.object.position.x += endHalfLength; // Adjust the position of the end component.
                }

                if (endIntersections.length == 0) { // If no end intersections are found.

                    if (segment.xetoDuct.blockStyle.ductEnds == 'insert' || segment.xetoDuct.blockStyle.ductEnds == 'cap') {
                        segment.segment.ends.unshift({
                            userData: {
                                component: segment.xetoDuct.blockStyle.ductEnds == 'insert' ? 
                                    JSON.parse(JSON.stringify(this.InsertEndEntry)) : // Clone and add the Insert End component.
                                    JSON.parse(JSON.stringify(this.CapEndEntry)) // Clone and add the Cap End component.
                            }
                        });
                    }

                    // let segmentOrientation = this.getOrientation(segment.xetoDuct.graphicLocation.start, segment.xetoDuct.graphicLocation.end); // Determine the segment's orientation.
                    let segmentOrientation = segment.xetoDuct.orientation // Determine the segment's orientation.
                    
                    let translationVector = -1; // Initialize the translation vector.

                    if (segmentOrientation == 'west') { // If the segment is oriented west.
                        segment.segment.ends[0].userData.component.object.rotation.y = THREE.MathUtils.degToRad(0); // Set the rotation of the end component.
                    } else if (segmentOrientation == 'east') {
                        translationVector = 1;
                        segment.segment.ends[0].userData.component.object.rotation.y += THREE.MathUtils.degToRad(180); // Rotate the end component 180 degrees.
                    } else if (segmentOrientation == 'north') {
                        translationVector = 1;
                        segment.segment.ends[0].userData.component.object.rotation.y = THREE.MathUtils.degToRad(180); // Rotate the end component 90 degrees.
                    } else if (segmentOrientation == 'south') {
                        translationVector = -1;
                        segment.segment.ends[0].userData.component.object.rotation.y = THREE.MathUtils.degToRad(0); // Rotate the end component 90 degrees.
                    }

                    let ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / 2 * translationVector; // Calculate the half-length of the duct.
                    segment.segment.ends[0].userData.component.object.position.x += ductHalfLength; // Adjust the position of the end component.

                    let endHalfLength = segment.segment.ends[0].userData.component.object.boundingBox.dimensions.x / 2 * translationVector; // Calculate the half-length of the end component.
                    segment.segment.ends[0].userData.component.object.position.x += endHalfLength; // Adjust the position of the end component.
                }
            }
        }
    }

    createFlowIndicators() {
        console.log("createFlowIndicators started");
        for (const segment of this.assemblySegments) { // Iterate over each segment.

            if (segment.xetoDuct.blockStyle.helpers &&
                segment.xetoDuct.blockStyle.helpers.arrow && 
                segment.xetoDuct.blockStyle.helpers.arrow.display ||
                segment.xetoDuct.blockStyle.helpers &&
                segment.xetoDuct.blockStyle.helpers.text &&
                segment.xetoDuct.blockStyle.helpers.text.display) {
                console.log("createFlowIndicators segment:", segment);

                const segmentLoc = segment.xetoDuct.graphicLocation; // Get the segment's graphic location.

                const startIntersections = this.assemblySegments.filter(child => 
                    segmentLoc.start === child.xetoDuct.graphicLocation.start &&
                    segment != child ||
                    segmentLoc.start === child.xetoDuct.graphicLocation.end &&
                    segment != child
                ); // Find intersections at the start of the segment.

                const endIntersections = this.assemblySegments.filter(child => 
                    segmentLoc.end === child.xetoDuct.graphicLocation.start &&
                    segment != child ||
                    segmentLoc.end === child.xetoDuct.graphicLocation.end &&
                    segment != child
                ); // Find intersections at the end of the segment.

                if (startIntersections.length == 0) { // If no start intersections are found.
                    console.log("createFlowIndicators: 0 starts found");

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
                    console.log("createFlowIndicators: 0 ends found");   

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
        
        console.log("createFlowIndicators segmentOrientation:", segmentOrientation);

        if(segmentOrientation === "east") {

            if(intersectionKey === "start") {
                object.position.x -= segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.x -= 500;
                object.position.x -= segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
            }
            if(intersectionKey === "end") {
                object.position.x += segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.x += 500;
                object.position.x += segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
            }

            if(indicatorKey == 'textMesh') {
                object.position.x -= 500; // -500 for an offset
                object.position.z += 120; // +120 for an offset
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
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
            }
            if(intersectionKey === "end") {
                object.position.x -= segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.x -= 500;
                object.position.x -= segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
            }
            
            if(indicatorKey == 'textMesh') {
                object.position.x -= 500; // -500 for an offset
                object.position.z += 120; // +120 for an offset
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
            }
        } 

        if(segmentOrientation === "north") {
            if(intersectionKey === "start") {
                object.position.z -= segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.z -= 500;
                object.position.z -= segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
            }
            if(intersectionKey === "end") {
                object.position.z += segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.z += 500;
                object.position.z += segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
            }

            object.rotation.y = THREE.MathUtils.degToRad(-90);
            if(indicatorKey == 'textMesh') {
                object.position.x += 100; // +100 for an offset
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
            }
        }

        if(segmentOrientation === "south") {
            if(intersectionKey === "start") {
                object.position.z += segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.z += 500;
                object.position.z += segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
            }
            if(intersectionKey === "end") {
                object.position.z -= segment.segment.duct.userData.component.object.boundingBox.dimensions.x / 2;
                object.position.z -= 500;
                object.position.z -= segment.xetoDuct.blockStyle.helpers.arrow.padding || 0;
            }

            object.rotation.y = THREE.MathUtils.degToRad(90);
            if(indicatorKey == 'textMesh') {
                object.position.x += 100; // +100 for an offset
                object.position.x += segment.xetoDuct.blockStyle.helpers.text.padding || 0;
            }
        } 

        if(segment.xetoDuct.blockStyle.flowDirection == "endToStart") {
            if(indicatorKey == 'arrow') {
                object.rotation.y += THREE.MathUtils.degToRad(180); 
            }
        }

        return object;
    }

    /**
     * buildAssembly
     * 
     * Builds an assembly segment by loading component meshes, positioning them, and 
     * calculating the required duct length and positioning of components within the duct.
     * 
     * @param {Object} duct - The duct to build the assembly within.
     * @param {Array} components - The components to be included in the assembly.
     * @returns {Object} The built assembly segment containing the duct and its components.
     */
    async buildAssembly(duct, xetoDuct) {
        console.log("buildAssembly started:", duct, xetoDuct);

        let components = xetoDuct.components; 

        if (xetoDuct.blockStyle.flowDirection == 'endToStart') {
            components.reverse();
        }

        console.log("xetoDuct:", xetoDuct);

        // const size = this.innerDim[xetoDuct.graphicLocation.size];
        const size = 1000;

        duct.userData.component.object.boundingBox.dimensions.x = size;
        duct.userData.component.object.boundingBox.dimensions.y = size + 30;
        duct.userData.component.object.boundingBox.dimensions.z = size + 60;

        const ductDimensions = {
            x: duct.userData.component.object.boundingBox.dimensions.x, // Get the duct's x-dimension.
            y: duct.userData.component.object.boundingBox.dimensions.y, // Get the duct's y-dimension.
            z: duct.userData.component.object.boundingBox.dimensions.z  // Get the duct's z-dimension.
        };

        try {
            const meshes = await this.loadAssemblyMeshes(components); // Load the component meshes for the assembly.

            if(meshes.length > 0) {
                for (const i in meshes) { // Iterate over each mesh.
                    meshes[i].userData.component.object.position.z = ductDimensions.z / 2; // Position the mesh along the z-axis.
                    meshes[i].userData.component.object.position.x = 0; // Reset the x-position of the mesh.
                    meshes[i].userData.component.object.position.y = 0; // Reset the y-position of the mesh.
                }
            }
            
            const componentScale = this.componentScales[xetoDuct.graphicLocation.size];
            for (const mesh of meshes) {
                mesh.userData.component.object.scale.x *= componentScale;
                mesh.userData.component.object.scale.y *= componentScale;
                mesh.userData.component.object.scale.z *= componentScale;

                mesh.userData.component.object.boundingBox.dimensions.x *= componentScale;
                mesh.userData.component.object.boundingBox.dimensions.y *= componentScale;
                mesh.userData.component.object.boundingBox.dimensions.z *= componentScale;
            }

            let component_span = 0; // Initialize the component span.
            for (const mesh of meshes) { // Iterate over each mesh.
                component_span += mesh.userData.xeto.blockStyle.componentPadding.startSpace; // Add the start padding of the component.
                component_span += mesh.userData.component.object.boundingBox.dimensions.x; // Add the x-dimension of the component.
                component_span += mesh.userData.xeto.blockStyle.componentPadding.endSpace; // Add the end padding of the component.
            }

            let attributes = duct.userData.component.attributes; // Get the attributes of the duct.
            attributes.length.value = Math.max(component_span, duct.userData.component.object.boundingBox.dimensions.x); // Set the length of the duct based on the component span.
            console.log("arithmetic duct:", duct);

            if(xetoDuct.graphicLocation.size == undefined) {
                xetoDuct.graphicLocation.size = "medium"
            }

            const innerDimension = this.innerDim[xetoDuct.graphicLocation.size];
            if(innerDimension == null) {
                alert(`Duct ${xetoDuct.id}'s size (${xetoDuct.graphicLocation.size}) is not valid.`)
            }
            let ductSize = innerDimension;  

            duct.userData.component.object.scale.x = attributes.length.value / ductSize; // Scale the duct's x-dimension.
            duct.userData.component.object.boundingBox.dimensions.x = attributes.length.value; // Update the duct's bounding box x-dimension.

            duct.userData.component.object.innerDimensions = xetoDuct.isVertical ? 
                {
                    x: (duct.userData.component.object.boundingBox.dimensions.z - 60) * componentScale, 
                    y: duct.userData.component.object.boundingBox.dimensions.y, 
                    z: (duct.userData.component.object.boundingBox.dimensions.x + 30)
                } 
                    :
                {
                    x: (duct.userData.component.object.boundingBox.dimensions.x + 30), 
                    y: duct.userData.component.object.boundingBox.dimensions.y, 
                    z: (duct.userData.component.object.boundingBox.dimensions.z - 60) * componentScale
                };
            
            const ductPosX = duct.userData.component.object.position.x; // Get the duct's current x-position.
            const ductWidth = duct.userData.component.object.boundingBox.dimensions.x; // Get the duct's width.

            let primaryComponentStartSpace = 0; // Get the start padding of the primary component.
            let primaryComponentWidth = 0; // Get the width of the primary component.
            let primaryComponentPosition = 0; // Calculate the primary component's position.
            if(meshes.length > 0) {
                primaryComponentStartSpace = meshes[0].userData.xeto.blockStyle.componentPadding.startSpace;
                primaryComponentWidth = meshes[0].userData.component.object.boundingBox.dimensions.x;
                primaryComponentPosition = ductPosX - (ductWidth / 2) + (primaryComponentWidth / 2) + primaryComponentStartSpace;
            }
            

            for (const mesh of meshes) { // Iterate over each mesh.
                mesh.userData.component.object.position.x = primaryComponentPosition; // Set the x-position of the component.
            }

            for (let i = 1; i < meshes.length; i++) { // Iterate over each mesh starting from the second.
                const prevComponentHalfWidth = meshes[i-1].userData.component.object.boundingBox.dimensions.x / 2; // Get the previous component's half-width.
                const prevComponentEndSpace = meshes[i-1].userData.xeto.blockStyle.componentPadding.endSpace; // Get the previous component's end padding.
                const componentHalfWidth = meshes[i].userData.component.object.boundingBox.dimensions.x / 2; // Get the current component's half-width.
                const componentStartSpace = meshes[i].userData.xeto.blockStyle.componentPadding.startSpace; // Get the current component's start padding.
                for (let j = i; j < meshes.length; j++) { // Adjust the position of all subsequent components.
                    meshes[j].userData.component.object.position.x += prevComponentHalfWidth + prevComponentEndSpace + componentHalfWidth + componentStartSpace;
                }
            }

            for (let mesh of meshes) {

                if (mesh.userData.xeto.blockStyle.flowDirection == 'endToStart') {
                    this.flipMesh(mesh); // Flip the mesh by applying negative scale to the x-axis.
                }

                if(mesh.userData.xeto.blockStyle.componentPosition != undefined) {
                    const ductHalfHeight = duct.userData.component.object.boundingBox.dimensions.z / 2;
                    const componentQuarterHeight = mesh.userData.component.object.boundingBox.dimensions.z / 4;
                    if(mesh.userData.xeto.blockStyle.componentPosition == 'ceiling') {
                        mesh.userData.component.object.position.z += ductHalfHeight - componentQuarterHeight;
                        if(mesh.userData.xeto.blockStyle.componentFacing == 'outwards') {
                            mesh.userData.component.object.rotation.y += THREE.MathUtils.degToRad(180);
                            mesh.userData.component.object.position.z += componentQuarterHeight * 2;
                        }                        
                    }
                    else if(mesh.userData.xeto.blockStyle.componentPosition == 'floor') {
                        if(mesh.userData.xeto.blockStyle.componentFacing == 'inwards') {
                            mesh.userData.component.object.rotation.y += THREE.MathUtils.degToRad(180);
                            mesh.userData.component.object.position.z += componentQuarterHeight * 2;
                        }
                        mesh.userData.component.object.position.z -= ductHalfHeight + componentQuarterHeight;
                    }
                }
                
            }

            // console.log("buildAssembly duct:", duct.userData.component.object.position.z);

            return { duct: duct, meshes: meshes, joints: [], ends: [], arrows: [], textMeshes: [] }; // Return the built assembly segment.
        } 
        catch (error) {
            console.error("Error in buildAssembly:", error); // Log any errors that occur during the build process.
            throw error; // Re-throw the error for further handling.
        }
    }

    /**
     * loadAssemblyMeshes
     * 
     * Loads the component meshes for the given components and returns them.
     * 
     * @param {Array} components - The components to load meshes for.
     * @returns {Promise<Array>} A promise that resolves to the loaded meshes.
     */
    async loadAssemblyMeshes(components) {
        const xetoComponents = this.cleanedXeto.filter(child => child.spec.includes('Component')); // Filter the components from the cleaned assembly.

        let meshes = []; // Initialize an empty array for the meshes.
        for (const componentId of components) { // Iterate over each component ID.
            const componentBlock = JSON.parse(JSON.stringify(
                xetoComponents.filter( child => child.id === componentId )[0]
            )); // Clone the component block.
            const componentBlockId = componentBlock.componentId.split("r:novo.graphics::")[1];
            const libEntry = JSON.parse(JSON.stringify(
                this.componentLibEntries[componentBlockId]
            )); // Clone the corresponding library entry.
            libEntry.componentId = componentId;
            meshes.unshift({
                userData: {
                    component: libEntry, // Add the library entry to the user data.
                    xeto: componentBlock // Add the component block to the user data.
                }
            });
        }
        return Promise.all(meshes); // Return a promise that resolves to the loaded meshes.
    }

    /**
     * locateDuctCorners
     * 
     * Identifies the four corners of a duct based on its position and dimensions.
     * 
     * @param {Object} duct - The duct object containing position and size information.
     * @returns {Array} An array of corner positions for the duct.
     */
    locateDuctCorners() {
        console.log("locateDuctCorners this.assemblySegments:", this.assemblySegments);
    
        for (const duct of this.assemblySegments) {
            const ductObject = duct.segment.duct.userData.component.object;
            let { x, y, z } = ductObject.innerDimensions;
            const pos = ductObject.position;
        
            // Calculate the half-dimensions based on the (potentially swapped) orientation
            const halfWidth = x / 2;
            const halfDepth = y / 2;
            const halfHeight = z / 2;
        
            // Define the eight corners based on the center position and dimensions
            duct.boundaryCorners = [
                { x: (pos.x - halfWidth), y: pos.y - halfDepth, z: pos.z - halfHeight },
                { x: (pos.x + halfWidth), y: pos.y - halfDepth, z: pos.z - halfHeight },
                { x: (pos.x - halfWidth), y: pos.y + halfDepth, z: pos.z - halfHeight },
                { x: (pos.x + halfWidth), y: pos.y + halfDepth, z: pos.z - halfHeight },
                { x: (pos.x - halfWidth), y: pos.y - halfDepth, z: pos.z + halfHeight },
                { x: (pos.x + halfWidth), y: pos.y - halfDepth, z: pos.z + halfHeight },
                { x: (pos.x - halfWidth), y: pos.y + halfDepth, z: pos.z + halfHeight },
                { x: (pos.x + halfWidth), y: pos.y + halfDepth, z: pos.z + halfHeight }
            ];
        
            // console.log("locateDuctCorners duct.boundaryCorners:", duct.boundaryCorners);
        }

        this.indicateCorners(this.assemblySegments[0].boundaryCorners);
        this.indicateCorners(this.assemblySegments[1].boundaryCorners);
        this.indicateCorners(this.assemblySegments[2].boundaryCorners);
        this.indicateCorners(this.assemblySegments[3].boundaryCorners);     

        const closestEdges1 = this.findclosestEdges(this.assemblySegments[0].boundaryCorners, this.assemblySegments[1].boundaryCorners);
        this.indicateEdge(closestEdges1.duct1Edge);
        this.indicateEdge(closestEdges1.duct2Edge);

        const closestEdges2 = this.findclosestEdges(this.assemblySegments[1].boundaryCorners, this.assemblySegments[2].boundaryCorners);
        this.indicateEdge(closestEdges2.duct1Edge);
        this.indicateEdge(closestEdges2.duct2Edge);

        const closestEdges3 = this.findclosestEdges(this.assemblySegments[2].boundaryCorners, this.assemblySegments[3].boundaryCorners);
        this.indicateEdge(closestEdges3.duct1Edge);
        this.indicateEdge(closestEdges3.duct2Edge);

        const closestEdges4 = this.findclosestEdges(this.assemblySegments[3].boundaryCorners, this.assemblySegments[0].boundaryCorners);
        this.indicateEdge(closestEdges4.duct1Edge);
        this.indicateEdge(closestEdges4.duct2Edge);

        console.log("locateDuctCorners closestEdges1:", JSON.stringify(closestEdges1, null, 2));
        console.log("locateDuctCorners closestEdges2:", JSON.stringify(closestEdges2, null, 2));
        console.log("locateDuctCorners closestEdges3:", JSON.stringify(closestEdges3, null, 2));
        console.log("locateDuctCorners closestEdges4:", JSON.stringify(closestEdges4, null, 2));

        const closestEdgeCollection = [closestEdges1, closestEdges2, closestEdges3, closestEdges4];
        this.renderJointCorners(closestEdgeCollection, areHelpersOn);
    }

    /**
     * renderJointCorners
     * 
     * Computes the corner positions for a given joint, considering its placement and orientation.
     * 
     * @param {Object} joint - The joint object containing position and orientation details.
     * @returns {Array} An array of corner positions for the joint.
     */
    renderJointCorners(closestEdgeCollection, areHelpersOn) {
        console.log("renderJointCorners started");
        if(areHelpersOn) {
            let i = 0;
            let j = 1;
            for(const edgePair of closestEdgeCollection) {
                const material1 = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
                const material2 = new THREE.MeshStandardMaterial({ color: 0xff00ff });
                const material3 = new THREE.MeshStandardMaterial({ color: 0x00ffff });
                const material4 = new THREE.MeshStandardMaterial({ color: 0xffff00 });
                
                const cubeGeometry1 = new THREE.BoxGeometry(
                    60, 60, 60
                );
                const cube1 = new THREE.Mesh(cubeGeometry1, material1);
                cube1.position.x = edgePair.duct1Edge.x;
                cube1.position.y = this.innerDim[this.assemblySegments[i].xetoDuct.graphicLocation.size]/2;
                cube1.position.z = edgePair.duct1Edge.z;
                cube1.name = "jointHelperVertices";
                this.sceneHelper.addToScene(cube1);

                const cubeGeometry2 = new THREE.BoxGeometry(
                    60, 60, 60
                );
                const cube2 = new THREE.Mesh(cubeGeometry2, material2);
                cube2.position.x = edgePair.duct2Edge.x;
                cube2.position.y = this.innerDim[this.assemblySegments[j].xetoDuct.graphicLocation.size]/2;
                cube2.position.z = edgePair.duct2Edge.z;
                cube2.name = "jointHelperVertices";
                this.sceneHelper.addToScene(cube2);
                
                const cubeGeometry3 = new THREE.BoxGeometry(
                    60, 60, 60
                );
                const cube3 = new THREE.Mesh(cubeGeometry3, material3);
                cube3.position.x = edgePair.duct1Edge.x;
                cube3.position.y = this.innerDim[this.assemblySegments[i].xetoDuct.graphicLocation.size]/-2;
                cube3.position.z = edgePair.duct1Edge.z;
                cube3.name = "jointHelperVertices";
                this.sceneHelper.addToScene(cube3);

                const cubeGeometry4 = new THREE.BoxGeometry(
                    60, 60, 60
                );
                const cube4 = new THREE.Mesh(cubeGeometry4, material4);
                cube4.position.x = edgePair.duct2Edge.x;
                cube4.position.y = this.innerDim[this.assemblySegments[j].xetoDuct.graphicLocation.size]/-2;
                cube4.position.z = edgePair.duct2Edge.z;
                cube4.name = "jointHelperVertices";
                this.sceneHelper.addToScene(cube4);

                i++;
                j++;
                if(j == 4) {
                    j = 0;
                }
            }
        }
        
    }

    /**
     * indicateEdge
     * 
     * Highlights or marks a specific edge of a segment for visual representation or further processing.
     * 
     * @param {Object} segment - The segment object containing edge information.
     * @param {String} edge - The specific edge to indicate (e.g., "left", "right").
     */
    indicateEdge(ductCorner) {
        // const cubeGeometry = new THREE.BoxGeometry(
        //     60, 60, 60
        // );
        // const material = new THREE.MeshStandardMaterial({ color: 0x0000ff, wireframe: false });
        // const cube = new THREE.Mesh(cubeGeometry, material);
        // cube.position.x = ductCorner.x;
        // cube.position.z = ductCorner.z;
        // this.sceneHelper.addToScene(cube);
    }

    /**
     * indicateCorners
     * 
     * Marks or highlights the corners of a segment for visual representation or debugging.
     * 
     * @param {Object} segment - The segment object containing corner positions.
     */
    indicateCorners(boundaryCorners) {
        for(const corner of boundaryCorners) {
            const cubeGeometry = new THREE.BoxGeometry(
                60, 60, 60
            );
            const material = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: false });
            const cube = new THREE.Mesh(cubeGeometry, material);
            cube.position.x = corner.x;
            cube.position.z = corner.z;
            // this.sceneHelper.addToScene(cube);
        }
    }

    /**
     * findClosestEdges
     * 
     * Finds and returns the edges of a segment that are closest to a given reference point or segment.
     * 
     * @param {Object} segment - The segment to analyze for closest edges.
     * @param {Object} reference - The reference point or segment for comparison.
     * @returns {Array} An array of the closest edge positions.
     */
    findclosestEdges(duct1, duct2) {
        let minDistance = Infinity;
        let closestPair = {};
    
        duct1.forEach(corner1 => {
            duct2.forEach(corner2 => {
                // Calculate the Euclidean distance between corner1 and corner2
                const distance = Math.sqrt(
                    Math.pow(corner1.x - corner2.x, 2) +
                    Math.pow(corner1.y - corner2.y, 2) +
                    Math.pow(corner1.z - corner2.z, 2)
                );
    
                // Check if this is the smallest distance found so far
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPair = { duct1Edge: corner1, duct2Edge: corner2 };
                }
            });
        });
    
        return closestPair;
    }

    /**
     * relativePlacement
     * 
     * Determines the relative placement of one segment with respect to another, 
     * indicating if it is to the left, right, above, or below.
     * 
     * @param {Object} segmentA - The first segment.
     * @param {Object} segmentB - The second segment for comparison.
     * @returns {String} The relative placement (e.g., "left", "right", "above", "below").
     */
    relativePlacement(diffPoint, xetoDuct) {
        console.log("relativePlacement diffPoint:", diffPoint);
        console.log("relativePlacement xetoDuct:", xetoDuct);
    }

    /**
     * getSegmentDirection
     * 
     * Determines the direction of a segment based on its start and end positions.
     * 
     * @param {Object} segment - The segment object containing start and end positions.
     * @returns {String} The direction of the segment (e.g., "north", "south", "east", "west").
     */
    getSegmentDirection(queriedSegment, key) {
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
    seperateByDirections(intersectSegments, adjacentSegment, currentSegments) {
        for(const currentSegment of currentSegments) {
            intersectSegments[currentSegment.relativePosition] = currentSegment;
        }
        intersectSegments[adjacentSegment.relativePosition] = adjacentSegment;
    }

    /**
     * placeSegments
     * 
     * Places assembly segments in the correct position and orientation based on their relationship 
     * to the primary segment and other segments in the assembly.
     * 
     * @returns {Array} The placed assembly segments.
     */
    async placeSegments(primaryKey) {
        console.log("placeSegments this.assemblySegments:", this.assemblySegments);
        console.log("placeSegments this.ductsDictionary:", this.ductsDictionary);

        const primarySegmentXeto = this.ductsDictionary[primaryKey][0];

        let primarySegment = this.assemblySegments.filter(child => 
            child.xetoDuct.id === primarySegmentXeto.id
        )[0];

        console.log("placeSegments primaryKey:", primaryKey);
        console.log("placeSegments primarySegment:", primarySegment);

        let primarySegmentOrientation = primarySegment.xetoDuct.orientation;
        this.orientAssemblySegment(primarySegment.segment, primarySegmentOrientation);
        primarySegmentXeto.isPositioned = true;

        this.getNextSegment(primarySegmentXeto, primaryKey);     

        return this.assemblySegments; // Return the placed assembly segments.  
    }

    /**
     * getNextSegment
     * 
     * Retrieves the next segment in a sequence based on the current segment's direction and placement.
     * 
     * @param {Object} currentSegment - The current segment in the sequence.
     * @returns {Object} The next segment in the sequence.
     */
    getNextSegment(currentSegmentXeto, currentKey) {
        console.log("getNextSegment currentKey:", currentKey);

        const graphicLocation = currentSegmentXeto.graphicLocation;
        let nextKey = currentKey == graphicLocation.start ? graphicLocation.end : graphicLocation.start;
        console.log("getNextSegment nextKey:", nextKey);

        if(this.ductsDictionary[nextKey].length > 1) {
            for(const adjacentSegmentXeto of this.ductsDictionary[nextKey]) {
                if(adjacentSegmentXeto != currentSegmentXeto) {
                    if(adjacentSegmentXeto.isPositioned != true) {
                        this.placeIntersection(nextKey);
                    }
                    this.getNextSegment(adjacentSegmentXeto, nextKey);
                }
            }
        }
        
    }  

    /**
     * placeIntersection
     * 
     * Places an intersection component at the point where two segments intersect, adjusting for orientation.
     * 
     * @param {Object} segmentA - The first intersecting segment.
     * @param {Object} segmentB - The second intersecting segment.
     * @returns {Object} The intersection component placed at the intersection point.
     */
    placeIntersection(key) {
        console.log("placeIntersection started");

        const jointBlockStyle = this.ahuGroup.blockStyle.joints;

        let xzJointPadding = this.ahuGroup.blockStyle.joints.XZ.padding;
        const xzJointDirection = this.ahuGroup.blockStyle.joints.XZ.direction;
        const xzJointContext = this.ahuGroup.blockStyle.joints.XZ.context;

        if(this.ductsDictionary[key].length == 4) {
            console.log("placeIntersection 4*");

            let currentSegments = this.assemblySegments.filter(child => 
                child.xetoDuct.id === this.ductsDictionary[key][0].id ||
                child.xetoDuct.id === this.ductsDictionary[key][1].id ||
                child.xetoDuct.id === this.ductsDictionary[key][2].id ||
                child.xetoDuct.id === this.ductsDictionary[key][3].id
            );
            
            let fixedSegment = null;
            for(const i in currentSegments) {
                
                if(currentSegments[i].xetoDuct.isPositioned) {
                    fixedSegment = currentSegments[i];
                    currentSegments.splice(i, 1);
                    break;
                }
            }
            this.getSegmentDirection(fixedSegment, key);
            console.log("placeIntersection 4* fixedSegment:", fixedSegment);

            let intersectSegments = {
                up: null, 
                down: null,
                left: null, 
                right: null
            }

            for(const currentSegment of currentSegments) {
                this.getSegmentDirection(currentSegment, key);
                console.log("placeIntersection 4* currentSegment:", currentSegment);
            }

            this.seperateByDirections(intersectSegments, fixedSegment, currentSegments);
            console.log("placeIntersection 4* intersectSegments:", intersectSegments);

            if(intersectSegments.up.xetoDuct.isPositioned != true) {
                let currentSegmentOrientation = intersectSegments.up.xetoDuct.orientation;
                this.orientAssemblySegment(intersectSegments.up.segment, currentSegmentOrientation);
            }
            if(intersectSegments.down.xetoDuct.isPositioned != true) {
                let currentSegmentOrientation = intersectSegments.down.xetoDuct.orientation;
                this.orientAssemblySegment(intersectSegments.down.segment, currentSegmentOrientation);
            }

            for(const currentSegment of currentSegments) {
                console.log("placeIntersection 4* currentSegment:", currentSegment);
                let lengthToAdjacent = 0;
                lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.x - currentSegment.segment.duct.userData.component.object.position.x;
                this.translateAssemblySegment(currentSegment.segment, 'x', lengthToAdjacent);
                lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.z - currentSegment.segment.duct.userData.component.object.position.z;
                this.translateAssemblySegment(currentSegment.segment, 'z', lengthToAdjacent);
            }

            const upSize = intersectSegments.up.xetoDuct.graphicLocation.size;
            const downSize = intersectSegments.down.xetoDuct.graphicLocation.size;
            const leftSize = intersectSegments.left.xetoDuct.graphicLocation.size;
            const rightSize = intersectSegments.right.xetoDuct.graphicLocation.size;
            let maxHalfWidth = this.innerDim[upSize] > this.innerDim[downSize] ? this.innerDim[upSize] / 2 : this.innerDim[downSize] / 2;
            let maxHalfHeight = this.innerDim[rightSize] > this.innerDim[leftSize] ? this.innerDim[rightSize] / 2 : this.innerDim[leftSize] / 2;

            if(intersectSegments.left == fixedSegment) {
                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.up.segment, "x", (length * 1));

                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.down.segment, "x", (length * 1));

                length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth * 2 + 30;
                length += xzJointPadding * 2;
                this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
            }
            else if(intersectSegments.right == fixedSegment) {
                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.up.segment, "x", (length * -1));

                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.down.segment, "x", (length * -1));

                length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth * 2 + 30;
                length += xzJointPadding * 2;
                this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
            }
            else if(intersectSegments.up == fixedSegment) {
                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight * 2 + 30;
                length += xzJointPadding * 2;
                this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.left.segment, "z", (length * -1));

                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));

                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.right.segment, "z", (length * -1));

                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
            }
            else if(intersectSegments.down == fixedSegment) {
                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight * 2 + 30;
                length += xzJointPadding * 2;
                this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.left.segment, "z", (length * 1));

                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));

                length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.right.segment, "z", (length * 1));

                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
            }
              
            const largestGlobalSize = this.createJointProxies(intersectSegments, null, jointBlockStyle);
            this.createOrthogonalCrossJoint(intersectSegments, xzJointDirection, largestGlobalSize);
            

        }
        else if (this.ductsDictionary[key].length == 3) {
            console.log("placeIntersection length 3");
    
            let currentSegments = this.assemblySegments.filter(child => 
                child.xetoDuct.id === this.ductsDictionary[key][0].id ||
                child.xetoDuct.id === this.ductsDictionary[key][1].id ||
                child.xetoDuct.id === this.ductsDictionary[key][2].id
            );
    
            let fixedSegment = null;
            for (const i in currentSegments) {
                if (currentSegments[i].xetoDuct.isPositioned) {
                    fixedSegment = currentSegments[i];
                    currentSegments.splice(i, 1);
                    break;
                }
            }
            this.getSegmentDirection(fixedSegment, key);
            console.log("placeIntersection 3* fixedSegment:", fixedSegment);
    
            let intersectSegments = {
                up: null,
                down: null,
                left: null,
                right: null
            };
    
            for (const currentSegment of currentSegments) {
                this.getSegmentDirection(currentSegment, key);
                console.log("placeIntersection 3* currentSegment:", currentSegment);
            }
    
            this.seperateByDirections(intersectSegments, fixedSegment, currentSegments);
            console.log("placeIntersection 3* intersectSegments:", intersectSegments);

            if(intersectSegments.up != null && intersectSegments.up.xetoDuct.isPositioned != true) {
                let currentSegmentOrientation = intersectSegments.up.xetoDuct.orientation;
                this.orientAssemblySegment(intersectSegments.up.segment, currentSegmentOrientation);
            }            

            if(intersectSegments.down != null && intersectSegments.down.xetoDuct.isPositioned != true) {
                let currentSegmentOrientation = intersectSegments.down.xetoDuct.orientation;
                this.orientAssemblySegment(intersectSegments.down.segment, currentSegmentOrientation);
            }
            
    
            for (const currentSegment of currentSegments) {
                let lengthToAdjacent = 0;
                lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.x - currentSegment.segment.duct.userData.component.object.position.x;
                this.translateAssemblySegment(currentSegment.segment, 'x', lengthToAdjacent);
                lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.z - currentSegment.segment.duct.userData.component.object.position.z;
                this.translateAssemblySegment(currentSegment.segment, 'z', lengthToAdjacent);
            }

            let upSize = 0;
            if(intersectSegments.up != null) {
                upSize = intersectSegments.up.xetoDuct.graphicLocation.size
            }
            else {
                upSize = intersectSegments.down.xetoDuct.graphicLocation.size
            }

            let downSize = 0;
            if(intersectSegments.down != null) {
                downSize = intersectSegments.down.xetoDuct.graphicLocation.size
            }
            else {
                downSize = intersectSegments.up.xetoDuct.graphicLocation.size
            }           

            if(intersectSegments.left == null) {
                const upSize = intersectSegments.up.xetoDuct.graphicLocation.size;
                const downSize = intersectSegments.down.xetoDuct.graphicLocation.size;
                const rightSize = intersectSegments.right.xetoDuct.graphicLocation.size;
                let maxHalfWidth = this.innerDim[upSize] > this.innerDim[downSize] ? this.innerDim[upSize] / 2 : this.innerDim[downSize] / 2;
                let maxHalfHeight = this.innerDim[rightSize] / 2;

                if(fixedSegment == intersectSegments.right) {
                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "x", (length * -1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "x", (length * -1));
                }

                if(fixedSegment == intersectSegments.up) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding * 2;
                    this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.right.segment, "z", (length * -1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
                }

                if(fixedSegment == intersectSegments.down) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding * 2;
                    this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.right.segment, "z", (length * 1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
                }
            }

            if(intersectSegments.right == null) {
                const upSize = intersectSegments.up.xetoDuct.graphicLocation.size;
                const downSize = intersectSegments.down.xetoDuct.graphicLocation.size;
                const leftSize = intersectSegments.left.xetoDuct.graphicLocation.size;

                let maxHalfWidth = this.innerDim[upSize] > this.innerDim[downSize] ? this.innerDim[upSize] / 2 : this.innerDim[downSize] / 2;
                let maxHalfHeight = this.innerDim[leftSize] / 2;

                if(fixedSegment == intersectSegments.left) {
                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "x", (length * 1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "x", (length * 1));
                }

                if(fixedSegment == intersectSegments.up) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "z", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
                }

                if(fixedSegment == intersectSegments.down) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "z", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
                }
            }

            if(intersectSegments.down == null) {
                const upSize = intersectSegments.up.xetoDuct.graphicLocation.size;
                const leftSize = intersectSegments.left.xetoDuct.graphicLocation.size;
                const rightSize = intersectSegments.right.xetoDuct.graphicLocation.size;
                
                let maxHalfWidth = this.innerDim[upSize] / 2;
                let maxHalfHeight = this.innerDim[leftSize] > this.innerDim[rightSize] ? this.innerDim[leftSize] / 2 : this.innerDim[rightSize] / 2;

                if(fixedSegment == intersectSegments.left) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "x", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding * 2;
                    this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
                }

                if(fixedSegment == intersectSegments.right) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.up.segment, "x", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
                }

                if(fixedSegment == intersectSegments.up) {
                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "z", (length * -1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.right.segment, "z", (length * -1));
                }
            }

            if(intersectSegments.up == null) {
                const downSize = intersectSegments.down.xetoDuct.graphicLocation.size;
                const leftSize = intersectSegments.left.xetoDuct.graphicLocation.size;
                const rightSize = intersectSegments.right.xetoDuct.graphicLocation.size;
                
                let maxHalfWidth = this.innerDim[downSize] / 2;
                let maxHalfHeight = this.innerDim[leftSize] > this.innerDim[rightSize] ? this.innerDim[leftSize] / 2 : this.innerDim[rightSize] / 2;

                if(fixedSegment == intersectSegments.left) {
                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "x", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding * 2;
                    this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
                }

                if(fixedSegment == intersectSegments.right) {
                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.down.segment, "x", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
                }

                if(fixedSegment == intersectSegments.down) {
                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));

                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.left.segment, "z", (length * 1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));

                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    this.translateAssemblySegment(intersectSegments.right.segment, "z", (length * 1));
                }
            }

            const largestGlobalSize = this.createJointProxies(intersectSegments, null, jointBlockStyle);
            this.createOrthogonalTJoint(intersectSegments, xzJointDirection, largestGlobalSize);
    
        }
        else if(this.ductsDictionary[key].length == 2) {
            console.log("placeIntersection 2*");

            let currentSegments = this.assemblySegments.filter(child => 
                child.xetoDuct.id === this.ductsDictionary[key][0].id ||
                child.xetoDuct.id === this.ductsDictionary[key][1].id
            );

            let fixedSegment = null;
            for (const i in currentSegments) {
                if (currentSegments[i].xetoDuct.isPositioned) {
                    fixedSegment = currentSegments[i];
                    currentSegments.splice(i, 1);
                    break;
                }
            }
            this.getSegmentDirection(fixedSegment, key);
            console.log("placeIntersection 2* fixedSegment:", fixedSegment);

            let intersectSegments = {
                up: null, 
                down: null,
                left: null, 
                right: null
            }

            let currentSegment = currentSegments[0];
            this.getSegmentDirection(currentSegment, key);

            this.seperateByDirections(intersectSegments, fixedSegment, currentSegments);

            if(intersectSegments.up) {
                let currentSegmentOrientation = currentSegment.xetoDuct.orientation;
                this.orientAssemblySegment(currentSegment.segment, currentSegmentOrientation);
            }
            else if(intersectSegments.down) {
                let currentSegmentOrientation = currentSegment.xetoDuct.orientation;
                this.orientAssemblySegment(currentSegment.segment, currentSegmentOrientation);
            }            

            let lengthToAdjacent = 0;
            lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.x - currentSegment.segment.duct.userData.component.object.position.x;
            this.translateAssemblySegment(currentSegment.segment, 'x', lengthToAdjacent);
            lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.z - currentSegment.segment.duct.userData.component.object.position.z;
            this.translateAssemblySegment(currentSegment.segment, 'z', lengthToAdjacent);

            let pairDirection = null;
            if(intersectSegments.up != null && intersectSegments.down != null) {
                pairDirection = "vertical";
                xzJointPadding = 30;
            }
            if(intersectSegments.left != null && intersectSegments.right != null) {
                pairDirection = "horizontal";
                xzJointPadding = 30;
            }

            if(fixedSegment.xetoDuct.isVertical == currentSegment.xetoDuct.isVertical) {
                if(currentSegment.relativePosition == "right") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'x', length * 1);
                }
                else if(currentSegment.relativePosition == "left") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'x', length * -1);
                }
                else if(currentSegment.relativePosition == "up") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'z', (length * 1));
                }
                else if(currentSegment.relativePosition == "down") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'z', (length * -1));
                }
            }
            else if(fixedSegment.xetoDuct.isVertical != currentSegment.xetoDuct.isVertical) {
                if(fixedSegment.relativePosition == "left") {
                    length = ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2) + this.innerDim[currentSegment.xetoDuct.graphicLocation.size] / 2;
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, "x", (length * 1) + 15);
                }
                else if(fixedSegment.relativePosition == "right") {
                    length = ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2) + this.innerDim[currentSegment.xetoDuct.graphicLocation.size] / 2;
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, "x", (length * -1) - 15);
                }
                if(fixedSegment.relativePosition == "up") {
                    length = ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDim[currentSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'z', (length * -1) - 15);
                }
                else if(fixedSegment.relativePosition == "down") {
                    length = ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDim[currentSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'z', (length * 1) + 15);
                }

                if(currentSegment.relativePosition == "up") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDim[fixedSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'z', (length * 1) + 15);
                }
                else if(currentSegment.relativePosition == "down") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDim[fixedSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'z', (length * -1) - 15);
                }
                else if(currentSegment.relativePosition == "left") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDim[fixedSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'x', (length * -1) - 15);
                }
                else if(currentSegment.relativePosition == "right") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDim[fixedSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    this.translateAssemblySegment(currentSegment.segment, 'x', (length * 1) + 15);
                }
            }

            const largestGlobalSize = this.createJointProxies(intersectSegments, pairDirection, jointBlockStyle);
            if(pairDirection) {
                this.createParallelJoint(intersectSegments, pairDirection);
            }
            else {
                this.createOrthogonalLJoint(intersectSegments, xzJointDirection, largestGlobalSize);
            }
            
        }

        for(const traversedSegmentXeto of this.ductsDictionary[key]) {
            if(traversedSegmentXeto.isPositioned != true) {
                console.log("placeIntersection traversedSegmentXeto.id", traversedSegmentXeto.id);
            }
            traversedSegmentXeto.isPositioned = true;
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

    /**
     * getRow
     * 
     * Extracts the row number from a location string.
     * 
     * @param {String} location - The location string (e.g., "A5").
     * @returns {Number} The row number extracted from the location.
     */
    getRow(location) {
        return parseInt(location.slice(1, location.length)); // Parse and return the row number from the location string.
    }

    /**
     * getJointEntry
     * 
     * Determines the appropriate joint entry based on the number of intersections.
     * 
     * @param {Array} intersections - The list of intersecting segments.
     * @returns {Object} The joint entry for the intersections.
     */
    getJointEntry(intersections) {
        switch (intersections.length) { // Determine the joint type based on the number of intersections.
            case 1:
                return JSON.parse(JSON.stringify(this.LJointEntry)); // Return the L-Joint entry for one intersection.
            case 2:
                return JSON.parse(JSON.stringify(this.TJointEntry)); // Return the T-Joint entry for two intersections.
            case 3:
                return JSON.parse(JSON.stringify(this.CrossJointEntry)); // Return the Cross-Joint entry for three intersections.
            default:
                return JSON.parse(JSON.stringify(this.LJointEntry)); // Default to the L-Joint entry.
        }
    }

    /**
     * spawnJoint
     * 
     * Spawns a joint at the intersection of segments, placing it in the correct position 
     * and orientation based on the segment's orientation.
     * 
     * @param {Object} segmentCopy - A copy of the current segment.
     * @param {Object} JointEntry - The joint entry to use.
     * @param {Boolean} isTop - Whether the joint is on the top side.
     * @param {Array} intersections - The list of intersecting segments.
     * @param {Object} segmentRef - A reference to the current segment.
     */
    async spawnJoint(segmentCopy, JointEntry, isTop, intersections, segmentRef) {
        const joint = {
            userData: {
                component: JSON.parse(JSON.stringify(JointEntry)) // Clone the joint entry.
            }
        }
        
        joint.userData.component.object.position = segmentCopy.segment.duct.userData.component.object.position; // Set the joint's position to the segment's position.
        let length = ((segmentCopy.segment.duct.userData.component.attributes.length.value) / 2) - 530; // Calculate the length of the joint.

        for (const intersection of intersections) { // Iterate over each intersection.
            intersection.relativePosition = this.getRelativePosition(segmentCopy, intersection); // Determine the relative position of the intersection.
        }

        let jointQuadrant = 1; // Initialize the joint quadrant.
        const pos0 = intersections[0].relativePosition; // Get the relative position of the first intersection.

        if (intersections.length == 2) { // If there are two intersections.
            const pos1 = intersections[1].relativePosition; // Get the relative position of the second intersection.
            if (pos0 == 'left' && pos1 == 'top' || pos0 == 'top' && pos1 == 'left') {
                jointQuadrant = 4; // Set the joint quadrant based on the relative positions.
            } else if (pos0 == 'left' && pos1 == 'bottom' || pos0 == 'bottom' && pos1 == 'left') {
                jointQuadrant = 4;
            } else if (pos0 == 'left' && pos1 == 'right' || pos0 == 'right' && pos1 == 'left') {
                if (isTop) {
                    jointQuadrant = 3;
                } else {
                    jointQuadrant = 1;
                }
            } else if (pos0 == 'right' && pos1 == 'top' || pos0 == 'top' && pos1 == 'right') {
                jointQuadrant = 2;
            } else if (pos0 == 'right' && pos1 == 'bottom' || pos0 == 'bottom' && pos1 == 'right') {
                jointQuadrant = 2;
            }
        }

        if (intersections.length == 1) { // If there is only one intersection.
            if (isTop && pos0 == 'left') {
                jointQuadrant = 4; // Set the joint quadrant based on the relative position.
            } else if (!isTop && pos0 == 'left') {
                jointQuadrant = 1;
            } else if (isTop && pos0 == 'right') {
                jointQuadrant = 3;
            } else if (!isTop && pos0 == 'right') {
                jointQuadrant = 2;
            }
        }

        if (isTop) {
            joint.userData.component.object.position.z += length + 1060; // Adjust the joint's z-position if it's on the top.
        } else if (isTop == false) {
            joint.userData.component.object.position.z -= length + 1060; // Adjust the joint's z-position if it's on the bottom.
        }

        if (jointQuadrant == 2) {
            joint.userData.component.object.rotation.y = THREE.MathUtils.degToRad(90); // Rotate the joint based on the quadrant.
        } else if (jointQuadrant == 3) {
            joint.userData.component.object.rotation.y = THREE.MathUtils.degToRad(180);
        } else if (jointQuadrant == 4) {
            joint.userData.component.object.rotation.y = THREE.MathUtils.degToRad(-90);
        }

        segmentRef.segment.joints.push(joint); // Add the joint to the segment's joints array.
    }

    /**
     * getRelativePosition
     * 
     * Determines the relative position (left, right, top, bottom) of an intersecting segment 
     * relative to the current segment.
     * 
     * @param {Object} segment - The current segment.
     * @param {Object} intersection - The intersecting segment.
     * @returns {String} The relative position of the intersection.
     */
    getRelativePosition(segment, intersection) {
        function letterToNumber(letter) {
            return letter.toUpperCase().charCodeAt(0); // Convert the letter to a number using its ASCII value.
        }

        const intersectColumnStart = letterToNumber(intersection.xetoDuct.graphicLocation.start[0]); // Get the column number of the intersection's start.
        const intersectColumnEnd = letterToNumber(intersection.xetoDuct.graphicLocation.end[0]); // Get the column number of the intersection's end.

        const segmentColumnPosition = letterToNumber(segment.xetoDuct.graphicLocation.start[0]); // Get the column number of the segment's start.

        if (intersectColumnStart < segmentColumnPosition || intersectColumnEnd < segmentColumnPosition) {
            return 'left'; // Return 'left' if the intersection is to the left of the segment.
        } else if (intersectColumnStart > segmentColumnPosition || intersectColumnEnd > segmentColumnPosition) {
            return 'right'; // Return 'right' if the intersection is to the right of the segment.
        }

        const intersectRowStart = this.getRow(intersection.xetoDuct.graphicLocation.start); // Get the row number of the intersection's start.
        const intersectRowEnd = this.getRow(intersection.xetoDuct.graphicLocation.end); // Get the row number of the intersection's end.

        const segmentRowPosition = this.getRow(segment.xetoDuct.graphicLocation.start); // Get the row number of the segment's start.

        if (intersectRowStart < segmentRowPosition || intersectRowEnd < segmentRowPosition) {
            return 'top'; // Return 'top' if the intersection is above the segment.
        } else if (intersectRowStart > segmentRowPosition || intersectRowEnd > segmentRowPosition) {
            return 'bottom'; // Return 'bottom' if the intersection is below the segment.
        }
    }

    /**
     * getOrientation
     * 
     * Determines the orientation of a segment based on the start and end graphic locations.
     * 
     * @param {String} start - The start location of the segment.
     * @param {String} end - The end location of the segment.
     * @returns {String} The orientation of the segment (e.g., "north", "south", "east", "west").
     */
    getOrientation(start, end) {
        let orientation = "east"; // Initialize the default orientation as 'east'.
        if (this.getRow(end) > this.getRow(start)) {
            orientation = "south"; // Set the orientation to 'south' if the end is below the start.
        } else if (this.getRow(end) < this.getRow(start)) {
            orientation = "north"; // Set the orientation to 'north' if the end is above the start.
        } else if (end[0] > start[0]) {
            orientation = "east"; // Set the orientation to 'east' if the end is to the right of the start.
        } else if (end[0] < start[0]) {
            orientation = "west"; // Set the orientation to 'west' if the end is to the left of the start.
        }
        return orientation; // Return the determined orientation.
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
    translateAssemblySegment(assemblySegment, translationKey, translationValue) {
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
    orientAssemblySegment(assemblySegment, orientation) {
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

    /**
     * determineFlowDirections
     * 
     * Determines the flow direction of various components in the assembly.
     * Flips components and ducts if their flow direction is 'endToStart'.
     */
    determineFlowDirections(assemblySegments) {
        // Flip any component that has a flow-direction value of endToStart
        // for (const segment of assemblySegments) {
        //   for (const mesh of segment.segment.meshes) {
        //     if (mesh.userData.xeto.blockStyle.flowDirection == 'endToStart') {
        //       this.flipMesh(mesh); // Flip the mesh by applying negative scale to the x-axis.
        //     }
        //   }
        // }
    }
  
    /**
     * flipMesh
     * 
     * Flips a given mesh by rotating it 180 degrees around the Z-axis.
     * 
     * @param {Object} mesh - The 3D mesh to be flipped
     */
    flipMesh(mesh) {
    mesh.userData.component.object.scale.x *= -1;
    }

    createOrthogonalCrossJoint(intersection, xzJointDirection, largestGlobalSize) {
        const geometries = [];
        if(xzJointDirection == "outwards") {
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.right.segment.duct.userData.proxy2Vertices, 
                    intersection.down.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.down.segment.duct.userData.proxy2Vertices,
                    intersection.down.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.down.segment.duct.userData.proxy1Vertices,
                    intersection.left.segment.duct.userData.proxyMedianVertices
                )  
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.left.segment.duct.userData.proxy2Vertices, 
                    intersection.left.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.up.segment.duct.userData.proxyMedianVertices, 
                    intersection.left.segment.duct.userData.proxy1Vertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.up.segment.duct.userData.proxyMedianVertices, 
                    intersection.up.segment.duct.userData.proxy1Vertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.up.segment.duct.userData.proxy2Vertices, 
                    intersection.right.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.right.segment.duct.userData.proxyMedianVertices, 
                    intersection.right.segment.duct.userData.proxy1Vertices
                )
            );
        }
        else {
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.right.segment.duct.userData.proxy2Vertices, 
                    intersection.down.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.down.segment.duct.userData.proxy2Vertices,
                    intersection.down.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.down.segment.duct.userData.proxy1Vertices,
                    intersection.left.segment.duct.userData.proxyMedianVertices
                ) 
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.left.segment.duct.userData.proxy2Vertices, 
                    intersection.left.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.up.segment.duct.userData.proxyMedianVertices, 
                    intersection.left.segment.duct.userData.proxy1Vertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.up.segment.duct.userData.proxyMedianVertices, 
                    intersection.up.segment.duct.userData.proxy1Vertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.up.segment.duct.userData.proxy2Vertices, 
                    intersection.right.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.right.segment.duct.userData.proxyMedianVertices, 
                    intersection.right.segment.duct.userData.proxy1Vertices
                )
            );
        }

        let backwall = [
            intersection.up.segment.duct.userData.proxyMedianVertices[4],
            intersection.up.segment.duct.userData.proxy1Vertices[4],
            intersection.up.segment.duct.userData.proxy2Vertices[7],
            intersection.right.segment.duct.userData.proxyMedianVertices[7],
            intersection.right.segment.duct.userData.proxy1Vertices[7],
            intersection.right.segment.duct.userData.proxy2Vertices[6],
            intersection.down.segment.duct.userData.proxyMedianVertices[6],
            intersection.down.segment.duct.userData.proxy2Vertices[6],
            intersection.down.segment.duct.userData.proxy1Vertices[5],
            intersection.left.segment.duct.userData.proxyMedianVertices[5],
            intersection.left.segment.duct.userData.proxy2Vertices[5],
            intersection.left.segment.duct.userData.proxy1Vertices[4]
        ];

        geometries.push(
            ...this.createJointClosure(intersection.up.segment.duct, "horizontal")
        );
        geometries.push(
            ...this.createJointClosure(intersection.right.segment.duct, "vertical")
        );
        geometries.push(
            ...this.createJointClosure(intersection.down.segment.duct, "horizontal")
        );
        geometries.push(
            ...this.createJointClosure(intersection.left.segment.duct, "vertical")
        );
        
        this.createJointBackwall(backwall, largestGlobalSize);

        this.mergeAndAddToScene(geometries);

    }

    createOrthogonalTJoint(intersection, xzJointDirection, largestGlobalSize) {
        const geometries = [];
        if(xzJointDirection == "outwards") {
            if(intersection.right == null) {
                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.down.segment.duct.userData.proxy2Vertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.down.segment.duct.userData.proxy2Vertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )   
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    ) 
                );         
            }
            else if(intersection.left == null) {
                if(intersection.up.segment.duct.userData.proxyMedianVertices[0].z == intersection.up.segment.duct.userData.proxy1Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.down.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.down.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.up == null) {
                if(intersection.right.segment.duct.userData.proxyMedianVertices[0].z == intersection.right.segment.duct.userData.proxy1Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        ) 
                    );
                }
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    ) 
                );       
            }
        }
        else if(xzJointDirection == "inwards") {
            if(intersection.right == null) {
                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.down.segment.duct.userData.proxy2Vertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.down.segment.duct.userData.proxy2Vertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    )
                );
            }
            else if(intersection.left == null) {
                if(intersection.up.segment.duct.userData.proxyMedianVertices[0].z == intersection.up.segment.duct.userData.proxy1Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.down.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.down.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )   
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.down == null) {

                if(intersection.left.segment.duct.userData.proxyMedianVertices[0].z == intersection.right.segment.duct.userData.proxy2Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.left.segment.duct.userData.proxy2Vertices,
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.left.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.left.segment.duct.userData.proxy2Vertices,
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.left.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                }

                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }
            else if(intersection.up == null) {

                if(intersection.right.segment.duct.userData.proxyMedianVertices[0].z == intersection.right.segment.duct.userData.proxy1Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )  
                    );
                }

                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    ) 
                );   
            }
        }

        let backwall = [];
        if(intersection.up != null) {
            backwall.push(intersection.up.segment.duct.userData.proxyMedianVertices[4]);
            backwall.push(intersection.up.segment.duct.userData.proxy1Vertices[4]);
            backwall.push(intersection.up.segment.duct.userData.proxy2Vertices[7]);
            geometries.push(
                ...this.createJointClosure(intersection.up.segment.duct, "horizontal")
            );
        }
        if(intersection.right != null) {
            backwall.push(intersection.right.segment.duct.userData.proxyMedianVertices[7]);
            backwall.push(intersection.right.segment.duct.userData.proxy1Vertices[7]);
            backwall.push(intersection.right.segment.duct.userData.proxy2Vertices[6]);
            geometries.push(
                ...this.createJointClosure(intersection.right.segment.duct, "vertical")
            );
        }
        if(intersection.down != null) {
            backwall.push(intersection.down.segment.duct.userData.proxyMedianVertices[6]);
            backwall.push(intersection.down.segment.duct.userData.proxy2Vertices[6]);
            backwall.push(intersection.down.segment.duct.userData.proxy1Vertices[5]);
            geometries.push(
                ...this.createJointClosure(intersection.down.segment.duct, "horizontal")
            );
        }
        if(intersection.left != null) {
            backwall.push(intersection.left.segment.duct.userData.proxyMedianVertices[5]);
            backwall.push(intersection.left.segment.duct.userData.proxy2Vertices[5]);
            backwall.push(intersection.left.segment.duct.userData.proxy1Vertices[4]);
            geometries.push(
                ...this.createJointClosure(intersection.left.segment.duct, "vertical")
            );
        }   
        
        this.createJointBackwall(backwall, largestGlobalSize);

        this.mergeAndAddToScene(geometries);
    }

    createOrthogonalLJoint(intersection, xzJointDirection, largestGlobalSize) {
        const geometries = [];

        if(xzJointDirection == "outwards") {
            if(intersection.right != null && intersection.up != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );                
            }
            else if(intersection.right != null && intersection.down != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
            } 
            else if(intersection.left != null && intersection.up != null) {
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }
            else if(intersection.left != null && intersection.down != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );     
            }  
        }
        else if(xzJointDirection == "inwards") {
            if(intersection.right != null && intersection.up != null) {
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                ); 
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                ); 
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                ); 
            }
            else if(intersection.right != null && intersection.down != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.left != null && intersection.up != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }  
            else if(intersection.left != null && intersection.down != null) {
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    ) 
                );        
            }  
        }

        let backwall = [];
        if(intersection.up != null) {
            backwall.push(...[
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7]
            ]);
            geometries.push(
                ...this.createJointClosure(intersection.up.segment.duct, "horizontal")
            ); 
        }
        if(intersection.right != null) {
            backwall.push(intersection.right.segment.duct.userData.proxyMedianVertices[7]);
            backwall.push(intersection.right.segment.duct.userData.proxy1Vertices[7]);
            backwall.push(intersection.right.segment.duct.userData.proxy2Vertices[6]);
            geometries.push(
                ...this.createJointClosure(intersection.right.segment.duct, "vertical")
            ); 
        }
        if(intersection.down != null) {
            backwall.push(intersection.down.segment.duct.userData.proxyMedianVertices[6]);
            backwall.push(intersection.down.segment.duct.userData.proxy2Vertices[6]);
            backwall.push(intersection.down.segment.duct.userData.proxy1Vertices[5]);
            geometries.push(
                ...this.createJointClosure(intersection.down.segment.duct, "horizontal")
            ); 
        }
        if(intersection.left != null) {
            backwall.push(intersection.left.segment.duct.userData.proxyMedianVertices[5]);
            backwall.push(intersection.left.segment.duct.userData.proxy2Vertices[5]);
            backwall.push(intersection.left.segment.duct.userData.proxy1Vertices[4]);
            geometries.push(
                ...this.createJointClosure(intersection.left.segment.duct, "vertical")
            ); 
        }   
        
        this.createJointBackwall(backwall, largestGlobalSize);

        this.mergeAndAddToScene(geometries);
    }

    createJointClosure(duct, direction) {
        const geometries = [];

        if(direction == "horizontal") {
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal2Vertices[4],
                    duct.userData.proxyOriginal1Vertices[7],
                    duct.userData.proxy1Vertices[7],
                    duct.userData.proxy2Vertices[4]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal2Vertices[5],
                    duct.userData.proxyOriginal1Vertices[6],
                    duct.userData.proxy1Vertices[6],
                    duct.userData.proxy2Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal1Vertices[7],
                    duct.userData.proxyOriginal2Vertices[4],
                    duct.userData.proxyOriginal2Vertices[5],
                    duct.userData.proxyOriginal1Vertices[6]
                )
            );
        }
        else {
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal2Vertices[4],
                    duct.userData.proxyOriginal1Vertices[4],
                    duct.userData.proxy1Vertices[4],
                    duct.userData.proxy2Vertices[4]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal2Vertices[7],
                    duct.userData.proxyOriginal1Vertices[7],
                    duct.userData.proxy1Vertices[7],
                    duct.userData.proxy2Vertices[7]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal1Vertices[7],
                    duct.userData.proxyOriginal2Vertices[6],
                    duct.userData.proxyOriginal2Vertices[5],
                    duct.userData.proxyOriginal1Vertices[4]
                )
            );
        }

        return geometries;
    }

    createJointBackwall(points, largestGlobalSize = 1000) {
        console.log("createJointBackwall started:", points);
        if (points.length < 3) {
            throw new Error("A shape requires at least 3 points.");
        }

        const wallThickness = 30;
    
        // Ensure the points are flattened into 2D (projected onto XZ plane)
        const shapePoints = points.map(point => new THREE.Vector2(point.x, point.z));

        // Create a THREE.Shape from the points
        const shape = new THREE.Shape(shapePoints);

        // Create ExtrudeGeometry to add thickness to the shape
        const extrudeSettings = {
            depth: wallThickness, // Thickness of the extrusion
            bevelEnabled: false, // No bevel for a straight extrusion
        };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Create the material and mesh
        const material = new THREE.MeshStandardMaterial({ color: 0xAEB9C2, side: THREE.DoubleSide, opacity: 1.0 });
        const mesh = new THREE.Mesh(geometry, material);

        // Rotate and position the mesh
        mesh.rotation.x = Math.PI / 2;
        mesh.position.y += (largestGlobalSize / 2) - 15;

        mesh.position.y += wallThickness;

        mesh.name = "joint";

        // Add an optional wireframe
        const wireframe = new THREE.WireframeGeometry(mesh.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000 
        });

        // Enable depth testing and set render order to ensure visibility
        lineMaterial.depthTest = false; // Makes sure the wireframe is rendered on top
        lineMaterial.renderOrder = 3;  // Prioritize rendering order (higher values render later)
        // lineMaterial.opacity = 0.3;

        // Create the wireframe mesh
        const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);
        wireframeMesh.visible = false; // Set visibility based on your requirements
        mesh.add(wireframeMesh); // Add wireframe as a child of the original mesh

        // Ensure the original mesh is rendered with a slight polygon offset
        // mesh.material.polygonOffset = true;
        // mesh.material.polygonOffsetFactor = 2; // Adjust this value as needed
        // mesh.material.polygonOffsetUnits = 5;  // Fine-tune offset to prevent Z-fighting

        this.sceneHelper.addToScene(mesh);
    }

    connectProxiesHorizontally(leftProxy, rightProxy) {
        const geometries = [];

        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[2],
                rightProxy[2],
                rightProxy[6],
                leftProxy[6]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[0],
                rightProxy[0],
                rightProxy[4],
                leftProxy[4]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[3],
                rightProxy[0],
                rightProxy[1],
                leftProxy[2]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[4],
                rightProxy[7],
                rightProxy[6],
                leftProxy[5]
            )
        );

        return geometries;
    }

    connectProxiesVertically(topProxy, bottomProxy) {
        const geometries = [];

        geometries.push(
            this.createGeometryFromPoints(
                topProxy[2],
                bottomProxy[3],
                bottomProxy[7],
                topProxy[6]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                topProxy[1],
                bottomProxy[1],
                bottomProxy[5],
                topProxy[5]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                topProxy[1],
                bottomProxy[0],
                bottomProxy[3],
                topProxy[2]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                topProxy[6],
                bottomProxy[7],
                bottomProxy[4],
                topProxy[5]
            )
        );

        return geometries;
    }

    connectProxiesDiagonallyDownhill(leftProxy, rightProxy) {
        //front strip
        this.connectPoints(
            leftProxy[1],
            rightProxy[1],
            rightProxy[3],
            leftProxy[3]
        );
        // back strip
        this.connectPoints(
            leftProxy[5],
            rightProxy[5],
            rightProxy[7],
            leftProxy[7]
        );
        // front panel
        this.connectPoints(
            leftProxy[1],
            leftProxy[5],
            rightProxy[5],
            rightProxy[1]
        );
        // back panel
        this.connectPoints(
            leftProxy[3],
            leftProxy[7],
            rightProxy[7],
            rightProxy[3]
        );
    }

    connectProxiesDiagonallyUphill(leftProxy, rightProxy) {
        //front strip
        this.connectPoints(
            leftProxy[0],
            rightProxy[0],
            rightProxy[2],
            leftProxy[2]
        );
        // back strip
        this.connectPoints(
            leftProxy[4],
            rightProxy[4],
            rightProxy[6],
            leftProxy[6]
        );
        // front panel
        this.connectPoints(
            leftProxy[0],
            leftProxy[4],
            rightProxy[4],
            rightProxy[0]
        );
        // back panel
        this.connectPoints(
            leftProxy[2],
            leftProxy[6],
            rightProxy[6],
            rightProxy[2]
        );
    }

    createGeometryFromPoints(pointA, pointB, pointC, pointD) {
        // Create an array of vertices
        const vertices = new Float32Array([
            pointA.x, pointA.y, pointA.z, // Vertex 0
            pointB.x, pointB.y, pointB.z, // Vertex 1
            pointC.x, pointC.y, pointC.z, // Vertex 2
            pointD.x, pointD.y, pointD.z  // Vertex 3
        ]);
    
        // Define the indices for the two triangles (clockwise winding order)
        const indices = [
            0, 1, 2, // First triangle (A -> B -> C)
            0, 2, 3  // Second triangle (A -> C -> D)
        ];
    
        // Create the BufferGeometry
        const geometry = new THREE.BufferGeometry();
    
        // Set the vertices as a BufferAttribute
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
        // Set the indices
        geometry.setIndex(indices);
    
        // Compute normals if you need lighting effects
        geometry.computeVertexNormals();
    
        return geometry;
    }
    
    createParallelJoint(intersection, pairDirection) {
        const geometries = [];

        if(pairDirection == "vertical") {
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[1],
                    intersection.down.segment.duct.userData.proxy1Vertices[1],
                    intersection.down.segment.duct.userData.proxy1Vertices[5],
                    intersection.up.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[0],
                    intersection.down.segment.duct.userData.proxy1Vertices[0],
                    intersection.down.segment.duct.userData.proxy1Vertices[4],
                    intersection.up.segment.duct.userData.proxy1Vertices[4]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[0],
                    intersection.down.segment.duct.userData.proxy1Vertices[3],
                    intersection.down.segment.duct.userData.proxy1Vertices[2],
                    intersection.up.segment.duct.userData.proxy1Vertices[1]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[4],
                    intersection.down.segment.duct.userData.proxy1Vertices[4],
                    intersection.down.segment.duct.userData.proxy1Vertices[5],
                    intersection.up.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                    intersection.up.segment.duct.userData.proxyOriginal2Vertices[7],
                    intersection.up.segment.duct.userData.proxy2Vertices[7],
                    intersection.up.segment.duct.userData.proxy1Vertices[7]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.down.segment.duct.userData.proxyOriginal1Vertices[5],
                    intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                    intersection.down.segment.duct.userData.proxy2Vertices[5],
                    intersection.down.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.down.segment.duct.userData.proxyOriginal1Vertices[4],
                    intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                    intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                    intersection.down.segment.duct.userData.proxyOriginal1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[4],
                    intersection.down.segment.duct.userData.proxy2Vertices[4],
                    intersection.down.segment.duct.userData.proxy2Vertices[5],
                    intersection.up.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy2Vertices[1],
                    intersection.down.segment.duct.userData.proxy2Vertices[1],
                    intersection.down.segment.duct.userData.proxy2Vertices[5],
                    intersection.up.segment.duct.userData.proxy2Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy2Vertices[0],
                    intersection.down.segment.duct.userData.proxy2Vertices[0],
                    intersection.down.segment.duct.userData.proxy2Vertices[4],
                    intersection.up.segment.duct.userData.proxy2Vertices[4]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy2Vertices[0],
                    intersection.down.segment.duct.userData.proxy2Vertices[3],
                    intersection.down.segment.duct.userData.proxy2Vertices[2],
                    intersection.up.segment.duct.userData.proxy2Vertices[1]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy2Vertices[4],
                    intersection.down.segment.duct.userData.proxy2Vertices[4],
                    intersection.down.segment.duct.userData.proxy2Vertices[5],
                    intersection.up.segment.duct.userData.proxy2Vertices[5]
                )
            );
        }
        if(pairDirection == "horizontal") {
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[2],
                    intersection.right.segment.duct.userData.proxy1Vertices[2],
                    intersection.right.segment.duct.userData.proxy1Vertices[6],
                    intersection.left.segment.duct.userData.proxy1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[1],
                    intersection.right.segment.duct.userData.proxy1Vertices[1],
                    intersection.right.segment.duct.userData.proxy1Vertices[5],
                    intersection.left.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[1],
                    intersection.right.segment.duct.userData.proxy1Vertices[0],
                    intersection.right.segment.duct.userData.proxy1Vertices[3],
                    intersection.left.segment.duct.userData.proxy1Vertices[2]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[5],
                    intersection.right.segment.duct.userData.proxy1Vertices[5],
                    intersection.right.segment.duct.userData.proxy1Vertices[6],
                    intersection.left.segment.duct.userData.proxy1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
                    intersection.right.segment.duct.userData.proxyOriginal2Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[5],
                    intersection.right.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.right.segment.duct.userData.proxyOriginal1Vertices[6],
                    intersection.right.segment.duct.userData.proxyOriginal2Vertices[6],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    intersection.right.segment.duct.userData.proxy1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
                    intersection.right.segment.duct.userData.proxyOriginal2Vertices[5],
                    intersection.right.segment.duct.userData.proxyOriginal2Vertices[6],
                    intersection.right.segment.duct.userData.proxyOriginal1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    intersection.left.segment.duct.userData.proxy1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy2Vertices[2],
                    intersection.right.segment.duct.userData.proxy2Vertices[2],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    intersection.left.segment.duct.userData.proxy2Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy2Vertices[1],
                    intersection.right.segment.duct.userData.proxy2Vertices[1],
                    intersection.right.segment.duct.userData.proxy2Vertices[5],
                    intersection.left.segment.duct.userData.proxy2Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy2Vertices[1],
                    intersection.right.segment.duct.userData.proxy2Vertices[0],
                    intersection.right.segment.duct.userData.proxy2Vertices[3],
                    intersection.left.segment.duct.userData.proxy2Vertices[2]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy2Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    intersection.left.segment.duct.userData.proxy2Vertices[6]
                )
            );
        }

        // return geometries;

        this.mergeAndAddToScene(geometries);
    }

    mergeAndAddToScene(geometries) {
        if (geometries.length > 0) {
            // Merge all geometries into one
            const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
            
            // Create a material (opacity can be passed as needed)
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xAEB9C2, 
                side: THREE.DoubleSide
            });
    
            // Create the merged mesh
            const mergedMesh = new THREE.Mesh(mergedGeometry, material);
            mergedMesh.name = "joint";
            mergedMesh.renderOrder = 2;

            const wireframe = new THREE.WireframeGeometry(mergedMesh.geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);
            wireframeMesh.visible = false;
            mergedMesh.add(wireframeMesh); // Add wireframe as a child of the original mesh
    
            this.sceneHelper.addToScene(mergedMesh);
        }
    }

    createJointProxies(intersection, pairDirection = null, jointBlockStyle) {
        console.log("createJointProxies started");

        const xzJointStyle = jointBlockStyle.XZ.style;
        const xzJointDirection = jointBlockStyle.XZ.direction;
        const xzJointContext = jointBlockStyle.XZ.context;
          
        const wallThickness = 30;
  
        let largestGlobalSize = this.innerDim["small"];
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                if(this.innerDim[duct.xetoDuct.graphicLocation.size] > largestGlobalSize) {
                    largestGlobalSize = this.innerDim[duct.xetoDuct.graphicLocation.size];
                }
            }
        }

        const areHelpersOn = false;

        let material = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        let material2 = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        let material3 = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        let material4 = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        let material5 = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        
        if(areHelpersOn) {
            material.color.setHex("0xFF0000");
            material2.color.setHex("0x0000FF");
            material3.color.setHex("0x00FF00");
            material4.color.setHex("0xFF0000");
            material5.color.setHex("0x0000FF");
        }          

        let y_offset = -30;

        // if(pairDirection != null) {
        //     y_offset = 30;
        // }
  
        for(const key in intersection) {
            let duct = intersection[key];

            if(duct != null) {

                let proxyLengths = {
                    proxy1: largestGlobalSize,
                    proxy2: largestGlobalSize,
                    proxyMedian: largestGlobalSize
                }

                if(xzJointContext != "global") {
                    if(key == "left") {

                        const currentDuctSize = this.innerDim[intersection.left.xetoDuct.graphicLocation.size]
                        proxyLengths.proxy1 = currentDuctSize;
                        proxyLengths.proxy2 = currentDuctSize;
                        proxyLengths.proxyMedian = currentDuctSize;
    
                        if(intersection.up != null) {
                            const adjacentSize = this.innerDim[intersection.up.xetoDuct.graphicLocation.size];
                            if(adjacentSize > currentDuctSize) {
                                proxyLengths.proxy1 = adjacentSize;
                            }  
                        }
                        if(intersection.down != null) {
                            const adjacentSize = this.innerDim[intersection.down.xetoDuct.graphicLocation.size];
                            if(adjacentSize > currentDuctSize) {
                                proxyLengths.proxy2 = adjacentSize;
                                proxyLengths.proxyMedian = adjacentSize;
                            }  
                        }

                        if(intersection.down != null) {
                            if(intersection.up == null || intersection.down == null) {
                                const adjacentSize = this.innerDim[intersection.right.xetoDuct.graphicLocation.size];
                                if(adjacentSize > currentDuctSize) {
                                    proxyLengths.proxy2 = adjacentSize;
                                    proxyLengths.proxyMedian = adjacentSize;                            
                                }
                            }
                        }
    
                    }
                    else if(key == "up") {
                        const currentDuctSize = this.innerDim[intersection.up.xetoDuct.graphicLocation.size];
                        proxyLengths.proxy1 = currentDuctSize;
                        proxyLengths.proxy2 = currentDuctSize;
                        proxyLengths.proxyMedian = currentDuctSize;
    
                        if(intersection.left != null) {
                            const adjacentSize = this.innerDim[intersection.left.xetoDuct.graphicLocation.size];
                            if(adjacentSize > currentDuctSize) {
                                proxyLengths.proxy1 = adjacentSize;
                                proxyLengths.proxyMedian = adjacentSize;
                            }  
                        }
                        if(intersection.right != null) {
                            const adjacentSize = this.innerDim[intersection.right.xetoDuct.graphicLocation.size];
                            if(adjacentSize > currentDuctSize) {
                                proxyLengths.proxy2 = adjacentSize;
                                
                            }  
                        }

                        if(intersection.left == null || intersection.right == null) {
                            if(intersection.down != null) {
                                const adjacentSize = this.innerDim[intersection.down.xetoDuct.graphicLocation.size];
                                if(adjacentSize > currentDuctSize) {
                                    proxyLengths.proxy2 = adjacentSize;
                                    proxyLengths.proxyMedian = adjacentSize;                            
                                }
                            }
                            
                        }
                    }
                    else if(key == "right") {
                        const currentDuctSize = this.innerDim[intersection.right.xetoDuct.graphicLocation.size];
                        proxyLengths.proxy1 = currentDuctSize;
                        proxyLengths.proxy2 = currentDuctSize;
                        proxyLengths.proxyMedian = currentDuctSize;
    
                        if(intersection.up != null) {
                            const adjacentSize = this.innerDim[intersection.up.xetoDuct.graphicLocation.size];
                            if(adjacentSize > currentDuctSize) {
                                proxyLengths.proxy1 = adjacentSize;
                            }  
                        }
                        if(intersection.down != null) {
                            const adjacentSize = this.innerDim[intersection.down.xetoDuct.graphicLocation.size];
                            if(adjacentSize > currentDuctSize) {
                                proxyLengths.proxy2 = adjacentSize;
                                proxyLengths.proxyMedian = adjacentSize;
                            }  
                        }

                        if(intersection.up == null || intersection.down == null) {
                            if(intersection.down != null) {
                                const adjacentSize = this.innerDim[intersection.left.xetoDuct.graphicLocation.size];
                                if(adjacentSize > currentDuctSize) {
                                    proxyLengths.proxy2 = adjacentSize;
                                    proxyLengths.proxyMedian = adjacentSize;                            
                                }
                            }
                        }
                    }
                    else if(key == "down") {
                        const currentDuctSize = this.innerDim[intersection.down.xetoDuct.graphicLocation.size];
                        proxyLengths.proxy1 = currentDuctSize;
                        proxyLengths.proxy2 = currentDuctSize;
                        proxyLengths.proxyMedian = currentDuctSize;
    
                        if(intersection.left != null) {
                            const adjacentSize = this.innerDim[intersection.left.xetoDuct.graphicLocation.size];
                            if(adjacentSize > currentDuctSize) {
                                proxyLengths.proxy1 = adjacentSize;
                            }  
                        }
                        if(intersection.right != null) {
                            const adjacentSize = this.innerDim[intersection.right.xetoDuct.graphicLocation.size];
                            if(adjacentSize > currentDuctSize) {
                                proxyLengths.proxy2 = adjacentSize;
                                proxyLengths.proxyMedian = adjacentSize;                            
                            }  
                        }

                        if(intersection.left == null || intersection.right == null) {
                            if(intersection.down != null) {
                                const adjacentSize = this.innerDim[intersection.up.xetoDuct.graphicLocation.size];
                                if(adjacentSize > currentDuctSize) {
                                    proxyLengths.proxy2 = adjacentSize;
                                    proxyLengths.proxyMedian = adjacentSize;                            
                                }
                            }
                        }
                    }

                    if(pairDirection != null) {
                        proxyLengths.proxy1 = largestGlobalSize;
                        proxyLengths.proxy2 = largestGlobalSize;
                    }
                }

                const innerDimensions = duct.segment.duct.userData.component.object.innerDimensions;

                const ductDepth = this.innerDim[duct.xetoDuct.graphicLocation.size];

                const proxyDepth = this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset;

                const proxy1Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxy2Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyOriginal1Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyOriginal2Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);    
                const proxyMedianGeometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                
                
                const proxy1 = new THREE.Mesh(proxy1Geometry, material);
                proxy1.position.copy(duct.segment.duct.userData.component.object.position);
                const proxy2 = new THREE.Mesh(proxy2Geometry, material2);
                const proxyOriginal1 = new THREE.Mesh(proxyOriginal1Geometry, material4); 
                const proxyOriginal2 = new THREE.Mesh(proxyOriginal2Geometry, material5); 
                const proxyMedian = new THREE.Mesh(proxyMedianGeometry, material3);

                this.moveProxyVertices(proxy1Geometry, ductDepth, proxyLengths.proxy1, largestGlobalSize);
                this.moveProxyVertices(proxy2Geometry, ductDepth, proxyLengths.proxy2, largestGlobalSize);
                this.moveProxyVertices(proxyMedianGeometry, ductDepth, proxyLengths.proxyMedian, largestGlobalSize);

                if(key == "up") {
                    proxy1.position.x += (innerDimensions.x / -2);
                    proxy1.position.z += (innerDimensions.z) / -2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.x += (innerDimensions.x);
                }
                else if(key == "down") {
                    proxy1.position.x += (innerDimensions.x / -2);
                    proxy1.position.z += (innerDimensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.x += (innerDimensions.x);
                }
                else if(key == "left") {
                    proxy1.position.x += (innerDimensions.x / 2);
                    proxy1.position.z += (innerDimensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.z += (innerDimensions.z * -1);
                }
                else if(key == "right") {
                    proxy1.position.x += (innerDimensions.x / -2);
                    proxy1.position.z += (innerDimensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.z += (innerDimensions.z * -1);
                }   

                proxyMedian.position.copy(proxy1.position);

                proxyOriginal1.position.copy(proxy1.position);
                proxyOriginal2.position.copy(proxy2.position);
                
                const proxy1Vertices = this.mapProxyVertices(proxy1);
                const proxy2Vertices = this.mapProxyVertices(proxy2);
                const proxyOriginal1Vertices = this.mapProxyVertices(proxyOriginal1);
                const proxyOriginal2Vertices = this.mapProxyVertices(proxyOriginal2);
        
                duct.segment.duct.userData.proxy1Vertices = proxy1Vertices;
                duct.segment.duct.userData.proxy2Vertices = proxy2Vertices;
                duct.segment.duct.userData.proxyOriginal1Vertices = proxyOriginal1Vertices;
                duct.segment.duct.userData.proxyOriginal2Vertices = proxyOriginal2Vertices;

                // material.color.setHex("0xFF0000");
                // material2.color.setHex("0x0000FF");
                // material3.color.setHex("0x00FF00");
                // material4.color.setHex("0xFF0000");
                // material5.color.setHex("0x0000FF");
        
                proxy1.name = "jointHelperProxy";
                proxy2.name = "jointHelperProxy";
                proxyOriginal1.name = "jointHelperProxy";
                proxyOriginal2.name = "jointHelperProxy";
                proxyMedian.name = "jointHelperProxy";

                proxy1.userData = {
                    helperColor: "0xFF0000",
                    productionColor: "0xAEB9C2"
                };
                proxy2.userData = {
                    helperColor: "0x0000FF",
                    productionColor: "0xAEB9C2"
                };
                proxyOriginal1.userData = {
                    helperColor: "0xFF0000",
                    productionColor: "0xAEB9C2"
                };
                proxyOriginal2.userData = {
                    helperColor: "0x0000FF",
                    productionColor: "0xAEB9C2"
                };
                proxyMedian.userData = {
                    helperColor: "0x00FF00",
                    productionColor: "0xAEB9C2"
                };

                this.sceneHelper.addToScene(proxy1);
                this.sceneHelper.addToScene(proxy2);
                this.sceneHelper.addToScene(proxyOriginal1);
                this.sceneHelper.addToScene(proxyOriginal2);
                if(pairDirection === null) {
                    this.sceneHelper.addToScene(proxyMedian);
                }

                duct.segment.duct.userData.proxies = {
                    proxy1: proxy1, 
                    proxy2: proxy2,
                    proxyOriginal1: proxyOriginal1, 
                    proxyOriginal2: proxyOriginal2, 
                    proxyMedian: proxyMedian, 
                };

                for(const key in duct.segment.duct.userData.proxies) {
                    let proxy = duct.segment.duct.userData.proxies[key];
                    
                    const wireframe = new THREE.WireframeGeometry(proxy.geometry);
                    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                    const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);
                    wireframeMesh.visible = false;
                    proxy.add(wireframeMesh); // Add wireframe as a child of the original mesh
                }

                this.renderProxyVertices(proxy1Vertices, areHelpersOn);
                this.renderProxyVertices(proxy2Vertices, areHelpersOn);
                this.renderProxyVertices(proxyOriginal1Vertices, areHelpersOn);
                this.renderProxyVertices(proxyOriginal2Vertices, areHelpersOn);
            }
  
        }

        if(xzJointStyle == "diagonal") {
            this.alignProxyMediansOutwards(intersection, xzJointStyle); 
        } 
        else if(xzJointDirection == "inwards") {
            this.alignProxyMediansInwards(intersection); 
            
        }
        else if(xzJointDirection == "outwards") {
            this.alignProxyMediansOutwards(intersection); 
        }
                         
  
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                const proxyMedianVertices = this.mapProxyVertices(duct.segment.duct.userData.proxies.proxyMedian);
                duct.segment.duct.userData.proxyMedianVertices = proxyMedianVertices;
                duct.segment.duct.userData.proxyMedianVertices = proxyMedianVertices;
                this.renderProxyVertices(proxyMedianVertices, areHelpersOn);
            }
        }

        return largestGlobalSize;
  
    }

    moveProxyVertices(proxyGeometry, ductDepth, proxyLength, maxLength) {

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

    alignProxyMediansOutwards(intersection, xzJointStyle = null) {        
        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        let upProxies, rightProxies, leftProxies, downProxies = null;

        if(intersection.up) {
            upProxies =  intersection.up.segment.duct.userData.proxies;
        }
        if(intersection.right) {
            rightProxies =  intersection.right.segment.duct.userData.proxies;
        }
        if(intersection.left) {
            leftProxies =  intersection.left.segment.duct.userData.proxies;
        }
        if(intersection.down) {
            downProxies =  intersection.down.segment.duct.userData.proxies;
        }

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {
                upProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;
            }
            else if(intersection.down != null && intersection.right != null) {
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                rightProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
            }
            else if(intersection.up != null && intersection.left != null) {
                upProxies.proxyMedian.position.x = leftProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
            }
            else if(intersection.down != null && intersection.left != null) {
                leftProxies.proxyMedian.position.z = downProxies.proxy1.position.z;
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                
            }
        }
        else if(definedIntersectionCount == 3) {
            
            if(intersection.right == null) {
                upProxies.proxyMedian.position.x = leftProxies.proxyMedian.position.x;
                leftProxies.proxyMedian.position.z = downProxies.proxyMedian.position.z;

                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    downProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                }
                else {
                    downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                    downProxies.proxyMedian.position.z = upProxies.proxy2.position.z;
                }
            }
            else if(intersection.left == null) {
                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    upProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                }
                else {
                    upProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                }
                downProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;

                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;                
            }
            else if(intersection.down == null) {
                if(this.innerDim[intersection.left.xetoDuct.graphicLocation.size] > this.innerDim[intersection.right.xetoDuct.graphicLocation.size]) {
                    leftProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                    leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                }
                else {
                    leftProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                } 

                upProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;

                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;
                
            }
            else if(intersection.up == null) {
                leftProxies.proxyMedian.position.z = downProxies.proxy1.position.z;
                leftProxies.proxyMedian.position.x = leftProxies.proxy2.position.x;

                downProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;

                if(this.innerDim[intersection.left.xetoDuct.graphicLocation.size] > this.innerDim[intersection.right.xetoDuct.graphicLocation.size]) {
                    rightProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                }
                else {
                    rightProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;
                }                
            }
        }
        else if(definedIntersectionCount == 4) {
            // top-left median
            upProxies.proxyMedian.position.x = leftProxies.proxyMedian.position.x;
            // bottom-right median
            downProxies.proxyMedian.position.x = rightProxies.proxyMedian.position.x;
            // bottom-right median
            leftProxies.proxyMedian.position.z = downProxies.proxyMedian.position.z;
            // bottom-right median
            rightProxies.proxyMedian.position.z = upProxies.proxyMedian.position.z;

            if(xzJointStyle == "diagonal") {
                const distances = {
                    down: {
                        x: downProxies.proxyMedian.position.x - downProxies.proxy2.position.x
                    }
                }
                downProxies.proxyMedian.position.x -= distances.down.x; 
            }
        }
    }

    alignProxyMediansInwards(intersection) {        
        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        let upProxies, rightProxies, leftProxies, downProxies = null;

        if(intersection.up) {
            upProxies =  intersection.up.segment.duct.userData.proxies;
        }
        if(intersection.right) {
            rightProxies =  intersection.right.segment.duct.userData.proxies;
        }
        if(intersection.left) {
            leftProxies =  intersection.left.segment.duct.userData.proxies;
        }
        if(intersection.down) {
            downProxies =  intersection.down.segment.duct.userData.proxies;
        }

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {
                upProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
            }
            else if(intersection.down != null && intersection.right != null) {
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                rightProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
            }
            else if(intersection.up != null && intersection.left != null) {
                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                leftProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
            }
            else if(intersection.down != null && intersection.left != null) {
                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                
            }
        }
        else if(definedIntersectionCount == 3) {
            if(intersection.right == null) {
                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    downProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                }
                else {
                    downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                    downProxies.proxyMedian.position.z = upProxies.proxy2.position.z;
                }

            }
            else if(intersection.left == null) {
                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    upProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                }
                else {
                    upProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                }
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;                
            }
            else if(intersection.down == null) {
                if(this.innerDim[intersection.left.xetoDuct.graphicLocation.size] > this.innerDim[intersection.right.xetoDuct.graphicLocation.size]) {
                    leftProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                    leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                }
                else {
                    leftProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                } 

                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                
            }
            else if(intersection.up == null) {
                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                if(this.innerDim[intersection.left.xetoDuct.graphicLocation.size] > this.innerDim[intersection.right.xetoDuct.graphicLocation.size]) {
                    rightProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                }
                else {
                    rightProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;
                }                
            }
        }
        else if(definedIntersectionCount == 4) {
            // top-left median
            upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
            // bottom-right median
            downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
            downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
            // bottom-left median
            leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
            leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
            // top-right median
            rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
        }
    }

    mapProxyVertices(proxy) {
        const detachedProxy = proxy.clone();
        const proxyBB = new THREE.Box3().setFromObject(detachedProxy);
        const proxyMin = proxyBB.min;
        const proxyMax = proxyBB.max;
  
        const proxyCorners = [
          new THREE.Vector3(proxyMin.x, proxyMin.y, proxyMax.z),
          new THREE.Vector3(proxyMin.x, proxyMin.y, proxyMin.z),
          new THREE.Vector3(proxyMax.x, proxyMin.y, proxyMin.z),
          new THREE.Vector3(proxyMax.x, proxyMin.y, proxyMax.z),
  
          new THREE.Vector3(proxyMin.x, proxyMax.y, proxyMax.z),
          new THREE.Vector3(proxyMin.x, proxyMax.y, proxyMin.z),
          new THREE.Vector3(proxyMax.x, proxyMax.y, proxyMin.z),
          new THREE.Vector3(proxyMax.x, proxyMax.y, proxyMax.z),
        ];
  
        return proxyCorners;
    }

    renderProxyVertices(proxyCorners, areHelpersOn) {

        let indicatorSize = 27;
        if(indicatorSize > 30) {
            indicatorSize = 30;
        }

        const createTextCanvasTexture = (text) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const size = 1000; // Higher size for better resolution
            canvas.width = size;
            canvas.height = size;

            // Fill the canvas with a background color
            context.fillStyle = 'green';
            context.fillRect(0, 0, size, size);

            // Draw the text
            context.fillStyle = 'black';
            context.font = 'bold 800px Arial'; // Adjust font size and style
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, size / 2, size / 2);

            // Create a texture from the canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true; // Ensure the texture is updated
            return texture;
        };

        proxyCorners.forEach((proxyCorner, index) => {
            const textTexture = createTextCanvasTexture(index.toString());

            const material = new THREE.MeshStandardMaterial({
                map: textTexture,
                transparent: true,
            });

            const vertexGeometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
            const vertexIndicator = new THREE.Mesh(vertexGeometry, material);

            if(index >= 4 && index <= 7) {
                vertexIndicator.rotation.y += Math.PI;
            }            

            vertexIndicator.position.copy(proxyCorner);
            vertexIndicator.name = "jointHelperVertices";
            vertexIndicator.visible = areHelpersOn;
            this.sceneHelper.addToScene(vertexIndicator);
        });
        
    }
}
