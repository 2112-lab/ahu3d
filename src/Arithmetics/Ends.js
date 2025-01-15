import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export default class Ends {
    constructor(innerDuctDimensions, sceneHelper, primaryColor) {
        this.innerDuctDimensions = innerDuctDimensions;
        this.sceneHelper = sceneHelper;
        this.primaryColor = primaryColor;
    }

    /**
     * createDuctEnds
     * 
     * Creates the necessary duct ends based on the segment's orientation and style,
     * and positions them correctly within the assembly.
     */
    createDuctEnds(assemblySegments) {
        console.log("createDuctEnds started:", assemblySegments);
        for (const segment of assemblySegments) { // Iterate over each segment.

            const ductEndTypes = ['cap', 'insert'];

            if (ductEndTypes.includes(segment.xetoDuct.blockStyle.ductEnds)) { // Check if the segment has defined duct ends.

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

                let segmentOrientation = segment.xetoDuct.orientation
                let ductEnd = null;

                if (startIntersections.length == 0 || endIntersections.length == 0) {
                    if(segment.xetoDuct.blockStyle.ductEnds == 'insert') {
                        ductEnd = this.createParametricInsert(this.innerDuctDimensions[segment.xetoDuct.graphicLocation.size]);
                        segment.segment.duct.userData.endHeight = ductEnd.userData.height;
                    }
                    else if(segment.xetoDuct.blockStyle.ductEnds == 'cap') {
                        ductEnd = this.createParametricCap(this.innerDuctDimensions[segment.xetoDuct.graphicLocation.size]);
                        segment.segment.duct.userData.endHeight = ductEnd.userData.height;
                    }
                    
                    ductEnd.position.copy(segment.segment.duct.userData.component.object.position);
                }

                let ductHalfLength = 500;
                let halfWallThickness = 15;

                if (startIntersections.length == 0) {
                    if (segmentOrientation == 'west') {
                        ductEnd.rotation.y = THREE.MathUtils.degToRad(90);
                        ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / 2;
                        ductEnd.position.x += ductHalfLength + halfWallThickness;
                    } 
                    else if (segmentOrientation == 'east') {
                        ductEnd.rotation.y = THREE.MathUtils.degToRad(270);
                        ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / -2;
                        ductEnd.position.x += ductHalfLength - halfWallThickness;
                    } 
                    else if (segmentOrientation == 'north') {
                        ductEnd.rotation.y = THREE.MathUtils.degToRad(180);
                        ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / -2;
                        ductEnd.position.z += ductHalfLength - halfWallThickness;
                    } 
                    else if (segmentOrientation == 'south') {
                        ductEnd.rotation.y = THREE.MathUtils.degToRad(0);
                        ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / 2;
                        ductEnd.position.z += ductHalfLength + halfWallThickness;
                    }
                }

                if (endIntersections.length == 0) {
                    if (segmentOrientation == 'west') {
                        ductEnd.rotation.y = THREE.MathUtils.degToRad(270);
                        ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / -2;
                        ductEnd.position.x += ductHalfLength - halfWallThickness;
                    } 
                    else if (segmentOrientation == 'east') {
                        ductEnd.rotation.y = THREE.MathUtils.degToRad(90);
                        ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / 2;
                        ductEnd.position.x += ductHalfLength + halfWallThickness;
                    } 
                    else if (segmentOrientation == 'north') {
                        ductEnd.rotation.y = THREE.MathUtils.degToRad(0);
                        ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / 2;
                        ductEnd.position.z += ductHalfLength + halfWallThickness;
                    } 
                    else if (segmentOrientation == 'south') {
                        ductEnd.rotation.y = THREE.MathUtils.degToRad(180);
                        ductHalfLength = segment.segment.duct.userData.component.attributes.length.value / -2;
                        ductEnd.position.z += ductHalfLength - halfWallThickness;
                    }
                }
            }
        }
    }

    createParametricInsert(size = 500) {
        const material = new THREE.MeshStandardMaterial({ color: this.primaryColor });

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
        
        const mergedMesh = new THREE.Mesh(mergedGeometryTotal, material);
        mergedMesh.name = "ductEnd";
        mergedMesh.userData.height = sectionHeight * 3;
        this.sceneHelper.addToScene(mergedMesh);
        
        return mergedMesh;
    }

    createParametricCap(size = 500) {
        const material = new THREE.MeshStandardMaterial({ color: this.primaryColor });
        
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
        
        const mergedMesh = new THREE.Mesh(mergedGeometry, material);
        mergedMesh.name = "ductEnd";
        mergedMesh.userData.height = 60;
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