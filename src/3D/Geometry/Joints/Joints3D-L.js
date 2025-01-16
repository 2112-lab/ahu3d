import { calculateJointCenter } from "../../../Arithmetics/Joints.js";

export default class Joints3D_L {
    createLJoint(intersection, largestGlobalSize) {
        const geometries = [];
        let diagonalWidth = 0;

        this.backwallArcConfigs = [];

        this.isLJoint = true;

        calculateJointCenter(intersection, "L-Joint"); 

        if(this.xzJointDirection == "outwards") {
            if(intersection.right != null && intersection.up != null) {
                if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal") {

                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI * 2
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxy2Vertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices2
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );

                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy2Vertices, 
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices,
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );                
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy1Vertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
            }
            else if(intersection.right != null && intersection.down != null) {
                if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI / -2
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices2,
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
            } 
            else if(intersection.left != null && intersection.up != null) {
                if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.up.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI / 2
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices2,
                            intersection.left.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.up.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
            }
            else if(intersection.left != null && intersection.down != null) {
                if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    // geometries.push(
                    //     ...this.connectProxiesDiagonallyDownhill(
                    //         intersection.down.segment.duct.userData.proxyMedianVertices, 
                    //         intersection.left.segment.duct.userData.proxy1Vertices
                    //     )
                    // );  
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI
                        ) 
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices2, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );  
                }
                    
            }  
        }
        else if(this.xzJointDirection == "inwards") {
            if(intersection.right != null && intersection.up != null) {
                if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal") {

                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI * 2
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxy2Vertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices2
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxyMedianVertices,
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    ); 
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy1Vertices, 
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    ); 
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
            }
            else if(intersection.right != null && intersection.down != null) {
                if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI / -2
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices2,
                            intersection.right.segment.duct.userData.proxy1Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
            }
            else if(intersection.left != null && intersection.up != null) {
                if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI / 2
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices2,
                            intersection.left.segment.duct.userData.proxy2Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.up.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyUphill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.up.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
            }  
            else if(intersection.left != null && intersection.down != null) {
                if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal") {
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices2,
                            true,
                            Math.PI
                        ) 
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices2, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxy2Vertices, 
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.left.segment.duct.userData.proxyMedianVertices,
                            intersection.down.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesDiagonallyDownhill(
                            intersection.down.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        ) 
                    );
                }
            }  
        }

        if(this.xzJointDirection == "inwards" && this.xzJointStyle == "arc") {
            console.log("createArchedBackwall");

            this.createWallMesh(intersection, largestGlobalSize); 
            this.patchLJointBackwall(intersection, largestGlobalSize, diagonalWidth);
        }
        else {
            this.createLJointBackwall(intersection, largestGlobalSize, diagonalWidth);
        }

        geometries.push(
            ...this.createJointClosure(intersection.up, "horizontal")
        ); 
        geometries.push(
            ...this.createJointClosure(intersection.right, "vertical")
        ); 
        geometries.push(
            ...this.createJointClosure(intersection.down, "horizontal")
        ); 
        geometries.push(
            ...this.createJointClosure(intersection.left, "vertical")
        ); 

        this.mergeAndAddToScene(geometries);

        this.isLJoint = false;
    }
}