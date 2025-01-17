import * as THREE from 'three';
import { 
    calculateJointCenter, 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeAndAddToScene,
    sharedData
} from "./Geometry_3D_Joints_Utils.js";

export default class Geometry_3D_Joints_L {
    createLJoint(intersection, largestGlobalSize) {
        const geometries = [];
        let diagonalWidth = 0;

        sharedData.backwallArcConfigs = [];

        sharedData.isLJoint = true;

        calculateJointCenter(intersection, "L-Joint"); 

        if(sharedData.xzJointDirection == "outwards") {
            if(intersection.right != null && intersection.up != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {

                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI * 2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxy2Vertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );

                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy2Vertices, 
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices,
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );                
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy1Vertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
            }
            else if(intersection.right != null && intersection.down != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI / -2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices2,
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
            } 
            else if(intersection.left != null && intersection.up != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.up.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI / 2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices2,
                            intersection.left.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.up.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
            }
            else if(intersection.left != null && intersection.down != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    // geometries.push(
                    //     ...connectProxiesDiagonallyDownhill(
                    //         intersection.down.segment.duct.userData.proxyMedianVertices, 
                    //         intersection.left.segment.duct.userData.proxy1Vertices
                    //     )
                    // );  
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI
                        ) 
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices2, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );  
                }
                    
            }  
        }
        else if(sharedData.xzJointDirection == "inwards") {
            if(intersection.right != null && intersection.up != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {

                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI * 2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxy2Vertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices,
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    ); 
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy1Vertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    ); 
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
            }
            else if(intersection.right != null && intersection.down != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI / -2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices2,
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
            }
            else if(intersection.left != null && intersection.up != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI / 2
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices2,
                            intersection.left.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.up.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.up.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
            }  
            else if(intersection.left != null && intersection.down != null) {
                if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI
                        ) 
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices2, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        ) 
                    );
                }
            }  
        }

        if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
            console.log("createArchedBackwall");

            this.createWallMesh(intersection, largestGlobalSize); 
            this.patchLJointBackwall(intersection, largestGlobalSize, diagonalWidth);
        }
        else {
            this.createLJointBackwall(intersection, largestGlobalSize, diagonalWidth);
        }

        geometries.push(
            ...createJointClosure(intersection.up, "horizontal")
        ); 
        geometries.push(
            ...createJointClosure(intersection.right, "vertical")
        ); 
        geometries.push(
            ...createJointClosure(intersection.down, "horizontal")
        ); 
        geometries.push(
            ...createJointClosure(intersection.left, "vertical")
        ); 

        mergeAndAddToScene(geometries);

        sharedData.isLJoint = false;
    }

    createLJointBackwall(intersection, largestGlobalSize) {
        let backwall = [];
        if(intersection.up != null && intersection.right != null) {    
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
            ];
            if(sharedData.xzJointStyle == "arc" && sharedData.xzJointDirection == "inwards") {
                let rightMidpoint = {
                    x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                    z: intersection.right.segment.duct.userData.proxy1Vertices[4].z
                }
                backwall.splice(4, 0, rightMidpoint);
            }
            if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, intersection.up.segment.duct.userData.proxyMedianVertices2[4]);
            }
        }
        else if(intersection.up != null && intersection.left != null) {    
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
            ];
            if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal"){
                backwall.splice(4, 0, intersection.left.segment.duct.userData.proxyMedianVertices2[6]);
            }
            if(sharedData.xzJointStyle == "arc" && sharedData.xzJointDirection == "inwards") {
                let leftMidpoint = {
                    x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                    z: intersection.left.segment.duct.userData.proxy1Vertices[4].z
                }
                backwall.splice(0, 0, leftMidpoint);
            }
        }
        else if(intersection.down != null && intersection.right != null) {    
            backwall = [
                intersection.right.segment.duct.userData.proxy1Vertices[7],
                intersection.right.segment.duct.userData.proxy2Vertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.right.segment.duct.userData.proxyMedianVertices[4],
            ];
            if(sharedData.xzJointStyle == "arc" && sharedData.xzJointDirection == "inwards") {
                let downMidpoint = {
                    x: intersection.down.segment.duct.userData.proxy2Vertices[4].x,
                    z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
                }
                backwall.splice(2, 0, downMidpoint);
            }
            if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, intersection.right.segment.duct.userData.proxyMedianVertices2[4]);
            }
        }
        else if(intersection.down != null && intersection.left != null) {    
            backwall = [
                intersection.left.segment.duct.userData.proxy1Vertices[4],
                intersection.left.segment.duct.userData.proxy2Vertices[4],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
            ];
            if(sharedData.xzJointStyle == "arc" && sharedData.xzJointDirection == "inwards") {
                let downMidpoint = {
                    x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                    z: intersection.left.segment.duct.userData.proxy2Vertices[4].z
                }
                backwall.splice(2, 0, downMidpoint);
            }
            if(sharedData.xzJointStyle == "arc" || sharedData.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, intersection.down.segment.duct.userData.proxyMedianVertices2[4]);
            }
            
        }
        
        if(backwall.length >= 3) {
            createJointBackwall(backwall, largestGlobalSize);
        }

    }

    patchLJointBackwall(intersection, largestGlobalSize) {
        let backwall = [];
        if(intersection.up != null && intersection.right != null) {    
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices2[4],
                intersection.up.segment.duct.userData.proxyMedianVertices2[5],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[4],
            ];
            createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxyMedianVertices[5],
            ];
            createJointBackwall(backwall, largestGlobalSize);
        }
        else if(intersection.up != null && intersection.left != null) {  
            backwall = [
                intersection.left.segment.duct.userData.proxyMedianVertices2[7],
                intersection.left.segment.duct.userData.proxy1Vertices[7],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices2[6],
            ];
            createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[5],
            ];
            createJointBackwall(backwall, largestGlobalSize);  
        }
        else if(intersection.down != null && intersection.right != null) {  
            backwall = [
                intersection.right.segment.duct.userData.proxyMedianVertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[4],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[7],
            ];
            createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                intersection.right.segment.duct.userData.proxyMedianVertices2[4],
                intersection.right.segment.duct.userData.proxyMedianVertices2[5],
                intersection.right.segment.duct.userData.proxy2Vertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[7],
            ];
            createJointBackwall(backwall, largestGlobalSize);   
        }
        else if(intersection.down != null && intersection.left != null) {   
            backwall = [
                intersection.down.segment.duct.userData.proxyMedianVertices2[6],
                intersection.down.segment.duct.userData.proxyMedianVertices2[7],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[6],
            ];
            createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                intersection.down.segment.duct.userData.proxyMedianVertices[4],
                intersection.down.segment.duct.userData.proxy1Vertices[4],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxyMedianVertices[7],
            ];
            createJointBackwall(backwall, largestGlobalSize);  
        }

    }

    createWallMesh(intersection, largestGlobalSize) {
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
        if(intersection.left != null) {
            xFactor = -1;
        }
        if(intersection.down != null) {
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