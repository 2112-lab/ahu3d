import { 
    calculateJointCenter, 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeAndAddToScene
} from "./Geometry_3D_Joints_Utils.js";

export default class Geometry_3D_Joints_Cross {
    createCrossJoint(intersection, largestGlobalSize) {
        const geometries = [];

        this.backwallArcConfigs = [];

        calculateJointCenter(intersection, "Cross-Joint");        

        if(this.xzJointStyle == "arc") {     

            let upMidpoint = {
                x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.up.segment.duct.userData.proxyMedianVertices[4].z
            }
            let rightMidpoint = {
                x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxyMedianVertices[4].z
            }
            let downMidpoint = {
                x: intersection.down.segment.duct.userData.proxyMedianVertices[4].x,
                z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
            }
            let leftMidpoint = {
                x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxyMedianVertices[4].z
            }

            let backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[7],
                intersection.right.segment.duct.userData.proxy1Vertices[7],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[4]
            ];

            if(this.xzJointDirection == "inwards") {
                upMidpoint = {
                    x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                    z: intersection.up.segment.duct.userData.proxyMedianVertices[4].z
                }
                let upMidpoint2 = {
                    x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                    z: intersection.left.segment.duct.userData.proxy1Vertices[4].z
                }

                rightMidpoint = {
                    x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                    z: intersection.right.segment.duct.userData.proxyMedianVertices[4].z
                }
                let rightMidpoint2 = {
                    x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                    z: intersection.right.segment.duct.userData.proxy1Vertices[4].z
                }
                
                leftMidpoint = {
                    x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                    z: intersection.left.segment.duct.userData.proxyMedianVertices[4].z
                }
                let leftMidpoint2 = {
                    x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                    z: intersection.left.segment.duct.userData.proxy2Vertices[4].z
                }

                downMidpoint = {
                    x: intersection.down.segment.duct.userData.proxyMedianVertices[4].x,
                    z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
                }
                let downMidpoint2 = {
                    x: intersection.down.segment.duct.userData.proxy2Vertices[4].x,
                    z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
                }

                backwall = [
                    upMidpoint2,
                    intersection.up.segment.duct.userData.proxyMedianVertices[4],
                    upMidpoint,
                    intersection.up.segment.duct.userData.proxy1Vertices[4],
                    intersection.up.segment.duct.userData.proxy2Vertices[7],
                    rightMidpoint,
                    intersection.right.segment.duct.userData.proxyMedianVertices[7],
                    rightMidpoint2,
                    intersection.right.segment.duct.userData.proxy1Vertices[7],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    downMidpoint,
                    intersection.down.segment.duct.userData.proxyMedianVertices[6],
                    downMidpoint2,
                    intersection.down.segment.duct.userData.proxy2Vertices[6],
                    intersection.down.segment.duct.userData.proxy1Vertices[5],
                    leftMidpoint,
                    intersection.left.segment.duct.userData.proxyMedianVertices[5],
                    leftMidpoint2,
                    intersection.left.segment.duct.userData.proxy2Vertices[5],
                    intersection.left.segment.duct.userData.proxy1Vertices[4]
                ];
            }

            createJointBackwall(backwall, largestGlobalSize);
        }
        else {
            let backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[7],
                intersection.right.segment.duct.userData.proxy1Vertices[7],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[4]
            ];
    
            createJointBackwall(backwall, largestGlobalSize);
        }  

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
}