import * as THREE from 'three';
import { 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeGeometries
} from "./Geometry_3D_Joints_Utils.js";
import { sharedData } from "../../../Ahu3D/globals.js";

export default class Geometry_3D_Joints_L {
    /**
     * createLJoint
     * 
     * This function creates the L-joint geometry based on the provided joint configuration.
     * It considers the direction (inwards or outwards) and style (arc or diagonal) to generate the appropriate geometries.
     * 
     * @param {Object} joint - The joint data containing proxy coordinates for each side.
     * @returns {THREE.BufferGeometry} - Merged geometry for the L-joint.
     */
    createLJoint(joint) {
        const geometries = [];
        let diagonalWidth = 0;

        console.log("createLJoint2 started:", joint);

        // Initialize shared configurations for the L-joint
        sharedData.backwallArcConfigs = [];
        sharedData.isLJoint = true;

        // Handle different joint directions
        if(sharedData.jointDirection == "outwards") {
            // Handle the case where the right and up ducts are present
            if(joint.right != null && joint.up != null) {
                if(sharedData.jointStyle == "arc" || sharedData.jointStyle == "diagonal") {
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxyMedian.coordinates,
                        joint.right.proxy2.coordinates, 
                        true,
                        Math.PI * 2
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxyMedian.coordinates, 
                        joint.up.proxy1.coordinates,
                        true,
                        Math.PI * 2
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.right.proxyMedian.coordinates, 
                        joint.right.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxy2.coordinates, 
                        joint.right.proxyMedian.coordinates
                    ));
                }
                else {
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxy2.coordinates,
                        joint.right.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.right.proxyMedian.coordinates, 
                        joint.right.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxyMedian.coordinates,
                        joint.right.proxy2.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxy1.coordinates, 
                        joint.up.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxy2.coordinates,
                        joint.right.proxyMedian.coordinates
                    ));
                }
            }
            // Handle the case where the right and down ducts are present
            else if(joint.right != null && joint.down != null) {
                if(sharedData.jointStyle == "arc" || sharedData.jointStyle == "diagonal") {
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.right.proxyMedian.coordinates, 
                        joint.down.proxy1.coordinates,
                        true,
                        Math.PI / -2
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.down.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.right.proxyMedian.coordinates,
                        joint.right.proxy1.coordinates,
                        true,
                        Math.PI / -2
                    ));
                }
                else {
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.right.proxyMedian.coordinates, 
                        joint.down.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.down.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.down.proxyMedian.coordinates, 
                        joint.right.proxy2.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.right.proxy1.coordinates,
                        joint.right.proxyMedian.coordinates
                    ));
                }
            } 
            // Handle the case where the left and up ducts are present
            else if(joint.left != null && joint.up != null) {
                if(sharedData.jointStyle == "arc" || sharedData.jointStyle == "diagonal") {
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.up.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.up.proxyMedian.coordinates, 
                        joint.left.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.left.proxyMedian.coordinates,
                        joint.up.proxy2.coordinates,
                        true,
                        Math.PI / 2
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.left.proxyMedian.coordinates,
                        joint.left.proxy2.coordinates,
                        true,
                        Math.PI / 2
                    ));
                }
                else {
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.up.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.up.proxyMedian.coordinates, 
                        joint.left.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.left.proxy2.coordinates, 
                        joint.left.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.left.proxyMedian.coordinates,
                        joint.up.proxy2.coordinates
                    ));
                }
            }
            // Handle the case where the left and down ducts are present
            else if(joint.left != null && joint.down != null) {
                if(sharedData.jointStyle == "arc" || sharedData.jointStyle == "diagonal") {
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxy2.coordinates, 
                        joint.left.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxyMedian.coordinates,
                        joint.down.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.down.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates,
                        true,
                        Math.PI
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxy1.coordinates,
                        joint.down.proxyMedian.coordinates,
                        true,
                        Math.PI
                    ));
                }
                else {
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxy2.coordinates, 
                        joint.left.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxyMedian.coordinates,
                        joint.down.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.down.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.down.proxyMedian.coordinates, 
                        joint.left.proxy1.coordinates
                    ));
                }
            }  
        }
        // Handle the "inwards" joint direction
        else if(sharedData.jointDirection == "inwards") {
            if(joint.right != null && joint.up != null) {
                if(sharedData.jointStyle == "arc" || sharedData.jointStyle == "diagonal") {
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates, 
                        true,
                        Math.PI * 2
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxyMedian.coordinates, 
                        joint.right.proxy2.coordinates, 
                        true,
                        Math.PI * 2
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.right.proxyMedian.coordinates, 
                        joint.right.proxy1.coordinates
                    ));
                }
                else {
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.right.proxyMedian.coordinates, 
                        joint.right.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxyMedian.coordinates,
                        joint.right.proxy2.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxy1.coordinates, 
                        joint.up.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.up.proxy2.coordinates,
                        joint.right.proxyMedian.coordinates
                    ));
                }
            }
            // Handle the case where the right and down ducts are present
            else if(joint.right != null && joint.down != null) {
                if(sharedData.jointStyle == "arc" || sharedData.jointStyle == "diagonal") {
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.right.proxyMedian.coordinates, 
                        joint.down.proxy1.coordinates,
                        true,
                        Math.PI / -2
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.down.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.down.proxyMedian.coordinates, 
                        joint.right.proxy2.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.right.proxyMedian.coordinates,
                        joint.right.proxy1.coordinates,
                        true,
                        Math.PI / -2
                    ));
                }
                else {
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.right.proxyMedian.coordinates, 
                        joint.down.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.down.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.down.proxyMedian.coordinates, 
                        joint.right.proxy2.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.right.proxy1.coordinates,
                        joint.right.proxyMedian.coordinates
                    ));
                }
            }
            // Handle the case where the left and up ducts are present
            else if(joint.left != null && joint.up != null) {
                if(sharedData.jointStyle == "arc" || sharedData.jointStyle == "diagonal") {
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.up.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.up.proxyMedian.coordinates, 
                        joint.left.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.left.proxy2.coordinates,
                        joint.left.proxyMedian.coordinates,
                        true,
                        Math.PI / 2
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.left.proxyMedian.coordinates,
                        joint.up.proxy2.coordinates,
                        true,
                        Math.PI / 2
                    ));
                }
                else {
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.up.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.up.proxyMedian.coordinates, 
                        joint.left.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.left.proxy2.coordinates, 
                        joint.left.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyUphill(
                        joint.left.proxyMedian.coordinates,
                        joint.up.proxy2.coordinates
                    ));
                }
            }
            // Handle the case where the left and down ducts are present
            else if(joint.left != null && joint.down != null) {
                if(sharedData.jointStyle == "arc" || sharedData.jointStyle == "diagonal") {
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxy2.coordinates, 
                        joint.left.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxyMedian.coordinates,
                        joint.down.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxy1.coordinates,
                        joint.down.proxyMedian.coordinates,
                        true,
                        Math.PI
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.down.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates,
                        true,
                        Math.PI
                    ));
                }
                else {
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxy2.coordinates, 
                        joint.left.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.left.proxyMedian.coordinates,
                        joint.down.proxy1.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.down.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    ));
                    geometries.push(...connectProxiesDiagonallyDownhill(
                        joint.down.proxyMedian.coordinates, 
                        joint.left.proxy1.coordinates
                    ));
                }
            }  
        }

        // Handle the backwall creation based on joint direction and style
        if(sharedData.jointDirection == "inwards" && sharedData.jointStyle == "arc") {
            console.log("createArchedBackwall");
            geometries.push(
                ...this.createLJointBackwall(joint)
            );
        }
        else {
            geometries.push(
                ...this.createLJointBackwall(joint)
            );
        }

        // Create joint closures for each side of the L-joint
        geometries.push(...createJointClosure(joint.up, "horizontal"));
        geometries.push(...createJointClosure(joint.right, "vertical"));
        geometries.push(...createJointClosure(joint.down, "horizontal"));
        geometries.push(...createJointClosure(joint.left, "vertical"));

        sharedData.isLJoint = false;

        // Merge all geometries into one
        const newMergedGeometry = mergeGeometries(geometries);
        return newMergedGeometry;
    }

    /**
     * createLJointBackwall
     * 
     * This function generates the backwall geometry for the L-joint based on the provided 
     * joint data (proxies and direction). It adds midpoints if the joint style is "arc".
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} - The backwall geometry for the L-joint.
     */
    createLJointBackwall(joint) {
        let backwall = [];
        if(joint.up != null && joint.right != null) {    
            backwall = [
                joint.up.proxyMedian.coordinates[4],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy2.coordinates[7],
                joint.right.proxyMedian.coordinates[6],
                joint.right.proxy1.coordinates[6],
                joint.right.proxy2.coordinates[6],
            ];
            if(sharedData.jointStyle == "arc" && sharedData.jointDirection == "inwards") {
                let rightMidpoint = {
                    x: joint.up.proxy2.coordinates[4].x,
                    y: joint.up.proxy2.coordinates[4].y,
                    z: joint.right.proxy1.coordinates[4].z
                }
                backwall.splice(4, 0, rightMidpoint);
            }
        }
        else if(joint.up != null && joint.left != null) {    
            backwall = [
                joint.up.proxyMedian.coordinates[4],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy2.coordinates[7],
                joint.left.proxyMedian.coordinates[6],
                joint.left.proxy2.coordinates[5],
                joint.left.proxy1.coordinates[4],
            ];
            if(sharedData.jointStyle == "arc" && sharedData.jointDirection == "inwards") {
                let leftMidpoint = {
                    x: joint.up.proxy1.coordinates[4].x,
                    y: joint.up.proxy1.coordinates[4].y,
                    z: joint.left.proxy1.coordinates[4].z
                }
                backwall.splice(0, 0, leftMidpoint);
            }
        }
        else if(joint.down != null && joint.right != null) {    
            backwall = [
                joint.right.proxy1.coordinates[7],
                joint.right.proxy2.coordinates[7],
                joint.down.proxyMedian.coordinates[6],
                joint.down.proxy2.coordinates[6],
                joint.down.proxy1.coordinates[5],
                joint.right.proxyMedian.coordinates[4],
            ];
            if(sharedData.jointStyle == "arc" && sharedData.jointDirection == "inwards") {
                let downMidpoint = {
                    x: joint.down.proxy2.coordinates[4].x,
                    z: joint.right.proxy2.coordinates[4].z
                }
                backwall.splice(2, 0, downMidpoint);
            }
        }
        else if(joint.down != null && joint.left != null) {    
            backwall = [
                joint.left.proxy1.coordinates[4],
                joint.left.proxy2.coordinates[4],
                joint.left.proxyMedian.coordinates[5],
                joint.down.proxy1.coordinates[5],
                joint.down.proxy2.coordinates[6],
                joint.down.proxyMedian.coordinates[6],
            ];
            if(sharedData.jointStyle == "arc" && sharedData.jointDirection == "inwards") {
                let downMidpoint = {
                    x: joint.down.proxy1.coordinates[4].x,
                    y: joint.down.proxy1.coordinates[4].y,
                    z: joint.left.proxy2.coordinates[4].z
                }
                backwall.splice(2, 0, downMidpoint);
            }
        }

        let geometry = [];
        if(backwall.length >= 3) {
            geometry.push(createJointBackwall(backwall));
        }

        console.log("createLJointBackwall:", geometry);

        return geometry;
    }

    /**
     * patchLJointBackwall
     * 
     * This function creates additional backwall geometries for the L-joint when necessary.
     * It ensures the wall is patched and complete by generating the missing parts of the joint.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} - The patched backwall geometries for the L-joint.
     */
    patchLJointBackwall(joint) {
        let geometry = [];
        let backwall = [];
        if(joint.up != null && joint.right != null) {    
            backwall = [
                joint.up.proxyMedian2.coordinates[4],
                joint.up.proxyMedian2.coordinates[5],
                joint.right.proxy2.coordinates[6],
                joint.right.proxy1.coordinates[6],
                joint.right.proxy1.coordinates[4],
            ];
            geometry.push(createJointBackwall(backwall));
            backwall = [
                joint.up.proxyMedian.coordinates[6],
                joint.up.proxy2.coordinates[6],
                joint.up.proxy2.coordinates[7],
                joint.up.proxy1.coordinates[4],
                joint.up.proxyMedian.coordinates[5],
            ];
            geometry.push(createJointBackwall(backwall));
        }
        else if(joint.up != null && joint.left != null) {  
            backwall = [
                joint.left.proxyMedian2.coordinates[7],
                joint.left.proxy1.coordinates[7],
                joint.left.proxy1.coordinates[4],
                joint.left.proxy2.coordinates[5],
                joint.left.proxyMedian2.coordinates[6],
            ];
            geometry.push(createJointBackwall(backwall));
            backwall = [
                joint.left.proxyMedian.coordinates[5],
                joint.left.proxyMedian.coordinates[6],
                joint.up.proxy2.coordinates[7],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy1.coordinates[5],
            ];
            geometry.push(createJointBackwall(backwall)); 
        }
        else if(joint.down != null && joint.right != null) {  
            backwall = [
                joint.right.proxyMedian.coordinates[7],
                joint.right.proxyMedian.coordinates[4],
                joint.down.proxy1.coordinates[5],
                joint.down.proxy2.coordinates[6],
                joint.down.proxy2.coordinates[7],
            ];
            geometry.push(createJointBackwall(backwall));
            backwall = [
                joint.right.proxyMedian2.coordinates[4],
                joint.right.proxyMedian2.coordinates[5],
                joint.right.proxy2.coordinates[5],
                joint.right.proxy2.coordinates[6],
                joint.right.proxy1.coordinates[7],
            ];
            geometry.push(createJointBackwall(backwall));  
        }
        else if(joint.down != null && joint.left != null) {   
            backwall = [
                joint.down.proxyMedian2.coordinates[6],
                joint.down.proxyMedian2.coordinates[7],
                joint.left.proxy1.coordinates[4],
                joint.left.proxy2.coordinates[5],
                joint.left.proxy2.coordinates[6],
            ];
            geometry.push(createJointBackwall(backwall));
            backwall = [
                joint.down.proxyMedian.coordinates[4],
                joint.down.proxy1.coordinates[4],
                joint.down.proxy1.coordinates[5],
                joint.down.proxy2.coordinates[6],
                joint.down.proxyMedian.coordinates[7],
            ]; 
            geometry.push(createJointBackwall(backwall));
        }

        return geometry;
    }

    /**
     * createWallMesh
     * 
     * This function generates a wall mesh from the backwall arc configurations and applies transformations.
     * It is used to create the geometry for the joint wall and add it to the scene.
     * 
     * @param {Object} joint - The joint data used for generating the wall mesh.
     */
    createWallMesh(joint) {
        const mergeLineValue = 5;
        const backwallArcConfigs = sharedData.backwallArcConfigs;

        console.log("createWallMesh backwallArcConfigs:", JSON.stringify(backwallArcConfigs, null, 2));

        const wallMaterial = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor, side: THREE.DoubleSide });

        const backwallGeometry = new THREE.RingGeometry(
            backwallArcConfigs[0].innerRadius + mergeLineValue, 
            backwallArcConfigs[0].outerRadius - mergeLineValue, 
            backwallArcConfigs[0].thetaSegments, 
            backwallArcConfigs[0].phiSegments, 
            backwallArcConfigs[0].thetaStart, 
            backwallArcConfigs[0].thetaLength
        );

        if(backwallArcConfigs[1] == undefined) {
            backwallArcConfigs.push(backwallArcConfigs[0]);
        }

        const backwallGeometry2 = new THREE.RingGeometry(
            backwallArcConfigs[1].innerRadius + mergeLineValue, 
            backwallArcConfigs[1].outerRadius - mergeLineValue, 
            backwallArcConfigs[1].thetaSegments, 
            backwallArcConfigs[1].phiSegments, 
            backwallArcConfigs[1].thetaStart, 
            backwallArcConfigs[1].thetaLength
        );

        const backwall = new THREE.Mesh(backwallGeometry, wallMaterial);
        const backwall2 = new THREE.Mesh(backwallGeometry2, wallMaterial);

        backwall.position.copy(backwallArcConfigs[0].ring2.userData.position);
        backwall.rotation.copy(backwallArcConfigs[0].ring2.userData.rotation);
        backwall2.position.copy(backwallArcConfigs[1].ring2.userData.position);
        backwall2.rotation.copy(backwallArcConfigs[1].ring2.userData.rotation); 
        
        const width = backwallArcConfigs[0].ring2.userData.width;
        const width2 = backwallArcConfigs[1].ring2.userData.width;

        let xFactor = 1;
        let zFactor = 1;
        if(joint.left != null) {
            xFactor = -1;
        }
        if(joint.down != null) {
            zFactor = -1;
        }

        backwall.position.x += ((width / 2) - 15) * xFactor;
        backwall.position.z += ((width / 2) - 15) * zFactor;

        backwall2.position.x += ((width2 / 2) - 15) * xFactor;
        backwall2.position.z += ((width2 / 2) - 15) * zFactor;

        backwall.updateMatrix();
        backwall.geometry.applyMatrix4(backwall.matrix);

        backwall2.updateMatrix();
        backwall2.geometry.applyMatrix4(backwall2.matrix);        

        const wallMesh = this.connectWallArcs(backwall.geometry, backwall2.geometry);

        wallMesh.name = "jointWall";

        // Add to scene
        sharedData.sceneHelper.addToScene(wallMesh);
        const wallMesh2 = wallMesh.clone();
        wallMesh2.position.y -= 30;
        sharedData.sceneHelper.addToScene(wallMesh2);
    }

    /**
     * connectWallArcs
     * 
     * This function connects two wall arcs (using two ring geometries) to form a complete wall mesh. 
     * It generates the vertices and faces to create a quad between the two arcs.
     * 
     * @param {THREE.BufferGeometry} backwallGeometry - The geometry for the first arc.
     * @param {THREE.BufferGeometry} backwallGeometry2 - The geometry for the second arc.
     * @returns {THREE.Mesh} - The complete wall mesh connecting the two arcs.
     */
    connectWallArcs(backwallGeometry, backwallGeometry2) {
        // Extract the outer vertices of each ring
        function getArcVertices(geometry) {
            const positions = geometry.attributes.position.array;
            const vertices = [];
            for (let i = 0; i < positions.length; i += 3) {
                vertices.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
            }
            return vertices.slice(vertices.length / 2); // Keep only the outer arc
        }

        const arc1Vertices = getArcVertices(backwallGeometry);
        const arc2Vertices = getArcVertices(backwallGeometry2);

        // Generate faces and vertices for the wall
        const wallVertices = [];
        const wallIndices = [];

        for (let i = 0; i < arc1Vertices.length - 1; i++) {
            const a = arc1Vertices[i];
            const b = arc1Vertices[i + 1];
            const c = arc2Vertices[i];
            const d = arc2Vertices[i + 1];

            // Push vertices
            wallVertices.push(a.x, a.y, a.z);
            wallVertices.push(b.x, b.y, b.z);
            wallVertices.push(c.x, c.y, c.z);
            wallVertices.push(d.x, d.y, d.z);

            // Define indices for two triangles forming a quad
            const index = i * 4;
            wallIndices.push(index, index + 2, index + 1);
            wallIndices.push(index + 1, index + 2, index + 3);
        }

        // Create the wall geometry
        const wallGeometry = new THREE.BufferGeometry();
        wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wallVertices, 3));
        wallGeometry.setIndex(wallIndices);
        wallGeometry.computeVertexNormals(); // Optional: Compute normals for lighting

        // Create the mesh
        const wallMaterial = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor, side: THREE.DoubleSide });
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

        // Add to scene
        sharedData.sceneHelper.addToScene(wallMesh);

        return wallMesh;
    }
}
