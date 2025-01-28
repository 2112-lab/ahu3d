import * as THREE from 'three';
import { 
    calculateJointCenter, 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeGeometries
} from "./Geometry_3D_Joints_Utils.js";
import { sharedData } from "../../../Ahu3D/globals.js";

export default class Geometry_3D_Joints_L {
    createLJoint(joint, largestGlobalSize) {
        const geometries = [];
        let diagonalWidth = 0;

        console.log("createLJoint2 started:", joint);

        sharedData.backwallArcConfigs = [];

        sharedData.isLJoint = true;

        console.log("createLJoint2 step 1");

        // calculateJointCenter(joint, "L-Joint"); 

        console.log("createLJoint2 step 2:", sharedData.xzJointDirection);

        if(sharedData.xzJointDirection == "outwards") {
            if(joint.right != null && joint.up != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {

                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxyMedian.coordinates, 
                            joint.up.proxyMedian2.coordinates,
                            true,
                            Math.PI * 2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.right.proxy2.coordinates, 
                            joint.up.proxyMedian2.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxyMedian.coordinates, 
                            joint.up.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.right.proxyMedian.coordinates, 
                            joint.right.proxy1.coordinates
                        )
                    );

                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxy2.coordinates, 
                            joint.right.proxyMedian.coordinates
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxy2.coordinates,
                            joint.right.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.right.proxyMedian.coordinates, 
                            joint.right.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxyMedian.coordinates,
                            joint.right.proxy2.coordinates
                        )
                    );                
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxy1.coordinates, 
                            joint.up.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxy2.coordinates,
                            joint.right.proxyMedian.coordinates
                        )
                    );
                }
            }
            else if(joint.right != null && joint.down != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxyMedian.coordinates, 
                            joint.down.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.down.proxy2.coordinates,
                            joint.down.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxyMedian.coordinates,
                            joint.right.proxyMedian.coordinates2,
                            true,
                            Math.PI / -2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxyMedian.coordinates2,
                            joint.right.proxy1.coordinates
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxyMedian.coordinates, 
                            joint.down.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.down.proxy2.coordinates,
                            joint.down.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.down.proxyMedian.coordinates, 
                            joint.right.proxy2.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxy1.coordinates,
                            joint.right.proxyMedian.coordinates
                        )
                    );
                }
            } 
            else if(joint.left != null && joint.up != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.up.proxy1.coordinates,
                            joint.up.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.up.proxyMedian.coordinates, 
                            joint.left.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxyMedian.coordinates,
                            joint.up.proxy2.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxyMedian.coordinates, 
                            joint.left.proxyMedian.coordinates2,
                            true,
                            Math.PI / 2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxyMedian.coordinates2,
                            joint.left.proxy2.coordinates
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.up.proxy1.coordinates,
                            joint.up.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.up.proxyMedian.coordinates, 
                            joint.left.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxy2.coordinates, 
                            joint.left.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxyMedian.coordinates,
                            joint.up.proxy2.coordinates
                        )
                    );
                }
            }
            else if(joint.left != null && joint.down != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxy2.coordinates, 
                            joint.left.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxyMedian.coordinates,
                            joint.down.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxy2.coordinates,
                            joint.down.proxyMedian.coordinates
                        )
                    );
                    // geometries.push(
                    //     ...connectProxiesDiagonallyDownhill(
                    //         joint.down.proxyMedian.coordinates, 
                    //         joint.left.proxy1.coordinates
                    //     )
                    // );  
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxyMedian.coordinates, 
                            joint.down.proxyMedian.coordinates2,
                            true,
                            Math.PI
                        ) 
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxyMedian.coordinates2, 
                            joint.left.proxy1.coordinates
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxy2.coordinates, 
                            joint.left.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxyMedian.coordinates,
                            joint.down.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxy2.coordinates,
                            joint.down.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxyMedian.coordinates, 
                            joint.left.proxy1.coordinates
                        )
                    );  
                }
                    
            }  
        }
        else if(sharedData.xzJointDirection == "inwards") {
            if(joint.right != null && joint.up != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxyMedian.coordinates, 
                            joint.up.proxyMedian2.coordinates,
                            true,
                            Math.PI * 2
                        )
                    );

                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.right.proxy2.coordinates, 
                            joint.up.proxyMedian2.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxyMedian.coordinates, 
                            joint.up.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.right.proxyMedian.coordinates, 
                            joint.right.proxy1.coordinates
                        )
                    );
                }
                else {
                    console.log("createLJoint2 step 3");
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.right.proxyMedian.coordinates, 
                            joint.right.proxy1.coordinates
                        )
                    );
                    console.log("createLJoint2 step 4");
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxyMedian.coordinates,
                            joint.right.proxy2.coordinates
                        )
                    ); 
                    console.log("createLJoint2 step 5");
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxy1.coordinates, 
                            joint.up.proxyMedian.coordinates
                        )
                    ); 
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.up.proxy2.coordinates,
                            joint.right.proxyMedian.coordinates
                        )
                    );
                }
            }
            else if(joint.right != null && joint.down != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxyMedian.coordinates, 
                            joint.down.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.down.proxy2.coordinates,
                            joint.down.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.down.proxyMedian.coordinates, 
                            joint.right.proxy2.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxyMedian.coordinates,
                            joint.right.proxyMedian.coordinates2,
                            true,
                            Math.PI / -2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxyMedian.coordinates2,
                            joint.right.proxy1.coordinates
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxyMedian.coordinates, 
                            joint.down.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.down.proxy2.coordinates,
                            joint.down.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.down.proxyMedian.coordinates, 
                            joint.right.proxy2.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxy1.coordinates,
                            joint.right.proxyMedian.coordinates
                        )
                    );
                }
            }
            else if(joint.left != null && joint.up != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.up.proxy1.coordinates,
                            joint.up.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.up.proxyMedian.coordinates, 
                            joint.left.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxyMedian.coordinates, 
                            joint.left.proxyMedian.coordinates2,
                            true,
                            Math.PI / 2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxyMedian.coordinates2,
                            joint.left.proxy2.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxyMedian.coordinates,
                            joint.up.proxy2.coordinates
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.up.proxy1.coordinates,
                            joint.up.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.up.proxyMedian.coordinates, 
                            joint.left.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxy2.coordinates, 
                            joint.left.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxyMedian.coordinates,
                            joint.up.proxy2.coordinates
                        )
                    );
                }
            }  
            else if(joint.left != null && joint.down != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxy2.coordinates, 
                            joint.left.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxyMedian.coordinates,
                            joint.down.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxy2.coordinates,
                            joint.down.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxyMedian.coordinates, 
                            joint.down.proxyMedian.coordinates2,
                            true,
                            Math.PI
                        ) 
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxyMedian.coordinates2, 
                            joint.left.proxy1.coordinates
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxy2.coordinates, 
                            joint.left.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxyMedian.coordinates,
                            joint.down.proxy1.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxy2.coordinates,
                            joint.down.proxyMedian.coordinates
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.down.proxyMedian.coordinates, 
                            joint.left.proxy1.coordinates
                        ) 
                    );
                }
            }  
        }

        console.log("createLJoint2 step 3");

        if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
            console.log("createArchedBackwall");

            this.createWallMesh(joint, largestGlobalSize); 
            this.patchLJointBackwall(joint, largestGlobalSize, diagonalWidth);
        }
        else {
            geometries.push(
                ...this.createLJointBackwall(joint, largestGlobalSize)
            );
        }

        geometries.push(
            ...createJointClosure(joint.up, "horizontal")
        ); 
        geometries.push(
            ...createJointClosure(joint.right, "vertical")
        ); 
        geometries.push(
            ...createJointClosure(joint.down, "horizontal")
        ); 
        geometries.push(
            ...createJointClosure(joint.left, "vertical")
        ); 

        sharedData.isLJoint = false;

        const newMergedGeometry = mergeGeometries(geometries);
        return newMergedGeometry;
    }

    createLJointBackwall(joint, largestGlobalSize) {
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
            if(sharedData.xzJointStyle == "arc" && sharedData.xzJointDirection == "inwards") {
                let rightMidpoint = {
                    x: joint.up.proxy2.coordinates[4].x,
                    z: joint.right.proxy1.coordinates[4].z
                }
                backwall.splice(4, 0, rightMidpoint);
            }
            if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, joint.up.proxyMedian2.coordinates[4]);
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
            if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal"){
                backwall.splice(4, 0, joint.left.proxyMedian.coordinates2[6]);
            }
            if(sharedData.xzJointStyle == "arc" && sharedData.xzJointDirection == "inwards") {
                let leftMidpoint = {
                    x: joint.up.proxy1.coordinates[4].x,
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
            if(sharedData.xzJointStyle == "arc" && sharedData.xzJointDirection == "inwards") {
                let downMidpoint = {
                    x: joint.down.proxy2.coordinates[4].x,
                    z: joint.right.proxy2.coordinates[4].z
                }
                backwall.splice(2, 0, downMidpoint);
            }
            if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, joint.right.proxyMedian.coordinates2[4]);
            }
        }
        else if(joint.down != null && joint.left != null) {    
            backwall = [
                joint.left.proxy1.coordinates[4],
                joint.left.proxy2.coordinates[4],
                joint.left.proxyMedian.coordinates[5],
                joint.down.proxy1.coordinates[5],
                joint.down.proxy2.coordinates[5],
                joint.down.proxyMedian.coordinates[6],
            ];
            if(sharedData.xzJointStyle == "arc" && sharedData.xzJointDirection == "inwards") {
                let downMidpoint = {
                    x: joint.down.proxy1.coordinates[4].x,
                    z: joint.left.proxy2.coordinates[4].z
                }
                backwall.splice(2, 0, downMidpoint);
            }
            if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, joint.down.proxyMedian.coordinates2[4]);
            }
            
        }

        let geometry = [];
        if(backwall.length >= 3) {
            geometry.push(createJointBackwall(backwall, largestGlobalSize));
        }

        console.log("createLJointBackwall:", geometry);

        return geometry;

    }

    patchLJointBackwall(joint, largestGlobalSize) {
        let backwall = [];
        if(joint.up != null && joint.right != null) {    
            backwall = [
                joint.up.proxyMedian2.coordinates[4],
                joint.up.proxyMedian2.coordinates[5],
                joint.right.proxy2.coordinates[6],
                joint.right.proxy1.coordinates[6],
                joint.right.proxy1.coordinates[4],
            ];
            createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                joint.up.proxyMedian.coordinates[6],
                joint.up.proxy2.coordinates[6],
                joint.up.proxy2.coordinates[7],
                joint.up.proxy1.coordinates[4],
                joint.up.proxyMedian.coordinates[5],
            ];
            createJointBackwall(backwall, largestGlobalSize);
        }
        else if(joint.up != null && joint.left != null) {  
            backwall = [
                joint.left.proxyMedian.coordinates2[7],
                joint.left.proxy1.coordinates[7],
                joint.left.proxy1.coordinates[4],
                joint.left.proxy2.coordinates[5],
                joint.left.proxyMedian.coordinates2[6],
            ];
            createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                joint.left.proxyMedian.coordinates[5],
                joint.left.proxyMedian.coordinates[6],
                joint.up.proxy2.coordinates[7],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy1.coordinates[5],
            ];
            createJointBackwall(backwall, largestGlobalSize);  
        }
        else if(joint.down != null && joint.right != null) {  
            backwall = [
                joint.right.proxyMedian.coordinates[7],
                joint.right.proxyMedian.coordinates[4],
                joint.down.proxy1.coordinates[5],
                joint.down.proxy2.coordinates[6],
                joint.down.proxy2.coordinates[7],
            ];
            createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                joint.right.proxyMedian.coordinates2[4],
                joint.right.proxyMedian.coordinates2[5],
                joint.right.proxy2.coordinates[5],
                joint.right.proxy2.coordinates[6],
                joint.right.proxy1.coordinates[7],
            ];
            createJointBackwall(backwall, largestGlobalSize);   
        }
        else if(joint.down != null && joint.left != null) {   
            backwall = [
                joint.down.proxyMedian.coordinates2[6],
                joint.down.proxyMedian.coordinates2[7],
                joint.left.proxy1.coordinates[4],
                joint.left.proxy2.coordinates[5],
                joint.left.proxy2.coordinates[6],
            ];
            createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                joint.down.proxyMedian.coordinates[4],
                joint.down.proxy1.coordinates[4],
                joint.down.proxy1.coordinates[5],
                joint.down.proxy2.coordinates[6],
                joint.down.proxyMedian.coordinates[7],
            ];
            createJointBackwall(backwall, largestGlobalSize);  
        }

    }

    createWallMesh(joint, largestGlobalSize) {
        const mergeLineValue = 5;
        const backwallArcConfigs = sharedData.backwallArcConfigs;

        const wallMaterial = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor, side: THREE.DoubleSide });

        const backwallGeometry = new THREE.RingGeometry(
            backwallArcConfigs[0].innerRadius + mergeLineValue, 
            backwallArcConfigs[0].outerRadius - mergeLineValue, 
            backwallArcConfigs[0].thetaSegments, 
            backwallArcConfigs[0].phiSegments, 
            backwallArcConfigs[0].thetaStart, 
            backwallArcConfigs[0].thetaLength
        );

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

        // this.sceneHelper.addToScene(backwall);
        // this.sceneHelper.addToScene(backwall2);

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