/**
 * Ducts.js
 * 
 * @fileoverview Manages duct system geometry, positioning and connections.
 * Handles the creation and manipulation of duct segments, their intersections,
 * and the overall duct network topology.
 */

import {
    getDuctDirection, 
    seperateByDirections, 
    translateDuct
} from "./Basic.js";
import { sharedData } from "../Ahu3D/globals.js";
import Joints from "./Joints.js";
import Geometry_3D_Joints_Cross from "../3D/Geometry/Joints/Geometry_3D_Joints_Cross.js";
import Geometry_3D_Joints_T from "../3D/Geometry/Joints/Geometry_3D_Joints_T.js";
import Geometry_3D_Joints_L from "../3D/Geometry/Joints/Geometry_3D_Joints_L.js";
import Geometry_3D_Joints_Colinear from "../3D/Geometry/Joints/Geometry_3D_Joints_Colinear.js";

/**
 * Class handling duct system layout and geometry.
 * Manages the creation, positioning and connection of duct segments.
 */
export default class Ducts {
    /**
     * Initialize the ducts manager with required dependencies and configurations.
     * 
     * @param {Object} ductsDictionary - Dictionary of all duct definitions
     * @param {Object} Mesh3D - 3D mesh handling utility
     * @param {Object} componentLibrary - Library of available components
     * @param {Object} ahuGroup - Group configuration for the AHU
     * @param {Object} sceneHelper - Helper for scene manipulation
     * @param {Object} ahuObject - Main AHU object containing all system data
     */
    constructor(
        ductsDictionary, 
        Mesh3D, 
        componentLibrary, 
        ahuGroup, 
        sceneHelper,
        ahuObject
    ) {
        // Initialize core configuration properties
        this.innerDuctDimensions = sharedData.innerDuctDimensions;
        this.ductsDictionary = JSON.parse(JSON.stringify(ductsDictionary));
        
        // Set for tracking processed segments
        this.positionedSegments = new Set();
        
        // Store reference to shared color definition
        this.primaryColor = sharedData.primaryColor;
        
        // Store utility class instances
        this.Mesh3D = Mesh3D;
        this.componentLibrary = componentLibrary;
        this.ahuGroup = ahuGroup;
        this.ahuObject = ahuObject;
        
        // Initialize joint handling classes
        this.Joints = new Joints(this.ahuGroup, this.innerDuctDimensions, sceneHelper);
        this.Geometry_3D_Joints_Cross = new Geometry_3D_Joints_Cross();
        this.Geometry_3D_Joints_T = new Geometry_3D_Joints_T();
        this.Geometry_3D_Joints_L = new Geometry_3D_Joints_L();
        this.Geometry_3D_Joints_Colinear = new Geometry_3D_Joints_Colinear();

        // Counter for joint tracking
        this.jointCount = 0;

        // Traversal control for recursive operations
        this.traversalCount = 0;
        this.traversalLimit = 30;
    }

    /**
     * Initializes all duct segments in the AHU object.
     * Sets up initial positions and configurations for each duct.
     * 
     * @param {Object} ahuObject - The main AHU object containing duct definitions
     */
    async initializeAllDuctSegments(ahuObject) {
        // Get array of all duct identifiers
        const ducts = Object.keys(ahuObject.resources.ducts);
        
        // Initialize each duct segment sequentially
        for (const i in ducts) {
            this.initializeDuctSegment(ahuObject, ducts[i]);
        } 
    }

    /**
     * Initializes a single duct segment with components and positioning.
     * 
     * @param {Object} ahuObject - The main AHU object
     * @param {string} ductKey - Identifier for the duct to initialize
     * @returns {void}
     */
    initializeDuctSegment(ahuObject, ductKey) {
        // Initialize duct position and rotation vectors
        ahuObject.resources.ducts[ductKey].position = {x: 0, y: 0, z: 0};
        ahuObject.resources.ducts[ductKey].rotation = {x: 0, y: 0, z: 0};
    
        // Apply rotation based on duct orientation
        if (ahuObject.xetoDictionary.edges[ductKey].orientation == 'north') {
            ahuObject.resources.ducts[ductKey].rotation.y = -90;
        }
        else if (ahuObject.xetoDictionary.edges[ductKey].orientation == 'south') {
            ahuObject.resources.ducts[ductKey].rotation.y = 90;
        }
        else if (ahuObject.xetoDictionary.edges[ductKey].orientation == 'west') {
            ahuObject.resources.ducts[ductKey].rotation.y = 180;
        }
    
        // Get inner dimension based on duct size configuration
        const innerDimension = sharedData.innerDuctDimensions[ahuObject.xetoDictionary.edges[ductKey].graphicLocation.size];
        const componentScale = innerDimension / 1000;
    
        // Get flow direction from the duct
        const flowDirection = ahuObject.xetoDictionary.edges[ductKey].blockStyle.flowDirection;
    
        // Validate component array
        this.testArray = ahuObject.associations.ducts[ductKey].components;
        if (!Array.isArray(this.testArray)) {
            alert(`This data is not an array: ${this.testArray}`)
        }
    
        // Calculate total span needed for components
        let totalSpan = 0;
        for(const uniqueId of ahuObject.associations.ducts[ductKey].components) {
            // Get component type from dictionary
            let componentKey = ahuObject.xetoDictionary.components[uniqueId].componentId.split("r:novo.graphics::").pop();
            
            // Get the component-specific padding instead of the duct's padding
            // Default to the duct's padding if component padding is not defined
            const componentPadding = ahuObject.xetoDictionary.components[uniqueId].blockStyle?.componentPadding || 
                                    ahuObject.xetoDictionary.edges[ductKey].blockStyle.componentPadding;
            
            // Initialize component dimensions with scaling
            ahuObject.resources.components[uniqueId].dimensions = JSON.parse(JSON.stringify(sharedData.componentLibrary[componentKey].object.boundingBox.dimensions));
            ahuObject.resources.components[uniqueId].scale = {
                x: componentScale,
                y: componentScale,
                z: componentScale
            };
    
            // Apply scaling to dimensions
            ahuObject.resources.components[uniqueId].dimensions.x *= componentScale;
            ahuObject.resources.components[uniqueId].dimensions.y *= componentScale;
            ahuObject.resources.components[uniqueId].dimensions.z *= componentScale;
    
            // Initialize component position and rotation
            ahuObject.resources.components[uniqueId].position = {x: 0, y: 0, z: 0};
            ahuObject.resources.components[uniqueId].rotation = {x: 0, y: 0, z: 0};
    
            // Store component padding for later use in positioning
            ahuObject.resources.components[uniqueId].padding = componentPadding;
    
            // Add component span including padding
            totalSpan += componentPadding.startSpace + ahuObject.resources.components[uniqueId].dimensions.x + componentPadding.endSpace;
        }
    
        // Calculate offset from center for component positioning
        const halfTotalSpan = totalSpan / 2;
        for(const uniqueId of ahuObject.associations.ducts[ductKey].components) {
            // Center components by offsetting from half span
            const componentHalfWidth = ahuObject.resources.components[uniqueId].dimensions.x / 2;
            ahuObject.resources.components[uniqueId].position.x -= (halfTotalSpan - componentHalfWidth);
        }
    
        // Get array of component keys
        let componentKeys = ahuObject.associations.ducts[ductKey].components;
    
        // Position first component with its initial padding
        const firstComponentPadding = ahuObject.resources.components[componentKeys[0]].padding;
        ahuObject.resources.components[componentKeys[0]].position.x += firstComponentPadding.startSpace;
    
        // Position remaining components sequentially
        for(let i = 1; i <= componentKeys.length-1; i++) {
            const previousComponent = ahuObject.resources.components[componentKeys[i-1]];
            const currentComponent = ahuObject.resources.components[componentKeys[i]];
            
            const previousComponentHalfWidth = previousComponent.dimensions.x / 2;
            const currentComponentHalfWidth = currentComponent.dimensions.x / 2;
            
            // Use the previous component's end padding and current component's start padding
            const previousComponentEndPadding = previousComponent.padding.endSpace;
            const currentComponentStartPadding = currentComponent.padding.startSpace;
    
            // Position current component relative to previous one
            currentComponent.position.x = previousComponent.position.x;
            currentComponent.position.x += previousComponentHalfWidth;
            currentComponent.position.x += currentComponentHalfWidth;
            currentComponent.position.x += previousComponentEndPadding;
            currentComponent.position.x += currentComponentStartPadding;
        }
    
        // Apply flow direction adjustments
        for(const uniqueId of ahuObject.associations.ducts[ductKey].components) {
            const currentComponent = ahuObject.resources.components[uniqueId];
            if(flowDirection == "endToStart") {
                currentComponent.scale.x *= -1;
            }
        }
    
        // Set final duct dimensions
        ahuObject.resources.ducts[ductKey].dimensions = {
            x: totalSpan, 
            y: innerDimension, 
            z: innerDimension
        };
    }

    /**
     * Gets the primary duct key from the duct dictionary.
     * Primary duct is identified as one with single connection.
     * 
     * @returns {string} Key of the primary duct
     */
    getPrimaryKey() {
        // Find first duct with only one connection
        for(const key in this.ductsDictionary) {
            if(this.ductsDictionary[key].length == 1) {
                return key;
            }
        }
    }

    /**
     * Places segments in correct positions based on their relationships.
     * 
     * @param {Object} ahuObject - The main AHU object
     * @returns {Promise<void>}
     */
    async placeSegments(ahuObject) {
        // Store reference to AHU object
        this.ahuObject = ahuObject;

        // Get starting point for placement
        const primaryKey = this.getPrimaryKey();
        const edgeKeys = Object.keys(ahuObject.xetoDictionary.edges); 
        const primarySegmentXeto = ahuObject.xetoDictionary.edges[edgeKeys[0]];

        // Apply initial rotation based on orientation
        let primarySegmentOrientation = primarySegmentXeto.orientation;
        if (primarySegmentOrientation == 'north') {
            ahuObject.resources.ducts[primarySegmentXeto.id].rotation.y = -90;
        }
        else if (primarySegmentOrientation == 'south') {
            ahuObject.resources.ducts[primarySegmentXeto.id].rotation.y = 90;
        }
        else if (primarySegmentOrientation == 'west') {
            ahuObject.resources.ducts[primarySegmentXeto.id].rotation.y = 180;
        }

        // Mark primary segment as positioned
        this.positionedSegments.add(primarySegmentXeto.id);

        // Recursively process connected segments
        this.getNextSegment(primarySegmentXeto, primaryKey);

        // Apply final transformations to components
        this.reTransformComponents();
    }

    /**
     * Processes the next segment in sequence for placement.
     * 
     * @param {Object} currentSegmentXeto - Current segment being processed
     * @param {string} currentKey - Key of current segment
     */
    getNextSegment(currentSegmentXeto, currentKey) {
        // Increment traversal counter to prevent infinite loops
        this.traversalCount++;
        if(this.traversalCount > this.traversalLimit) {
            console.log("getNextSegment canceled");
            return;
        }

        // Get location information for current segment
        const graphicLocation = currentSegmentXeto.graphicLocation;
        const nextKey = currentKey === graphicLocation.start ? graphicLocation.end : graphicLocation.start;
        const adjacentSegments = this.ductsDictionary[nextKey] || [];

        // Process each adjacent segment that hasn't been positioned
        for (const adjacentSegmentXeto of adjacentSegments) {
            if(adjacentSegmentXeto != currentSegmentXeto) {
                if (!this.positionedSegments.has(adjacentSegmentXeto.id)) {
                    this.placeIntersection(nextKey);
                    this.getNextSegment(adjacentSegmentXeto, nextKey);
                }
            }
        }
        
        // Mark current segment as positioned
        this.positionedSegments.add(currentSegmentXeto.id);
    }

    /**
     * Adds joint resource and association entries to the AHU object.
     * 
     * @param {string} key - Key identifying the joint location
     */
    addJointRsrcAndAssoc(key) {
        // Increment joint counter
        this.jointCount++;

        // Initialize joint entries if they don't exist
        if(this.ahuObject.associations.joints[`Joint-${key}`] == undefined) {
            this.ahuObject.associations.joints[`Joint-${key}`] = {};
            this.ahuObject.associations.joints[`Joint-${key}`].ducts = [];
            this.ahuObject.resources.joints[`Joint-${key}`] = {};
        }

        // Add duct associations for each connected duct
        for(const i in this.ductsDictionary[key]) {
            this.ahuObject.associations.joints[`Joint-${key}`].ducts.push(this.ductsDictionary[key][i].id);
            this.ahuObject.associations.ducts[this.ductsDictionary[key][i].id].joints.push(`Joint-${key}`);
        }      
    }

    placeIntersection(key) {
        console.log("placeIntersection ** started:", this.ahuObject);
        console.log("placeIntersection ** this.ductsDictionary[key]:", this.ductsDictionary[key]);        

        if(this.ductsDictionary[key].length >= 2 && this.ductsDictionary[key].length <= 4) {
            this.addJointRsrcAndAssoc(key);
        }

        let jointPadding = this.ahuGroup.blockStyle.joints.padding;

        let currentDuctXetos = this.ahuObject.xeto.filter(child => 
            this.ductsDictionary[key].some(duct => duct.id === child.id)
        );
    
        let fixedDuctXeto = currentDuctXetos.find(duct => this.positionedSegments.has(duct.id)) || null;
        if (fixedDuctXeto) {
            currentDuctXetos = currentDuctXetos.filter(duct => duct !== fixedDuctXeto);
        }

        if(this.ductsDictionary[key].length == 4) {
            console.log("placeIntersection 4*");

            fixedDuctXeto.relativePosition = getDuctDirection(fixedDuctXeto, key, this.ahuObject);
            console.log("placeIntersection 4* currentDuctXetos:", currentDuctXetos);
            console.log("placeIntersection 4* fixedDuctXeto:", fixedDuctXeto);

            let intersectDucts = {
                up: null, 
                down: null,
                left: null, 
                right: null
            }

            for(const currentDuctXeto of currentDuctXetos) {
                currentDuctXeto.relativePosition = getDuctDirection(currentDuctXeto, key, this.ahuObject);
            }

            seperateByDirections(intersectDucts, fixedDuctXeto, currentDuctXetos);

            for(const currentDuctXeto of currentDuctXetos) {
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
            
            if(intersectDucts.left == fixedDuctXeto) {
                console.log("placeIntersection 4* step 5");
                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                // translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * 1))

                length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth * 2 + 30;
                length += jointPadding * 2;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
            }
            else if(intersectDucts.right == fixedDuctXeto) {
                console.log("placeIntersection 4* step 6");
                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth * 2 + 30;
                length += jointPadding * 2;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
            }
            else if(intersectDucts.up == fixedDuctXeto) {
                console.log("placeIntersection 4* step 7");
                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight * 2 + 30;
                length += jointPadding * 2;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
            }
            else if(intersectDucts.down == fixedDuctXeto) {
                console.log("placeIntersection 4* step 8");
                length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight * 2 + 30;
                length += jointPadding * 2;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                length += maxHalfHeight + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * 1));

                length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                length += maxHalfWidth + 15;
                length += jointPadding;
                translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
            }
                
            this.Joints.createJointProxies(intersectDucts, this.ahuObject, key);

        }
        else if (this.ductsDictionary[key].length == 3) {
            console.log("placeIntersection length 3");

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
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * -1));
                }

                if(fixedDuctXeto == intersectDucts.up) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += jointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
                }

                if(fixedDuctXeto == intersectDucts.down) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += jointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
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
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * 1));
                }

                if(fixedDuctXeto == intersectDucts.up) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += jointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
                }

                if(fixedDuctXeto == intersectDucts.down) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight * 2 + 30;
                    length += jointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
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
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += jointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
                }

                if(fixedDuctXeto == intersectDucts.right) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.up.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
                }

                if(fixedDuctXeto == intersectDucts.up) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.up.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
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
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += jointPadding * 2;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));
                }

                if(fixedDuctXeto == intersectDucts.right) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "z", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.down.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth * 2 + 30;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));
                }

                if(fixedDuctXeto == intersectDucts.down) {
                    length = ((this.ahuObject.resources.ducts[intersectDucts.left.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "x", (length * -1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.left.id], "z", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.right.id].dimensions.x) / 2);
                    length += maxHalfWidth + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "x", (length * 1));

                    length = ((this.ahuObject.resources.ducts[intersectDucts.down.id].dimensions.x) / 2);
                    length += maxHalfHeight + 15;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[intersectDucts.right.id], "z", (length * 1));
                }
            }

            this.Joints.createJointProxies(intersectDucts, this.ahuObject, key);
    
        }
        else if(this.ductsDictionary[key].length == 2) {
            console.log("placeIntersection 2*:", this.ahuObject);

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

            if(intersectDucts.up != null && intersectDucts.down != null) {
                jointPadding = 30;
            }
            if(intersectDucts.left != null && intersectDucts.right != null) {
                jointPadding = 30;
            }

            console.log("placeIntersection 2* step 7");

            if(fixedDuctXeto.isVertical == currentDuctXeto.isVertical) {
                if(currentDuctXeto.relativePosition == "right") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', length * 1);
                }
                else if(currentDuctXeto.relativePosition == "left") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', length * -1);
                }
                else if(currentDuctXeto.relativePosition == "up") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * 1));
                }
                else if(currentDuctXeto.relativePosition == "down") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * -1));
                }
            }
            else if(fixedDuctXeto.isVertical != currentDuctXeto.isVertical) {
                if(fixedDuctXeto.relativePosition == "left") {
                    length = ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2) + this.innerDuctDimensions[currentDuctXeto.graphicLocation.size] / 2;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], "x", (length * 1) + 15);
                }
                else if(fixedDuctXeto.relativePosition == "right") {
                    length = ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2) + this.innerDuctDimensions[currentDuctXeto.graphicLocation.size] / 2;
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], "x", (length * -1) - 15);
                }
                if(fixedDuctXeto.relativePosition == "up") {
                    length = ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[currentDuctXeto.graphicLocation.size] / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * -1) - 15);
                }
                else if(fixedDuctXeto.relativePosition == "down") {
                    length = ((this.ahuObject.resources.ducts[fixedDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[currentDuctXeto.graphicLocation.size] / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * 1) + 15);
                }

                if(currentDuctXeto.relativePosition == "up") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[fixedDuctXeto.graphicLocation.size] / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * 1) + 15);
                }
                else if(currentDuctXeto.relativePosition == "down") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[fixedDuctXeto.graphicLocation.size] / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'z', (length * -1) - 15);
                }
                else if(currentDuctXeto.relativePosition == "left") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[fixedDuctXeto.graphicLocation.size] / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', (length * -1) - 15);
                }
                else if(currentDuctXeto.relativePosition == "right") {
                    length = ((this.ahuObject.resources.ducts[currentDuctXeto.id].dimensions.x) / 2) + (this.innerDuctDimensions[fixedDuctXeto.graphicLocation.size] / 2);
                    length += jointPadding;
                    translateDuct(this.ahuObject.resources.ducts[currentDuctXeto.id], 'x', (length * 1) + 15);
                }
            }

            this.Joints.createJointProxies(intersectDucts, this.ahuObject, key);
            
        }

        // for(const traversedSegmentXeto of this.ductsDictionary[key]) {
        //     console.log("placeIntersection traversedSegmentXeto", JSON.stringify(traversedSegmentXeto.isPositioned));
        //     if(traversedSegmentXeto.isPositioned != true) {
        //         console.log("placeIntersection traversedSegmentXeto.id", traversedSegmentXeto.id);
        //     }
        //     traversedSegmentXeto.isPositioned = true;
        // }

        for (const traversedSegmentXeto of this.ductsDictionary[key]) {
            this.positionedSegments.add(traversedSegmentXeto.id);
        }

        let processedSegments = new Set();  // Track local processed segments for this intersection

        const adjacentSegments = this.ductsDictionary[key];
        for (const adjacentSegmentXeto of adjacentSegments) {
            if (!processedSegments.has(adjacentSegmentXeto.id)) {
                console.log(`Processing adjacent segment: ${adjacentSegmentXeto.id}`);

                // Traverse the next segment and check its intersection
                this.getNextSegment(adjacentSegmentXeto, key);

                // Only mark as processed after all adjacent segments are evaluated
                processedSegments.add(adjacentSegmentXeto.id);
            }
        }

        this.ahuObject["3d"].joints.geometry[`Joint-${key}`] = null;
        // this.ahuObject["3d"].joints.meshes[`Joint-${key}`] = null;
        
    }

    /**
     * Applies final transformations to components after duct placement.
     */
    reTransformComponents() {
        // Process each component in the AHU object
        for(const componentId in this.ahuObject.resources.components) {
            // Get associated duct for component
            const associatedDuctId = this.ahuObject.associations.components[componentId];
            
            // Apply duct position to component
            this.ahuObject.resources.components[componentId].position.x += this.ahuObject.resources.ducts[associatedDuctId].position.x;
            this.ahuObject.resources.components[componentId].position.y += this.ahuObject.resources.ducts[associatedDuctId].position.y;
            this.ahuObject.resources.components[componentId].position.z += this.ahuObject.resources.ducts[associatedDuctId].position.z;

            // Apply duct rotation to component
            this.ahuObject.resources.components[componentId].rotation.y += this.ahuObject.resources.ducts[associatedDuctId].rotation.y;
        }
    }
}