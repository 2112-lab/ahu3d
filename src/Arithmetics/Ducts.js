import * as THREE from 'three';
import {getSegmentDirection, seperateByDirections, translateAssemblySegment, orientAssemblySegment} from "./Basic.js";
import Joints from "./Joints.js";
import Joints3D_L from "../3D/Geometry/Joints/Joints3D-L.js";

export default class Ducts {
    constructor(
        innerDuctDimensions, 
        ductsDictionary, 
        primaryColor, 
        Mesh3D, 
        componentLibrary, 
        ahuGroup, 
        sceneHelper
    ) {
        this.innerDuctDimensions = innerDuctDimensions;
        this.ductsDictionary = ductsDictionary;
        this.primaryColor = primaryColor;
        this.Mesh3D = Mesh3D;
        this.componentLibrary = componentLibrary;
        this.ductEntry = componentLibrary['LinearDuctSliced']; // Retrieve the duct component from the library.
        this.ahuGroup = ahuGroup;
        
        this.Joints = new Joints(this.ahuGroup, this.innerDuctDimensions, sceneHelper, primaryColor);
        this.Joints3D_L = new Joints3D_L();
    }

    async initializeAllDuctSegments(cleanedXeto) {

        let assemblySegments = [];

        let xetoDuctKeys = cleanedXeto.filter(child => child.spec.includes('AhuGroup'))[0].ducts; // Retrieve the list of duct keys.

        for (const i in xetoDuctKeys) { // Iterate over each duct key.
            const duct = {
                userData: {
                    component: JSON.parse(JSON.stringify(this.ductEntry)), // Clone the duct component.
                }
            }

            let xetoDuctKey = xetoDuctKeys[i]; // Get the current duct key.

            let xetoDuct = cleanedXeto.filter(child => child.id.includes(xetoDuctKey))[0]; // Find the corresponding duct in the assembly.
            
            const segment = await this.initializeDuctSegment(duct, xetoDuct, cleanedXeto); // Build the assembly segment for the duct.

            assemblySegments.push({ xetoDuct: xetoDuct, segment: segment }); // Add the segment to the assembly segments array.
        }   

        return assemblySegments;
    }

    /**
     * initializeDuctSegment
     * 
     * Builds an assembly segment by loading component meshes, positioning them, and 
     * calculating the required duct length and positioning of components within the duct.
     * 
     * @param {Object} duct - The duct to build the assembly within.
     * @param {Array} components - The components to be included in the assembly.
     * @returns {Object} The built assembly segment containing the duct and its components.
     */
    async initializeDuctSegment(duct, xetoDuct, cleanedXeto) {
        console.log("initializeDuctSegment started:", duct, xetoDuct);

        let components = xetoDuct.components; 

        if (xetoDuct.blockStyle.flowDirection == 'endToStart') {
            components.reverse();
        }

        console.log("xetoDuct:", xetoDuct);

        // const size = this.innerDuctDimensions[xetoDuct.graphicLocation.size];
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
            const meshes = await this.Mesh3D.loadAssemblyMeshes(cleanedXeto, components, this.componentLibrary); // Load the component meshes for the assembly.

            if(meshes.length > 0) {
                for (const i in meshes) { // Iterate over each mesh.
                    meshes[i].userData.component.object.position.z = ductDimensions.z / 2; // Position the mesh along the z-axis.
                    meshes[i].userData.component.object.position.x = 0; // Reset the x-position of the mesh.
                    meshes[i].userData.component.object.position.y = 0; // Reset the y-position of the mesh.
                }
            }
            
            const componentScale = this.innerDuctDimensions[xetoDuct.graphicLocation.size] / 1000;
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

            const innerDuctDimensionsension = this.innerDuctDimensions[xetoDuct.graphicLocation.size];
            if(innerDuctDimensionsension == null) {
                alert(`Duct ${xetoDuct.id}'s size (${xetoDuct.graphicLocation.size}) is not valid.`)
            }
            let ductSize = innerDuctDimensionsension;  

            duct.userData.component.object.scale.x = attributes.length.value / ductSize; // Scale the duct's x-dimension.
            duct.userData.component.object.boundingBox.dimensions.x = attributes.length.value; // Update the duct's bounding box x-dimension.

            duct.userData.component.object.innerDuctDimensionsensions = xetoDuct.isVertical ? 
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

            // console.log("initializeDuctSegment duct:", duct.userData.component.object.position.z);

            return { duct: duct, meshes: meshes, joints: [], ends: [], arrows: [], textMeshes: [] }; // Return the built assembly segment.
        } 
        catch (error) {
            console.error("Error in initializeDuctSegment:", error); // Log any errors that occur during the build process.
            throw error; // Re-throw the error for further handling.
        }
    }

    getPrimaryKey() {
        for(const key in this.ductsDictionary) {
            if(this.ductsDictionary[key].length == 1) {
                return key;
            }
        }
    }

    /**
     * placeSegments
     * 
     * Places assembly segments in the correct position and orientation based on their relationship 
     * to the primary segment and other segments in the assembly.
     * 
     * @returns {Array} The placed assembly segments.
     */
    async placeSegments(assemblySegments) {
        this.assemblySegments = assemblySegments;

        const primaryKey = this.getPrimaryKey();

        const primarySegmentXeto = this.ductsDictionary[primaryKey][0];

        let primarySegment = assemblySegments.filter(child => 
            child.xetoDuct.id === primarySegmentXeto.id
        )[0];

        let primarySegmentOrientation = primarySegment.xetoDuct.orientation;
        orientAssemblySegment(primarySegment.segment, primarySegmentOrientation);
        primarySegmentXeto.isPositioned = true;

        this.getNextSegment(primarySegmentXeto, primaryKey);     

        return assemblySegments; // Return the placed assembly segments.  
    }

    /**
     * getNextSegment
     * 
     * Recursively retrieves the next segment in a sequence based on the current segment's direction and placement.
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

        let xzJointPadding = this.ahuGroup.blockStyle.joints.XZ.padding;

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
            getSegmentDirection(fixedSegment, key);
            console.log("placeIntersection 4* fixedSegment:", fixedSegment);

            let intersectSegments = {
                up: null, 
                down: null,
                left: null, 
                right: null
            }

            for(const currentSegment of currentSegments) {
                getSegmentDirection(currentSegment, key);
                console.log("placeIntersection 4* currentSegment:", currentSegment);
            }

            seperateByDirections(intersectSegments, fixedSegment, currentSegments);
            console.log("placeIntersection 4* intersectSegments:", intersectSegments);

            if(intersectSegments.up.xetoDuct.isPositioned != true) {
                let currentSegmentOrientation = intersectSegments.up.xetoDuct.orientation;
                orientAssemblySegment(intersectSegments.up.segment, currentSegmentOrientation);
            }
            if(intersectSegments.down.xetoDuct.isPositioned != true) {
                let currentSegmentOrientation = intersectSegments.down.xetoDuct.orientation;
                orientAssemblySegment(intersectSegments.down.segment, currentSegmentOrientation);
            }

            for(const currentSegment of currentSegments) {
                console.log("placeIntersection 4* currentSegment:", currentSegment);
                let lengthToAdjacent = 0;
                lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.x - currentSegment.segment.duct.userData.component.object.position.x;
                translateAssemblySegment(currentSegment.segment, 'x', lengthToAdjacent);
                lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.z - currentSegment.segment.duct.userData.component.object.position.z;
                translateAssemblySegment(currentSegment.segment, 'z', lengthToAdjacent);
            }

            const upSize = intersectSegments.up.xetoDuct.graphicLocation.size;
            const downSize = intersectSegments.down.xetoDuct.graphicLocation.size;
            const leftSize = intersectSegments.left.xetoDuct.graphicLocation.size;
            const rightSize = intersectSegments.right.xetoDuct.graphicLocation.size;
            let maxHalfWidth = this.innerDuctDimensions[upSize] > this.innerDuctDimensions[downSize] ? this.innerDuctDimensions[upSize] / 2 : this.innerDuctDimensions[downSize] / 2;
            let maxHalfHeight = this.innerDuctDimensions[rightSize] > this.innerDuctDimensions[leftSize] ? this.innerDuctDimensions[rightSize] / 2 : this.innerDuctDimensions[leftSize] / 2;

            if(intersectSegments.left == fixedSegment) {
                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.up.segment, "x", (length * 1));

                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.down.segment, "x", (length * 1));

                length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth * 2 + 30;
                length += xzJointPadding * 2;
                translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
            }
            else if(intersectSegments.right == fixedSegment) {
                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.up.segment, "x", (length * -1));

                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.down.segment, "x", (length * -1));

                length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth * 2 + 30;
                length += xzJointPadding * 2;
                translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
            }
            else if(intersectSegments.up == fixedSegment) {
                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight * 2 + 30;
                length += xzJointPadding * 2;
                translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.left.segment, "z", (length * -1));

                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));

                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.right.segment, "z", (length * -1));

                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
            }
            else if(intersectSegments.down == fixedSegment) {
                length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight * 2 + 30;
                length += xzJointPadding * 2;
                translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.left.segment, "z", (length * 1));

                length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));

                length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.right.segment, "z", (length * 1));

                length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
            }
                
            const largestGlobalSize = this.Joints.createJointProxies(intersectSegments, null);
            this.Joints.createCrossJoint(intersectSegments, largestGlobalSize);
            

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
            getSegmentDirection(fixedSegment, key);
            console.log("placeIntersection 3* fixedSegment:", fixedSegment);
    
            let intersectSegments = {
                up: null,
                down: null,
                left: null,
                right: null
            };
    
            for (const currentSegment of currentSegments) {
                getSegmentDirection(currentSegment, key);
                console.log("placeIntersection 3* currentSegment:", currentSegment);
            }
    
            seperateByDirections(intersectSegments, fixedSegment, currentSegments);
            console.log("placeIntersection 3* intersectSegments:", intersectSegments);

            if(intersectSegments.up != null && intersectSegments.up.xetoDuct.isPositioned != true) {
                let currentSegmentOrientation = intersectSegments.up.xetoDuct.orientation;
                orientAssemblySegment(intersectSegments.up.segment, currentSegmentOrientation);
            }            

            if(intersectSegments.down != null && intersectSegments.down.xetoDuct.isPositioned != true) {
                let currentSegmentOrientation = intersectSegments.down.xetoDuct.orientation;
                orientAssemblySegment(intersectSegments.down.segment, currentSegmentOrientation);
            }
            
    
            for (const currentSegment of currentSegments) {
                let lengthToAdjacent = 0;
                lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.x - currentSegment.segment.duct.userData.component.object.position.x;
                translateAssemblySegment(currentSegment.segment, 'x', lengthToAdjacent);
                lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.z - currentSegment.segment.duct.userData.component.object.position.z;
                translateAssemblySegment(currentSegment.segment, 'z', lengthToAdjacent);
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
                let maxHalfWidth = this.innerDuctDimensions[upSize] > this.innerDuctDimensions[downSize] ? this.innerDuctDimensions[upSize] / 2 : this.innerDuctDimensions[downSize] / 2;
                let maxHalfHeight = this.innerDuctDimensions[rightSize] / 2;

                if(fixedSegment == intersectSegments.right) {
                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.down.segment, "x", (length * -1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "x", (length * -1));
                }

                if(fixedSegment == intersectSegments.up) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding * 2;
                    translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.right.segment, "z", (length * -1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
                }

                if(fixedSegment == intersectSegments.down) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding * 2;
                    translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.right.segment, "z", (length * 1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
                }
            }

            if(intersectSegments.right == null) {
                const upSize = intersectSegments.up.xetoDuct.graphicLocation.size;
                const downSize = intersectSegments.down.xetoDuct.graphicLocation.size;
                const leftSize = intersectSegments.left.xetoDuct.graphicLocation.size;

                let maxHalfWidth = this.innerDuctDimensions[upSize] > this.innerDuctDimensions[downSize] ? this.innerDuctDimensions[upSize] / 2 : this.innerDuctDimensions[downSize] / 2;
                let maxHalfHeight = this.innerDuctDimensions[leftSize] / 2;

                if(fixedSegment == intersectSegments.left) {
                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.down.segment, "x", (length * 1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "x", (length * 1));
                }

                if(fixedSegment == intersectSegments.up) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding * 2;
                    translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "z", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
                }

                if(fixedSegment == intersectSegments.down) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "z", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
                }
            }

            if(intersectSegments.down == null) {
                const upSize = intersectSegments.up.xetoDuct.graphicLocation.size;
                const leftSize = intersectSegments.left.xetoDuct.graphicLocation.size;
                const rightSize = intersectSegments.right.xetoDuct.graphicLocation.size;
                
                let maxHalfWidth = this.innerDuctDimensions[upSize] / 2;
                let maxHalfHeight = this.innerDuctDimensions[leftSize] > this.innerDuctDimensions[rightSize] ? this.innerDuctDimensions[leftSize] / 2 : this.innerDuctDimensions[rightSize] / 2;

                if(fixedSegment == intersectSegments.left) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "x", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding * 2;
                    translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
                }

                if(fixedSegment == intersectSegments.right) {
                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "z", (length * 1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.up.segment, "x", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
                }

                if(fixedSegment == intersectSegments.up) {
                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "z", (length * -1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));

                    length = ((intersectSegments.up.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.right.segment, "z", (length * -1));
                }
            }

            if(intersectSegments.up == null) {
                const downSize = intersectSegments.down.xetoDuct.graphicLocation.size;
                const leftSize = intersectSegments.left.xetoDuct.graphicLocation.size;
                const rightSize = intersectSegments.right.xetoDuct.graphicLocation.size;
                
                let maxHalfWidth = this.innerDuctDimensions[downSize] / 2;
                let maxHalfHeight = this.innerDuctDimensions[leftSize] > this.innerDuctDimensions[rightSize] ? this.innerDuctDimensions[leftSize] / 2 : this.innerDuctDimensions[rightSize] / 2;

                if(fixedSegment == intersectSegments.left) {
                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.down.segment, "x", (length * 1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding * 2;
                    translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));
                }

                if(fixedSegment == intersectSegments.right) {
                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.down.segment, "z", (length * -1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.down.segment, "x", (length * -1));

                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));
                }

                if(fixedSegment == intersectSegments.down) {
                    length = ((intersectSegments.left.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "x", (length * -1));

                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.left.segment, "z", (length * 1));

                    length = ((intersectSegments.right.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.right.segment, "x", (length * 1));

                    length = ((intersectSegments.down.segment.duct.userData.component.attributes.length.value) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateAssemblySegment(intersectSegments.right.segment, "z", (length * 1));
                }
            }

            const largestGlobalSize = this.Joints.createJointProxies(intersectSegments, null);
            this.Joints.createTJoint(intersectSegments, largestGlobalSize);
    
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
            getSegmentDirection(fixedSegment, key);
            console.log("placeIntersection 2* fixedSegment:", fixedSegment);

            let intersectSegments = {
                up: null, 
                down: null,
                left: null, 
                right: null
            }

            let currentSegment = currentSegments[0];
            getSegmentDirection(currentSegment, key);

            seperateByDirections(intersectSegments, fixedSegment, currentSegments);

            if(intersectSegments.up) {
                let currentSegmentOrientation = currentSegment.xetoDuct.orientation;
                orientAssemblySegment(currentSegment.segment, currentSegmentOrientation);
            }
            else if(intersectSegments.down) {
                let currentSegmentOrientation = currentSegment.xetoDuct.orientation;
                orientAssemblySegment(currentSegment.segment, currentSegmentOrientation);
            }            

            let lengthToAdjacent = 0;
            lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.x - currentSegment.segment.duct.userData.component.object.position.x;
            translateAssemblySegment(currentSegment.segment, 'x', lengthToAdjacent);
            lengthToAdjacent = fixedSegment.segment.duct.userData.component.object.position.z - currentSegment.segment.duct.userData.component.object.position.z;
            translateAssemblySegment(currentSegment.segment, 'z', lengthToAdjacent);

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
                    translateAssemblySegment(currentSegment.segment, 'x', length * 1);
                }
                else if(currentSegment.relativePosition == "left") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'x', length * -1);
                }
                else if(currentSegment.relativePosition == "up") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'z', (length * 1));
                }
                else if(currentSegment.relativePosition == "down") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'z', (length * -1));
                }
            }
            else if(fixedSegment.xetoDuct.isVertical != currentSegment.xetoDuct.isVertical) {
                if(fixedSegment.relativePosition == "left") {
                    length = ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2) + this.innerDuctDimensions[currentSegment.xetoDuct.graphicLocation.size] / 2;
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, "x", (length * 1) + 15);
                }
                else if(fixedSegment.relativePosition == "right") {
                    length = ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2) + this.innerDuctDimensions[currentSegment.xetoDuct.graphicLocation.size] / 2;
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, "x", (length * -1) - 15);
                }
                if(fixedSegment.relativePosition == "up") {
                    length = ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDuctDimensions[currentSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'z', (length * -1) - 15);
                }
                else if(fixedSegment.relativePosition == "down") {
                    length = ((fixedSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDuctDimensions[currentSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'z', (length * 1) + 15);
                }

                if(currentSegment.relativePosition == "up") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDuctDimensions[fixedSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'z', (length * 1) + 15);
                }
                else if(currentSegment.relativePosition == "down") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDuctDimensions[fixedSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'z', (length * -1) - 15);
                }
                else if(currentSegment.relativePosition == "left") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDuctDimensions[fixedSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'x', (length * -1) - 15);
                }
                else if(currentSegment.relativePosition == "right") {
                    length = ((currentSegment.segment.duct.userData.component.attributes.length.value) / 2) + (this.innerDuctDimensions[fixedSegment.xetoDuct.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateAssemblySegment(currentSegment.segment, 'x', (length * 1) + 15);
                }
            }

            const largestGlobalSize = this.Joints.createJointProxies(intersectSegments, pairDirection);
            if(pairDirection) {
                this.Joints.createParallelJoint(intersectSegments, pairDirection);
            }
            else {
                this.Joints.createLJoint(intersectSegments, largestGlobalSize);
            }
            
        }

        for(const traversedSegmentXeto of this.ductsDictionary[key]) {
            if(traversedSegmentXeto.isPositioned != true) {
                console.log("placeIntersection traversedSegmentXeto.id", traversedSegmentXeto.id);
            }
            traversedSegmentXeto.isPositioned = true;
        }
        
    }
}