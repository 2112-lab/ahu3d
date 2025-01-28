import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharedData } from "../Ahu3D/globals.js";

export default class Ends {
    constructor() {
        this.innerDuctDimensions = sharedData.innerDuctDimensions;
        this.sceneHelper = sharedData.sceneHelper;
        this.primaryColor = sharedData.primaryColor;
    }

    /**
     * createEnds
     * 
     * Creates the necessary duct ends based on the segment's orientation and style,
     * and positions them correctly within the assembly.
     */
    createEnds(ahuObject) {
        console.log("createEnds started:", ahuObject);
        for (const ductKey in ahuObject.resources.ducts) { // Iterate over each segment.
            const duct = ahuObject.resources.ducts[ductKey];

            console.log("createEnds duct:", duct);
            console.log("createEnds ductKey:", ductKey);

            const ductXeto = ahuObject.xetoDictionary.edges[ductKey];

            console.log("createEnds ductXeto:", ductXeto);
            console.log("createEnds duct:", duct);

            console.log("createEnds step 1");

            const ductEndTypes = ['cap', 'insert'];

            if (ductEndTypes.includes(ductXeto.blockStyle.ductEnds)) { // Check if the segment has defined duct ends.

                const ductLoc = ductXeto.graphicLocation; // Get the segment's graphic location.

                console.log("createEnds step 2:", ahuObject.xetoDictionary.edges);

                let startIntersections = [];
                for(const edgeKey in ahuObject.xetoDictionary.edges) {
                    const edge = ahuObject.xetoDictionary.edges[edgeKey];
                    if(
                        ductXeto.graphicLocation.start === edge.graphicLocation.start &&
                        ductXeto != edge ||
                        ductXeto.graphicLocation.start === edge.graphicLocation.end &&
                        ductXeto != edge
                    ) {
                        startIntersections.push(edge);
                    }
                }

                console.log("createEnds step 3");

                let endIntersections = [];
                for(const edgeKey in ahuObject.xetoDictionary.edges) {
                    const edge = ahuObject.xetoDictionary.edges[edgeKey];
                    if(
                        ductXeto.graphicLocation.end === edge.graphicLocation.start &&
                        ductXeto != edge ||
                        ductXeto.graphicLocation.end === edge.graphicLocation.end &&
                        ductXeto != edge
                    ) {
                        endIntersections.push(edge);
                    }
                }

                let segmentOrientation = ductXeto.orientation
                if (startIntersections.length == 0 || endIntersections.length == 0) {

                    console.log("createEnds step 4");

                    const endId = ahuObject.associations.ducts[ductKey].ends[0];
                    ahuObject.resources.ends[endId] = {
                        position: JSON.parse(JSON.stringify(duct.position)),
                        rotation: { x: 0, y: 0, z: 0 },
                        dimensions: { x: 0, y: 0, z: 0 },
                    }
                    let ductEnd = ahuObject.resources.ends[endId];

                    console.log("createEnds step 5 ductEnd:", ductEnd);

                    let ductHalfLength = JSON.parse(JSON.stringify(duct.dimensions.x)) / 2;

                    ductEnd.dimensions.y = JSON.parse(JSON.stringify(duct.dimensions.y)); 
                    ductEnd.dimensions.z = JSON.parse(JSON.stringify(duct.dimensions.z)); 

                    let halfWt = sharedData.moduleConfigs.parametricOptions.wallThickness / 2;                    

                    if (startIntersections.length == 0) {
                        
                        if (segmentOrientation == 'west') {
                            ductEnd.rotation.y = 90;
                            ductEnd.position.x += (ductHalfLength * 1) + halfWt;
                        } 
                        else if (segmentOrientation == 'east') {
                            ductEnd.rotation.y = 270;
                            ductEnd.position.x += (ductHalfLength * -1) - halfWt;
                        } 
                        else if (segmentOrientation == 'north') {
                            ductEnd.rotation.y = 180;
                            ductEnd.position.z += (ductHalfLength * -1) - halfWt;
                        } 
                        else if (segmentOrientation == 'south') {
                            ductEnd.rotation.y = 0;
                            ductEnd.position.z += (ductHalfLength * 1) + halfWt;
                        }
                    }

                    if (endIntersections.length == 0) {
                        if (segmentOrientation == 'west') {
                            ductEnd.rotation.y = 270;
                            ductEnd.position.x += (ductHalfLength * -1) - halfWt;
                        } 
                        else if (segmentOrientation == 'east') {
                            ductEnd.rotation.y = 90;
                            ductEnd.position.x += (ductHalfLength * 1) + halfWt;
                        } 
                        else if (segmentOrientation == 'north') {
                            ductEnd.rotation.y = 0;
                            ductEnd.position.z += (ductHalfLength * 1) + halfWt;
                        } 
                        else if (segmentOrientation == 'south') {
                            ductEnd.rotation.y = 180;
                            ductEnd.position.z += (ductHalfLength * -1) - halfWt;
                        }
                    }
                }

                console.log("createEnds finished:", ahuObject);
                
            }
        }
    }

    createParametricInsert(size = 500) {
        const sectionHeight = 60;
        
        const topGeometry = new THREE.BoxGeometry(size + 30, size + 30, sectionHeight);
        const leftGeometry = new THREE.BoxGeometry(30, size + 30, sectionHeight);
        const rightGeometry = new THREE.BoxGeometry(30, size + 30, sectionHeight);
        const backGeometry = new THREE.BoxGeometry(size + 30, 30, sectionHeight);

        const topGeometryMatrix = new THREE.Matrix4();
        topGeometryMatrix.makeTranslation(0, 0, 30); 
        topGeometry.applyMatrix4(topGeometryMatrix);

        const leftGeometryMatrix = new THREE.Matrix4();
        leftGeometryMatrix.makeTranslation(size/-2, 0, sectionHeight/2 - 15); 
        leftGeometry.applyMatrix4(leftGeometryMatrix);

        const rightGeometryMatrix = new THREE.Matrix4();
        rightGeometryMatrix.makeTranslation(size/2, 0, sectionHeight/2 - 15); 
        rightGeometry.applyMatrix4(rightGeometryMatrix);

        const backGeometryMatrix = new THREE.Matrix4();
        backGeometryMatrix.makeTranslation(0, size/2, sectionHeight/2 - 15); 
        backGeometry.applyMatrix4(backGeometryMatrix);
        
        let mergedGeometry = BufferGeometryUtils.mergeGeometries([
            leftGeometry,
            rightGeometry,
            backGeometry
        ], false);

        let mergedGeometry2 = mergedGeometry.clone();
        let mergedConeGeometry = mergedGeometry.clone();

        const mergedConeGeometryMatrix = new THREE.Matrix4();
        mergedConeGeometryMatrix.makeTranslation(0, 0, sectionHeight); 
        mergedConeGeometry.applyMatrix4(mergedConeGeometryMatrix);

        const mergedGeometry2Matrix = new THREE.Matrix4();
        mergedGeometry2Matrix.makeTranslation(0, 0, sectionHeight * 2); 
        mergedGeometry2.applyMatrix4(mergedGeometry2Matrix);

        this.moveInsertTopVertices(mergedConeGeometry, sectionHeight, sectionHeight);
        this.moveInsertTopVertices(mergedGeometry2, sectionHeight, sectionHeight);

        let mergedGeometryTotal = BufferGeometryUtils.mergeGeometries([
            mergedGeometry,
            mergedConeGeometry,
            mergedGeometry2
        ], false);
        
        const material = new THREE.MeshStandardMaterial({ color: this.primaryColor });
        const mergedMesh = new THREE.Mesh(mergedGeometryTotal, material);
        mergedMesh.name = "ductEnd";
        this.sceneHelper.addToScene(mergedMesh);
        
        return mergedMesh;
    }

    createParametricCap(size = 500) {        
        const topGeometry = new THREE.BoxGeometry(size + 30, size + 30, 30);
        const leftGeometry = new THREE.BoxGeometry(30, size + 30, 30);
        const rightGeometry = new THREE.BoxGeometry(30, size + 30, 30);
        const backGeometry = new THREE.BoxGeometry(size + 30, 30, 30);

        const topGeometryMatrix = new THREE.Matrix4();
        topGeometryMatrix.makeTranslation(0, 0, 30); 
        topGeometry.applyMatrix4(topGeometryMatrix);

        const leftGeometryMatrix = new THREE.Matrix4();
        leftGeometryMatrix.makeTranslation(size/-2, 0, 0); 
        leftGeometry.applyMatrix4(leftGeometryMatrix);

        const rightGeometryMatrix = new THREE.Matrix4();
        rightGeometryMatrix.makeTranslation(size/2, 0, 0); 
        rightGeometry.applyMatrix4(rightGeometryMatrix);

        const backGeometryMatrix = new THREE.Matrix4();
        backGeometryMatrix.makeTranslation(0, size/2, 0); 
        backGeometry.applyMatrix4(backGeometryMatrix);
        
        let mergedGeometry = BufferGeometryUtils.mergeGeometries([
            topGeometry,
            leftGeometry,
            rightGeometry,
            backGeometry
        ], false);

        const material = new THREE.MeshStandardMaterial({ color: this.primaryColor });        
        const mergedMesh = new THREE.Mesh(mergedGeometry, material);
        mergedMesh.name = "ductEnd";
        this.sceneHelper.addToScene(mergedMesh);
        
        return mergedMesh;
    }

    moveInsertTopVertices(geometry, topPosition, moveDistance) {
        // Access the position attribute
        const positionAttribute = geometry.attributes.position;
    
        // Create a center point for reference
        const center = new THREE.Vector3(0, 0, 0);
    
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
    
            // Check if the vertex is a "top vertex" (based on z-axis height)
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