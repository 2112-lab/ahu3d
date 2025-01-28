import * as THREE from 'three';
import {
    getSegmentDirection, 
    getDuctDirection, 
    seperateByDirections, 
    translateDuct, 
    translateAssemblySegment, 
    orientAssemblySegment, 
    orientDuct,
} from "./Basic.js";
import { sharedData } from "../Ahu3D/globals.js";
import Joints from "./Joints.js";
import Geometry_3D_Joints_Cross from "../3D/Geometry/Joints/Geometry_3D_Joints_Cross.js";
import Geometry_3D_Joints_T from "../3D/Geometry/Joints/Geometry_3D_Joints_T.js";
import Geometry_3D_Joints_L from "../3D/Geometry/Joints/Geometry_3D_Joints_L.js";
import Geometry_3D_Joints_Colinear from "../3D/Geometry/Joints/Geometry_3D_Joints_Colinear.js";

export default class Ducts {
    constructor(
        ductsDictionary, 
        Mesh3D, 
        componentLibrary, 
        ahuGroup, 
        sceneHelper,
        ahuObject
    ) {
        this.innerDuctDimensions = sharedData.innerDuctDimensions;
        this.ductsDictionary = ductsDictionary;
        this.primaryColor = sharedData.primaryColor;
        this.Mesh3D = Mesh3D;
        this.componentLibrary = componentLibrary;
        // this.ductEntry = componentLibrary['LinearDuctSliced']; // Retrieve the duct component from the library.
        this.ahuGroup = ahuGroup;
        this.ahuObject = ahuObject;
        
        this.Joints = new Joints(this.ahuGroup, this.innerDuctDimensions, sceneHelper);
        this.Geometry_3D_Joints_Cross = new Geometry_3D_Joints_Cross();
        this.Geometry_3D_Joints_T = new Geometry_3D_Joints_T();
        this.Geometry_3D_Joints_L = new Geometry_3D_Joints_L();
        this.Geometry_3D_Joints_Colinear = new Geometry_3D_Joints_Colinear();

        this.jointCount = 0;
    }

    async initializeAllDuctSegments(ahuObject) {
        const ducts = Object.keys(ahuObject.resources.ducts);
        for (const i in ducts) { // Iterate over each duct key.
            this.initializeDuctSegment(ahuObject, ducts[i]); // Build the assembly segment for the duct.
        } 
        console.log("initializeDuctSegment:", ahuObject);
    }

    initializeDuctSegment(ahuObject, ductKey) {
        console.log("initializeDuctSegment started:", ahuObject, ductKey);

        ahuObject.resources.ducts[ductKey].position = {x: 0, y: 0, z: 0};
        ahuObject.resources.ducts[ductKey].rotation = {x: 0, y: 0, z: 0};

        if (ahuObject.xetoDictionary.edges[ductKey].orientation == 'north') {
            ahuObject.resources.ducts[ductKey].rotation.y = -90;
        }
        else if (ahuObject.xetoDictionary.edges[ductKey].orientation == 'south') {
            ahuObject.resources.ducts[ductKey].rotation.y = 90;
        }
        else if (ahuObject.xetoDictionary.edges[ductKey].orientation == 'west') {
            ahuObject.resources.ducts[ductKey].rotation.y = 180;
        }

        console.log("initializeDuctSegment step 1:", sharedData.innerDuctDimensions );

        const innerDimension = sharedData.innerDuctDimensions[ahuObject.xetoDictionary.edges[ductKey].graphicLocation.size];

        console.log("initializeDuctSegment step 2:", innerDimension );

        const componentScale = innerDimension / 1000;

        const componentPadding = ahuObject.xetoDictionary.edges[ductKey].blockStyle.componentPadding;

        console.log("initializeDuctSegment step 3");

        let totalSpan = 0;
        for(const uniqueId of ahuObject.associations.ducts[ductKey].components) {
            console.log("initializeDuctSegment step 3.1:", ahuObject.xetoDictionary.components[uniqueId]);
            let componentKey = ahuObject.xetoDictionary.components[uniqueId].componentId.split("r:novo.graphics::").pop();
            console.log("initializeDuctSegment step 3.2:", componentKey);
            console.log("initializeDuctSegment step 3.2:", sharedData.componentLibrary);
            ahuObject.resources.components[uniqueId].dimensions = sharedData.componentLibrary[componentKey].object.boundingBox.dimensions;
            console.log("initializeDuctSegment step 3.3");

            ahuObject.resources.components[uniqueId].scale = {
                x: componentScale,
                y: componentScale,
                z: componentScale
            };

            console.log("initializeDuctSegment step 3.4");

            ahuObject.resources.components[uniqueId].dimensions.x *= componentScale;
            ahuObject.resources.components[uniqueId].dimensions.y *= componentScale;
            ahuObject.resources.components[uniqueId].dimensions.z *= componentScale;

            ahuObject.resources.components[uniqueId].position = {x: 0, y: 0, z: 0};
            ahuObject.resources.components[uniqueId].rotation = {x: 0, y: 0, z: 0};

            totalSpan += componentPadding.startSpace + ahuObject.resources.components[uniqueId].dimensions.x + componentPadding.endSpace + 100;
        }

        console.log("initializeDuctSegment step 4");

        const halfTotalSpan = totalSpan / 2;
        for(const uniqueId of ahuObject.associations.ducts[ductKey].components) {
            const componentHalfWidth = ahuObject.resources.components[uniqueId].dimensions.x / 2;
            ahuObject.resources.components[uniqueId].position.x -= (halfTotalSpan - componentHalfWidth);
        }

        console.log("initializeDuctSegment step 5");

        let componentKeys = ahuObject.associations.ducts[ductKey].components;

        let componentKeysLength = Object.keys(componentKeys).length;

        console.log("componentKeys:", componentKeys);

        ahuObject.resources.components[componentKeys[0]].position.x += componentPadding.startSpace;

        console.log("initializeDuctSegment moving components starting:", ahuObject, componentKeysLength, componentKeys);
        for(let i = 1; i <= componentKeys.length-1; i++) {
            console.log("initializeDuctSegment moving components index:", i);

            console.log("initializeDuctSegment moving previousComponent key:", componentKeys[i-1]);
            console.log("initializeDuctSegment moving currentComponent key:", componentKeys[i]);

            const previousComponent = ahuObject.resources.components[componentKeys[i-1]];
            const currentComponent = ahuObject.resources.components[componentKeys[i]];

            console.log("initializeDuctSegment moving previousComponent:", previousComponent);
            console.log("initializeDuctSegment moving currentComponent:", currentComponent);

            const previousComponentHalfWidth = previousComponent.dimensions.x / 2;
            const currentComponentHalfWidth = currentComponent.dimensions.x / 2;

            currentComponent.position.x = previousComponent.position.x;

            currentComponent.position.x += previousComponentHalfWidth;
            currentComponent.position.x += currentComponentHalfWidth;
            currentComponent.position.x += componentPadding.startSpace;
            currentComponent.position.x += componentPadding.endSpace;

            console.log("initializeDuctSegment moving finished loop:", currentComponent);
        }

        console.log("initializeDuctSegment moving finished");

        ahuObject.resources.ducts[ductKey].dimensions = {
            x: totalSpan, 
            y: innerDimension, 
            z: innerDimension
        };

        return
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
    async placeSegments(ahuObject) {
        console.log("placeSegments started:", ahuObject);
        this.ahuObject = ahuObject;

        const primaryKey = this.getPrimaryKey();

        console.log("placeSegments ahuObject.xetoDictionary.edges:", ahuObject.xetoDictionary.edges);
        const edgeKeys = Object.keys(ahuObject.xetoDictionary.edges); 
        console.log("placeSegments edgeKeys:", edgeKeys);

        const primarySegmentXeto = ahuObject.xetoDictionary.edges[edgeKeys[0]];

        console.log("placeSegments primarySegmentXeto:", primarySegmentXeto);

        // let primarySegment = assemblySegments.filter(child => 
        //     child.xetoDuct.id === primarySegmentXeto.id
        // )[0];

        // console.log("placeSegments primarySegment:", primarySegment);

        let primarySegmentOrientation = primarySegmentXeto.orientation;

        console.log("placeSegments primarySegmentOrientation:", primarySegmentOrientation);
        console.log("placeSegments ahuObject.resources.ducts:", ahuObject.resources.ducts);

        if (primarySegmentOrientation == 'north') {
            ahuObject.resources.ducts[primarySegmentXeto.id].rotation.y = -90;
        }
        else if (primarySegmentOrientation == 'south') {
            ahuObject.resources.ducts[primarySegmentXeto.id].rotation.y = 90;
        }
        else if (primarySegmentOrientation == 'west') {
            ahuObject.resources.ducts[primarySegmentXeto.id].rotation.y = 180;
        }

        // orientDuct(primarySegmentXeto, primarySegmentOrientation);
        primarySegmentXeto.isPositioned = true;

        this.getNextSegment(primarySegmentXeto, primaryKey);     

        // this.transformEnds();
        this.reTransformComponents();

        console.log("placeSegments this.ahuObject:", this.ahuObject);
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

    addJointRsrcAndAssoc(ductsDictionary, key){
        this.jointCount++;
        console.log("addJointRsrcAndAssoc ductsDictionary and key:", ductsDictionary, key);

        if(this.ahuObject.associations.joints[`Joint-${key}`] == undefined) {
            this.ahuObject.associations.joints[`Joint-${key}`] = {};
            this.ahuObject.associations.joints[`Joint-${key}`].ducts = [];
            this.ahuObject.resources.joints[`Joint-${key}`] = {};
        }

        for(const i in ductsDictionary[key]) {
            this.ahuObject.associations.joints[`Joint-${key}`].ducts.push(ductsDictionary[key][i].id);
            this.ahuObject.associations.ducts[ductsDictionary[key][i].id].joints.push(`Joint-${key}`);
        }      
        
        console.log("addJointRsrcAndAssoc result:", this.ahuObject);
        
    }

    placeIntersection(key) {
        console.log("placeIntersection started:", this.ahuObject);

        let jointGeometry = null;
        let proxyGeometry = null;
        let largestGlobalSize = 1000;

        if(this.ductsDictionary[key].length >= 2 && this.ductsDictionary[key].length <= 4) {
            this.addJointRsrcAndAssoc(this.ductsDictionary, key);
        }

        let xzJointPadding = this.ahuGroup.blockStyle.joints.XZ.padding;

        if(this.ductsDictionary[key].length == 4) {
            console.log("placeIntersection 4*");

            let currentDuctXetos = this.ahuObject.xeto.filter(child => 
                child.id === this.ductsDictionary[key][0].id ||
                child.id === this.ductsDictionary[key][1].id ||
                child.id === this.ductsDictionary[key][2].id ||
                child.id === this.ductsDictionary[key][3].id
            );
            
            let fixedDuctXeto = null;
            for(const i in currentDuctXetos) {
                
                if(currentDuctXetos[i].isPositioned) {
                    fixedDuctXeto = currentDuctXetos[i];
                    currentDuctXetos.splice(i, 1);
                    break;
                }
            }
            fixedDuctXeto.relativePosition = getDuctDirection(fixedDuctXeto, key, this.ahuObject);
            console.log("placeIntersection 4* fixedDuctXeto:", fixedDuctXeto);

            let intersectDucts = {
                up: null, 
                down: null,
                left: null, 
                right: null
            }

            for(const currentDuctXeto of currentDuctXetos) {
                currentDuctXeto.relativePosition = getDuctDirection(currentDuctXeto, key, this.ahuObject);
                console.log("placeIntersection 4* currentDuctXeto:", currentDuctXeto);
            }

            console.log("placeIntersection 4* intersectDucts:", intersectDucts);

            seperateByDirections(intersectDucts, fixedDuctXeto, currentDuctXetos);
            console.log("placeIntersection 4* intersectDucts:", intersectDucts);

            // if(intersectDucts.up.isPositioned != true) {
            //     let currentDuctOrientation = intersectDucts.up.orientation;
            //     orientDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], currentDuctOrientation);
            // }
            // if(intersectDucts.down.isPositioned != true) {
            //     let currentDuctOrientation = intersectDucts.down.orientation;
            //     orientDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], currentDuctOrientation);
            // }

            for(const currentDuctXeto of currentDuctXetos) {
                console.log("placeIntersection 4* currentDuctXeto:", currentDuctXeto);
                let lengthToAdjacent = 0;
                lengthToAdjacent = this.ahuObject.resources.ducts[fixedDuctXeto.id].position.x - this.ahuObject.resources.ducts[currentDuctXeto.id].position.x;
                translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', lengthToAdjacent);
                lengthToAdjacent = this.ahuObject.resources.ducts[fixedDuctXeto.id].position.z - this.ahuObject.resources.ducts[currentDuctXeto.id].position.z;
                translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', lengthToAdjacent);
            }

            const upSize = intersectDucts.up.graphicLocation.size;
            const downSize = intersectDucts.down.graphicLocation.size;
            const leftSize = intersectDucts.left.graphicLocation.size;
            const rightSize = intersectDucts.right.graphicLocation.size;
            let maxHalfWidth = this.innerDuctDimensions[upSize] > this.innerDuctDimensions[downSize] ? this.innerDuctDimensions[upSize] / 2 : this.innerDuctDimensions[downSize] / 2;
            let maxHalfHeight = this.innerDuctDimensions[rightSize] > this.innerDuctDimensions[leftSize] ? this.innerDuctDimensions[rightSize] / 2 : this.innerDuctDimensions[leftSize] / 2;

            console.log("placeIntersection 4* intersectDucts 123:", intersectDucts);
            
            if(intersectDucts.left == fixedDuctXeto) {
                console.log("placeIntersection 4* step 1");
                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                console.log("placeIntersection 4* step 2");
                length += maxHalfWidth + 15;
                console.log("placeIntersection 4* step 3");
                length += xzJointPadding;
                console.log("placeIntersection 4* step 4");
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * 1));

                console.log("placeIntersection 4* step 5");

                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth * 2 + 30;
                length += xzJointPadding * 2;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
            }
            else if(intersectDucts.right == fixedDuctXeto) {
                console.log("placeIntersection 4* step 6");
                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth * 2 + 30;
                length += xzJointPadding * 2;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
            }
            else if(intersectDucts.up == fixedDuctXeto) {
                console.log("placeIntersection 4* step 7");
                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight * 2 + 30;
                length += xzJointPadding * 2;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
            }
            else if(intersectDucts.down == fixedDuctXeto) {
                console.log("placeIntersection 4* step 8");
                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight * 2 + 30;
                length += xzJointPadding * 2;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += xzJointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
            }

            console.log("placeIntersection 4* step 9");
                
            this.Joints.createJointProxies(intersectDucts, this.ahuObject, key, largestGlobalSize);

            console.log("placeIntersection 4* step 10");

            this.ahuObject.resources.joints[`Joint-${key}`].intersectDucts = intersectDucts;
            this.ahuObject.resources.joints[`Joint-${key}`].largestGlobalSize = largestGlobalSize;
            this.ahuObject.resources.joints[`Joint-${key}`].key = key;
            this.ahuObject.resources.joints[`Joint-${key}`].pairDirection = null;
            
            console.log("placeIntersection 4* step 11");

        }
        else if (this.ductsDictionary[key].length == 3) {
            console.log("placeIntersection length 3");
    
            let currentDuctXetos = this.ahuObject.xeto.filter(child => 
                child.id === this.ductsDictionary[key][0].id ||
                child.id === this.ductsDictionary[key][1].id ||
                child.id === this.ductsDictionary[key][2].id
            );
    
            let fixedDuctXeto = null;
            for (const i in currentDuctXetos) {
                if (currentDuctXetos[i].isPositioned) {
                    fixedDuctXeto = currentDuctXetos[i];
                    currentDuctXetos.splice(i, 1);
                    break;
                }
            }
            fixedDuctXeto.relativePosition = getDuctDirection(fixedDuctXeto, key, this.ahuObject);
            console.log("placeIntersection 3* fixedDuctXeto:", fixedDuctXeto);
    
            let intersectDucts = {
                up: null,
                down: null,
                left: null,
                right: null
            };
    
            for (const currentDuctXeto of currentDuctXetos) {
                currentDuctXeto.relativePosition = getDuctDirection(currentDuctXeto, key, this.ahuObject);
                console.log("placeIntersection 3* currentDuctXeto:", currentDuctXeto);
            }
    
            seperateByDirections(intersectDucts, fixedDuctXeto, currentDuctXetos);
            console.log("placeIntersection 3* intersectDucts:", intersectDucts);

            // if(intersectDucts.up != null && intersectDucts.up.isPositioned != true) {
            //     let currentDuctOrientation = intersectDucts.up.orientation;
            //     orientDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], currentDuctOrientation);
            // }            

            // if(intersectDucts.down != null && intersectDucts.down.isPositioned != true) {
            //     let currentDuctOrientation = intersectDucts.down.orientation;
            //     orientDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], currentDuctOrientation);
            // }
            
    
            for (const currentDuctXeto of currentDuctXetos) {
                let lengthToAdjacent = 0;
                lengthToAdjacent = this.ahuObject.resources.ducts[fixedDuctXeto.id].position.x - this.ahuObject.resources.ducts[currentDuctXeto.id].position.x;
                translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', lengthToAdjacent);
                lengthToAdjacent = this.ahuObject.resources.ducts[fixedDuctXeto.id].position.z - this.ahuObject.resources.ducts[currentDuctXeto.id].position.z;
                translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', lengthToAdjacent);
            }

            console.log("placeIntersection 3* step 1");

            let upSize = 0;
            if(intersectDucts.up != null) {
                upSize = intersectDucts.up.graphicLocation.size
            }
            else {
                upSize = intersectDucts.down.graphicLocation.size
            }

            console.log("placeIntersection 3* step 2");

            let downSize = 0;
            if(intersectDucts.down != null) {
                downSize = intersectDucts.down.graphicLocation.size
            }
            else {
                downSize = intersectDucts.up.graphicLocation.size
            }           

            console.log("placeIntersection 3* step 3");

            if(intersectDucts.left == null) {
                const upSize = intersectDucts.up.graphicLocation.size;
                const downSize = intersectDucts.down.graphicLocation.size;
                const rightSize = intersectDucts.right.graphicLocation.size;
                let maxHalfWidth = this.innerDuctDimensions[upSize] > this.innerDuctDimensions[downSize] ? this.innerDuctDimensions[upSize] / 2 : this.innerDuctDimensions[downSize] / 2;
                let maxHalfHeight = this.innerDuctDimensions[rightSize] / 2;

                if(fixedDuctXeto == intersectDucts.right) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * -1));
                }

                if(fixedDuctXeto == intersectDucts.up) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
                }

                if(fixedDuctXeto == intersectDucts.down) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
                }
            }

            if(intersectDucts.right == null) {
                const upSize = intersectDucts.up.graphicLocation.size;
                const downSize = intersectDucts.down.graphicLocation.size;
                const leftSize = intersectDucts.left.graphicLocation.size;

                let maxHalfWidth = this.innerDuctDimensions[upSize] > this.innerDuctDimensions[downSize] ? this.innerDuctDimensions[upSize] / 2 : this.innerDuctDimensions[downSize] / 2;
                let maxHalfHeight = this.innerDuctDimensions[leftSize] / 2;

                if(fixedDuctXeto == intersectDucts.left) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * 1));
                }

                if(fixedDuctXeto == intersectDucts.up) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
                }

                if(fixedDuctXeto == intersectDucts.down) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
                }
            }

            if(intersectDucts.down == null) {
                const upSize = intersectDucts.up.graphicLocation.size;
                const leftSize = intersectDucts.left.graphicLocation.size;
                const rightSize = intersectDucts.right.graphicLocation.size;
                
                let maxHalfWidth = this.innerDuctDimensions[upSize] / 2;
                let maxHalfHeight = this.innerDuctDimensions[leftSize] > this.innerDuctDimensions[rightSize] ? this.innerDuctDimensions[leftSize] / 2 : this.innerDuctDimensions[rightSize] / 2;

                if(fixedDuctXeto == intersectDucts.left) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
                }

                if(fixedDuctXeto == intersectDucts.right) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
                }

                if(fixedDuctXeto == intersectDucts.up) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * -1));
                }
            }

            if(intersectDucts.up == null) {
                const downSize = intersectDucts.down.graphicLocation.size;
                const leftSize = intersectDucts.left.graphicLocation.size;
                const rightSize = intersectDucts.right.graphicLocation.size;
                
                let maxHalfWidth = this.innerDuctDimensions[downSize] / 2;
                let maxHalfHeight = this.innerDuctDimensions[leftSize] > this.innerDuctDimensions[rightSize] ? this.innerDuctDimensions[leftSize] / 2 : this.innerDuctDimensions[rightSize] / 2;

                if(fixedDuctXeto == intersectDucts.left) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
                }

                if(fixedDuctXeto == intersectDucts.right) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
                }

                if(fixedDuctXeto == intersectDucts.down) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * 1));
                }
            }

            this.Joints.createJointProxies(intersectDucts, this.ahuObject, key, largestGlobalSize);

            this.ahuObject.resources.joints[`Joint-${key}`].intersectDucts = intersectDucts;
            this.ahuObject.resources.joints[`Joint-${key}`].largestGlobalSize = largestGlobalSize;
            this.ahuObject.resources.joints[`Joint-${key}`].key = key;
            this.ahuObject.resources.joints[`Joint-${key}`].pairDirection = null;
    
        }
        else if(this.ductsDictionary[key].length == 2) {
            console.log("placeIntersection 2*:", this.ahuObject);

            let currentDuctXetos = this.ahuObject.xeto.filter(child => 
                child.id === this.ductsDictionary[key][0].id ||
                child.id === this.ductsDictionary[key][1].id
            );

            console.log("placeIntersection 2* currentDuctXetos:", currentDuctXetos);

            let fixedDuctXeto = null;
            for (const i in currentDuctXetos) {
                if (currentDuctXetos[i].isPositioned) {
                    fixedDuctXeto = currentDuctXetos[i];
                    currentDuctXetos.splice(i, 1);
                    break;
                }
            }

            console.log("placeIntersection 2* fixedDuctXeto:", fixedDuctXeto);

            fixedDuctXeto.relativePosition = getDuctDirection(fixedDuctXeto, key);

            console.log("placeIntersection 2* fixedDuctXeto:", fixedDuctXeto);

            let intersectDucts = {
                up: null, 
                down: null,
                left: null, 
                right: null
            }

            let currentDuctXeto = currentDuctXetos[0];
            currentDuctXeto.relativePosition = getDuctDirection(currentDuctXeto, key);

            console.log("placeIntersection 2* step 3");

            seperateByDirections(intersectDucts, fixedDuctXeto, currentDuctXetos);

            console.log("placeIntersection 2* step 4:", intersectDucts);       

            console.log("placeIntersection 2* step 5");

            let lengthToAdjacent = 0;
            lengthToAdjacent = this.ahuObject.resources.ducts[fixedDuctXeto.id].position.x - this.ahuObject.resources.ducts[currentDuctXeto.id].position.x;
            translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', lengthToAdjacent);
            lengthToAdjacent = this.ahuObject.resources.ducts[fixedDuctXeto.id].position.z - this.ahuObject.resources.ducts[currentDuctXeto.id].position.z;
            translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', lengthToAdjacent);

            console.log("placeIntersection 2* step 6");

            let pairDirection = null;
            if(intersectDucts.up != null && intersectDucts.down != null) {
                pairDirection = "vertical";
                xzJointPadding = 30;
            }
            if(intersectDucts.left != null && intersectDucts.right != null) {
                pairDirection = "horizontal";
                xzJointPadding = 30;
            }

            console.log("placeIntersection 2* step 7");

            if(fixedDuctXeto.isVertical == currentDuctXeto.isVertical) {
                if(currentDuctXeto.relativePosition == "right") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', length * 1);
                }
                else if(currentDuctXeto.relativePosition == "left") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', length * -1);
                }
                else if(currentDuctXeto.relativePosition == "up") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * 1));
                }
                else if(currentDuctXeto.relativePosition == "down") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * -1));
                }
            }
            else if(fixedDuctXeto.isVertical != currentDuctXeto.isVertical) {
                if(fixedDuctXeto.relativePosition == "left") {
                    length = ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2) + this.innerDuctDimensions[currentDuctXeto.graphicLocation.size] / 2;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], "x", (length * 1) + 15);
                }
                else if(fixedDuctXeto.relativePosition == "right") {
                    length = ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2) + this.innerDuctDimensions[currentDuctXeto.graphicLocation.size] / 2;
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], "x", (length * -1) - 15);
                }
                if(fixedDuctXeto.relativePosition == "up") {
                    length = ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[currentDuctXeto.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * -1) - 15);
                }
                else if(fixedDuctXeto.relativePosition == "down") {
                    length = ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[currentDuctXeto.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * 1) + 15);
                }

                if(currentDuctXeto.relativePosition == "up") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[fixedDuctXeto.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * 1) + 15);
                }
                else if(currentDuctXeto.relativePosition == "down") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[fixedDuctXeto.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * -1) - 15);
                }
                else if(currentDuctXeto.relativePosition == "left") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[fixedDuctXeto.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', (length * -1) - 15);
                }
                else if(currentDuctXeto.relativePosition == "right") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[fixedDuctXeto.graphicLocation.size] / 2);
                    length += xzJointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', (length * 1) + 15);
                }
            }

            console.log("placeIntersection 2* step 8");

            this.ahuObject.resources.joints["Joints-1"]

            this.Joints.createJointProxies(intersectDucts, this.ahuObject, key, largestGlobalSize);

            console.log("placeIntersection 2* step 9");

            this.ahuObject.resources.joints[`Joint-${key}`].intersectDucts = intersectDucts;
            this.ahuObject.resources.joints[`Joint-${key}`].largestGlobalSize = largestGlobalSize;
            this.ahuObject.resources.joints[`Joint-${key}`].key = key;
            this.ahuObject.resources.joints[`Joint-${key}`].pairDirection = pairDirection;

            console.log("placeIntersection 2* step 10:", jointGeometry);
            
        }

        console.log("placeIntersection 2* step 11");

        for(const traversedSegmentXeto of this.ductsDictionary[key]) {
            if(traversedSegmentXeto.isPositioned != true) {
                console.log("placeIntersection traversedSegmentXeto.id", traversedSegmentXeto.id);
            }
            traversedSegmentXeto.isPositioned = true;
        }

        this.ahuObject["3d"].joints.geometry[`Joint-${key}`] = jointGeometry;
        this.ahuObject["3d"].joints.meshes[`Joint-${key}`] = null;

        console.log("placeIntersection 2* step 12:", this.ahuObject);
        
    }

    transformEnds() {
        const endKeys = Object.keys(this.ahuObject.associations.ends);
        for(const endKey of endKeys) {
            const ductKey = this.ahuObject.associations.ends[endKey];
            this.ahuObject.resources.ends[endKey].position = this.ahuObject.resources.ducts[ductKey].position;
            this.ahuObject.resources.ends[endKey].rotation = this.ahuObject.resources.ducts[ductKey].rotation;
        }
    }
    reTransformComponents() {
        console.log("reTransformComponents component:", this.ahuObject);
        for(const componentId in this.ahuObject.resources.components) {
            console.log("reTransformComponents componentId:", componentId);
            const associatedDuctId = this.ahuObject.associations.components[componentId];
            console.log("reTransformComponents associatedDuctId:", associatedDuctId);
            console.log("reTransformComponents associatedDuctId:", associatedDuctId);
            this.ahuObject.resources.components[componentId].position.x += this.ahuObject.resources.ducts[associatedDuctId].position.x;
            this.ahuObject.resources.components[componentId].position.y += this.ahuObject.resources.ducts[associatedDuctId].position.y;
            this.ahuObject.resources.components[componentId].position.z += this.ahuObject.resources.ducts[associatedDuctId].position.z;

            this.ahuObject.resources.components[componentId].rotation.y += this.ahuObject.resources.ducts[associatedDuctId].rotation.y;
        }
    }
}