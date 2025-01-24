import { 
    calculateJointCenter, 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeAndAddToScene
} from "./Geometry_3D_Joints_Utils.js";
import { sharedData } from "../../../Ahu3D/globals.js";

export default class Geometry_3D_Joints_T {
    createTJoint(intersection, largestGlobalSize) {
        const geometries = [];

        sharedData.backwallArcConfigs = [];

        calculateJointCenter(intersection, "T-Joint");  

        if(sharedData.xzJointDirection == "outwards") {
            if(intersection.right == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill( 
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    ) 
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )   
                );
            }
            else if(intersection.left == null) {
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );

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
                    ...connectProxiesDiagonallyUphill(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.down == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        true,
                        Math.PI / 2
                    )
                );

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }
            else if(intersection.up == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    ) 
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
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
                    ...connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    ) 
                );       
            }
        }
        else if(sharedData.xzJointDirection == "inwards") {
            if(intersection.right == null) {
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices,
                        true
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices,
                        true
                    )
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
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
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    )
                );
            }
            else if(intersection.left == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices,
                        true
                    )
                );
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
                    ...connectProxiesDiagonallyUphill(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.down == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        true
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        true
                    )
                );

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }
            else if(intersection.up == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        true
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        true
                    ) 
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
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
                    ...connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    ) 
                );   
            }
        }

        this.createTJointBackwall(intersection, largestGlobalSize);

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
    }

    createTJointBackwall(intersection, largestGlobalSize) {
        let backwall = [];

        let topLeftMidpoint = {};
        let topRightMidpoint = {};
        let bottomRightMidpoint = {};
        let bottomLeftMidpoint = {};
        if(intersection.right == null) {
            topLeftMidpoint = {
                x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxy1Vertices[4].z
            }
            bottomLeftMidpoint = {
                x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxy2Vertices[4].z
            }
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
            ];
            if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
                backwall.splice(6, 0, bottomLeftMidpoint);
                backwall.splice(8, 0, bottomLeftMidpoint);
                backwall.splice(0, 0, topLeftMidpoint);
                backwall.splice(2, 0, topLeftMidpoint);
            }
        }
        else if(intersection.left == null) {
            topRightMidpoint = {
                x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxy1Vertices[4].z
            }
            bottomRightMidpoint = {
                x: intersection.down.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
            }
            topLeftMidpoint = {
                x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.up.segment.duct.userData.proxyMedianVertices[4].z
            }
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
            ];
            if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
                backwall.splice(3, 0, topRightMidpoint);
                backwall.splice(5, 0, topRightMidpoint);
                backwall.splice(8, 0, bottomRightMidpoint);
                backwall.splice(10, 0, bottomRightMidpoint);
            }
        }
        else if(intersection.down == null) {
            topLeftMidpoint = {
                x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxy1Vertices[4].z
            }
            topRightMidpoint = {
                x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxy1Vertices[4].z
            }
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[5],
            ];
            if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
                backwall.splice(4, 0, topRightMidpoint);
                backwall.splice(0, 0, topLeftMidpoint);
            }
        }
        else if(intersection.up == null) {
            bottomRightMidpoint = {
                x: intersection.down.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
            }
            bottomLeftMidpoint = {
                x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxy2Vertices[4].z
            }
            backwall = [
                intersection.down.segment.duct.userData.proxyMedianVertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.down.segment.duct.userData.proxy1Vertices[6],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxy2Vertices[4],
                intersection.left.segment.duct.userData.proxy1Vertices[5],
                intersection.right.segment.duct.userData.proxyMedianVertices[4],
                intersection.right.segment.duct.userData.proxy1Vertices[7],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
            ];
            if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
                backwall.splice(4, 0, bottomLeftMidpoint);
                backwall.splice(0, 0, bottomRightMidpoint);
            }
        }

        if(backwall.length >= 3) {
            createJointBackwall(backwall, largestGlobalSize);
        }
    }
}