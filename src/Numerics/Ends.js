import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharedData } from "../Ahu3D/globals.js";

/**
 * Class responsible for creating the duct ends in the 3D model of the AHU.
 * The ends are created based on the duct segment's orientation and style and 
 * positioned correctly within the assembly.
 */
export default class Ends {
  
    /**
     * Constructor for the Ends class.
     * Initializes the instance with shared data for duct dimensions, scene helper, and color.
     */
    constructor() {
        // Initialize with shared data for inner duct dimensions, scene helper, and primary color
        this.innerDuctDimensions = sharedData.innerDuctDimensions;
        this.sceneHelper = sharedData.sceneHelper;
        this.primaryColor = sharedData.primaryColor;
    }

    /**
     * createEnds
     * 
     * Creates the necessary duct ends based on the segment's orientation and style,
     * and positions them correctly within the assembly.
     * This function handles both 'cap' and 'insert' types of duct ends based on the segment properties.
     * 
     * @param {Object} ahuObject - The AHU object containing the resources and configuration for the ducts.
     */
    createEnds(ahuObject) {
        console.log("createEnds started:", ahuObject);

        // Iterate over each duct segment in the AHU resources
        for (const ductKey in ahuObject.resources.ducts) {
            const duct = ahuObject.resources.ducts[ductKey];

            console.log("createEnds duct:", duct);
            console.log("createEnds ductKey:", ductKey);

            // Get the duct's Xeto dictionary entry
            const ductXeto = ahuObject.xetoDictionary.edges[ductKey];

            console.log("createEnds ductXeto:", ductXeto);
            console.log("createEnds duct:", duct);

            const ductEndTypes = ['cap', 'insert']; // Possible duct end types

            // Check if the duct has defined ends
            if (ductEndTypes.includes(ductXeto.blockStyle.ductEnds)) {
                const ductLoc = ductXeto.graphicLocation; // Get the segment's graphic location

                console.log("createEnds step 2:", ahuObject.xetoDictionary.edges);

                // Find intersections at the start of the duct segment
                let startIntersections = [];
                for(const edgeKey in ahuObject.xetoDictionary.edges) {
                    const edge = ahuObject.xetoDictionary.edges[edgeKey];
                    if (
                        ductXeto.graphicLocation.start === edge.graphicLocation.start && 
                        ductXeto !== edge ||
                        ductXeto.graphicLocation.start === edge.graphicLocation.end && 
                        ductXeto !== edge
                    ) {
                        startIntersections.push(edge);
                    }
                }

                // Find intersections at the end of the duct segment
                let endIntersections = [];
                for(const edgeKey in ahuObject.xetoDictionary.edges) {
                    const edge = ahuObject.xetoDictionary.edges[edgeKey];
                    if (
                        ductXeto.graphicLocation.end === edge.graphicLocation.start && 
                        ductXeto !== edge ||
                        ductXeto.graphicLocation.end === edge.graphicLocation.end && 
                        ductXeto !== edge
                    ) {
                        endIntersections.push(edge);
                    }
                }

                // Get the segment's orientation
                let segmentOrientation = ductXeto.orientation;
                
                // If no intersections at the start or end of the segment, create duct ends
                if (startIntersections.length == 0 || endIntersections.length == 0) {

                    console.log("createEnds step 4");

                    // Get the duct's end ID from associations
                    const endId = ahuObject.associations.ducts[ductKey].ends[0];
                    // Initialize an empty duct end in the resources
                    ahuObject.resources.ends[endId] = {
                        position: JSON.parse(JSON.stringify(duct.position)),
                        rotation: { x: 0, y: 0, z: 0 },
                        dimensions: { x: 0, y: 0, z: 0 },
                    };
                    let ductEnd = ahuObject.resources.ends[endId];

                    console.log("createEnds step 5 ductEnd:", ductEnd);

                    let ductHalfLength = JSON.parse(JSON.stringify(duct.dimensions.x)) / 2;

                    // Set the dimensions for the duct end
                    ductEnd.dimensions.y = JSON.parse(JSON.stringify(duct.dimensions.y)); 
                    ductEnd.dimensions.z = JSON.parse(JSON.stringify(duct.dimensions.z)); 

                    let halfWt = sharedData.moduleConfigs.parametricOptions.wallThickness / 2;

                    // Position and rotate the duct end based on the segment's orientation
                    if (startIntersections.length == 0) {
                        if (segmentOrientation == 'west') {
                            ductEnd.rotation.y = 90;
                            ductEnd.position.x += (ductHalfLength * 1) + halfWt;
                        } else if (segmentOrientation == 'east') {
                            ductEnd.rotation.y = 270;
                            ductEnd.position.x += (ductHalfLength * -1) - halfWt;
                        } else if (segmentOrientation == 'north') {
                            ductEnd.rotation.y = 180;
                            ductEnd.position.z += (ductHalfLength * -1) - halfWt;
                        } else if (segmentOrientation == 'south') {
                            ductEnd.rotation.y = 0;
                            ductEnd.position.z += (ductHalfLength * 1) + halfWt;
                        }
                    }

                    if (endIntersections.length == 0) {
                        if (segmentOrientation == 'west') {
                            ductEnd.rotation.y = 270;
                            ductEnd.position.x += (ductHalfLength * -1) - halfWt;
                        } else if (segmentOrientation == 'east') {
                            ductEnd.rotation.y = 90;
                            ductEnd.position.x += (ductHalfLength * 1) + halfWt;
                        } else if (segmentOrientation == 'north') {
                            ductEnd.rotation.y = 0;
                            ductEnd.position.z += (ductHalfLength * 1) + halfWt;
                        } else if (segmentOrientation == 'south') {
                            ductEnd.rotation.y = 180;
                            ductEnd.position.z += (ductHalfLength * -1) - halfWt;
                        }
                    }
                }

                console.log("createEnds finished:", ahuObject);
            }
        }
    }

    /**
     * createParametricInsert
     * 
     * Creates a parametric insert geometry with a given size for the duct.
     * This method creates the basic geometry for a duct insert including top, left, right, and back pieces.
     * 
     * @param {number} size - The size of the insert (default 500).
     * @returns {THREE.Mesh} The created mesh for the insert.
     */
    createParametricInsert(size = 500) {
        const sectionHeight = 60;
        
        // Define the geometries for different parts of the insert
        const topGeometry = new THREE.BoxGeometry(size + 30, size + 30, sectionHeight);
        const leftGeometry = new THREE.BoxGeometry(30, size + 30, sectionHeight);
        const rightGeometry = new THREE.BoxGeometry(30, size + 30, sectionHeight);
        const backGeometry = new THREE.BoxGeometry(size + 30, 30, sectionHeight);

        // Apply transformations to geometries (translations)
        const topGeometryMatrix = new THREE.Matrix4();
        topGeometryMatrix.makeTranslation(0, 0, 30); 
        topGeometry.applyMatrix4(topGeometryMatrix);

        const leftGeometryMatrix = new THREE.Matrix4();
        leftGeometryMatrix.makeTranslation(size / -2, 0, sectionHeight / 2 - 15); 
        leftGeometry.applyMatrix4(leftGeometryMatrix);

        const rightGeometryMatrix = new THREE.Matrix4();
        rightGeometryMatrix.makeTranslation(size / 2, 0, sectionHeight / 2 - 15); 
        rightGeometry.applyMatrix4(rightGeometryMatrix);

        const backGeometryMatrix = new THREE.Matrix4();
        backGeometryMatrix.makeTranslation(0, size / 2, sectionHeight / 2 - 15); 
        backGeometry.applyMatrix4(backGeometryMatrix);
        
        // Merge the geometries to create the final insert shape
        let mergedGeometry = BufferGeometryUtils.mergeGeometries([
            leftGeometry,
            rightGeometry,
            backGeometry
        ], false);

        // Apply transformations for cone and second part of the geometry
        let mergedGeometry2 = mergedGeometry.clone();
        let mergedConeGeometry = mergedGeometry.clone();

        const mergedConeGeometryMatrix = new THREE.Matrix4();
        mergedConeGeometryMatrix.makeTranslation(0, 0, sectionHeight); 
        mergedConeGeometry.applyMatrix4(mergedConeGeometryMatrix);

        const mergedGeometry2Matrix = new THREE.Matrix4();
        mergedGeometry2Matrix.makeTranslation(0, 0, sectionHeight * 2); 
        mergedGeometry2.applyMatrix4(mergedGeometry2Matrix);

        // Adjust top vertices for the insert
        this.moveInsertTopVertices(mergedConeGeometry, sectionHeight, sectionHeight);
        this.moveInsertTopVertices(mergedGeometry2, sectionHeight, sectionHeight);

        // Merge all geometries into a single geometry
        let mergedGeometryTotal = BufferGeometryUtils.mergeGeometries([
            mergedGeometry,
            mergedConeGeometry,
            mergedGeometry2
        ], false);
        
        // Create the mesh from the geometry and add it to the scene
        const material = new THREE.MeshStandardMaterial({ color: this.primaryColor });
        const mergedMesh = new THREE.Mesh(mergedGeometryTotal, material);
        mergedMesh.name = "ductEnd";
        this.sceneHelper.addToScene(mergedMesh);
        
        return mergedMesh;
    }

    /**
     * createParametricCap
     * 
     * Creates a parametric cap geometry with a given size for the duct.
     * This method creates the basic geometry for a duct cap including top, left, right, and back pieces.
     * 
     * @param {number} size - The size of the cap (default 500).
     * @returns {THREE.Mesh} The created mesh for the cap.
     */
    createParametricCap(size = 500) {        
        // Define the geometries for the cap
        const topGeometry = new THREE.BoxGeometry(size + 30, size + 30, 30);
        const leftGeometry = new THREE.BoxGeometry(30, size + 30, 30);
        const rightGeometry = new THREE.BoxGeometry(30, size + 30, 30);
        const backGeometry = new THREE.BoxGeometry(size + 30, 30, 30);

        // Apply transformations to each geometry part
        const topGeometryMatrix = new THREE.Matrix4();
        topGeometryMatrix.makeTranslation(0, 0, 30); 
        topGeometry.applyMatrix4(topGeometryMatrix);

        const leftGeometryMatrix = new THREE.Matrix4();
        leftGeometryMatrix.makeTranslation(size / -2, 0, 0); 
        leftGeometry.applyMatrix4(leftGeometryMatrix);

        const rightGeometryMatrix = new THREE.Matrix4();
        rightGeometryMatrix.makeTranslation(size / 2, 0, 0); 
        rightGeometry.applyMatrix4(rightGeometryMatrix);

        const backGeometryMatrix = new THREE.Matrix4();
        backGeometryMatrix.makeTranslation(0, size / 2, 0); 
        backGeometry.applyMatrix4(backGeometryMatrix);
        
        // Merge all geometries to create the final cap shape
        let mergedGeometry = BufferGeometryUtils.mergeGeometries([
            topGeometry,
            leftGeometry,
            rightGeometry,
            backGeometry
        ], false);

        // Create the mesh from the merged geometry and add it to the scene
        const material = new THREE.MeshStandardMaterial({ color: this.primaryColor });        
        const mergedMesh = new THREE.Mesh(mergedGeometry, material);
        mergedMesh.name = "ductEnd";
        this.sceneHelper.addToScene(mergedMesh);
        
        return mergedMesh;
    }

    /**
     * moveInsertTopVertices
     * 
     * Moves the top vertices of the given geometry upward by a specified distance.
     * This is used to adjust the position of vertices based on the given parameters.
     * 
     * @param {THREE.Geometry} geometry - The geometry of the insert to adjust.
     * @param {number} topPosition - The current position of the top of the geometry.
     * @param {number} moveDistance - The distance by which to move the vertices.
     */
    moveInsertTopVertices(geometry, topPosition, moveDistance) {
        // Access the position attribute of the geometry
        const positionAttribute = geometry.attributes.position;
    
        // Create a center point for reference
        const center = new THREE.Vector3(0, 0, 0);
    
        // Loop through each vertex and adjust the top vertices
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
    
            // Check if the vertex is a "top vertex" based on its Z position
            if (z >= topPosition) { // Adjust the threshold as needed for "top" vertices
                const vertex = new THREE.Vector3(x, y, z);
    
                // Calculate the direction vector from the center to the vertex
                const direction = vertex.clone().sub(center).normalize();
    
                // Move the vertex outward along the direction vector
                const newPosition = vertex.add(direction.multiplyScalar(moveDistance));
    
                // Update the vertex position
                positionAttribute.setXYZ(i, newPosition.x, newPosition.y, newPosition.z);
            }
        }
    
        // Mark the position attribute as needing an update
        positionAttribute.needsUpdate = true;
    }
}
