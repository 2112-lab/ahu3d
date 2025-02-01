import { 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeGeometries
} from "./Geometry_3D_Joints_Utils.js";
import { sharedData } from "../../../Ahu3D/globals.js";

export default class Geometry_3D_Joints_T {
    createTJoint(joint) {
        console.log("createTJoint started:", joint);
        const geometries = [];

        sharedData.backwallArcConfigs = [];

        if(sharedData.xzJointDirection == "outwards") {
            if(joint.right == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.down.proxy2.coordinates, 
                        joint.down.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill( 
                        joint.up.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    )
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.left.proxy2.coordinates, 
                        joint.left.proxyMedian.coordinates
                    )  
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.left.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.up.proxyMedian.coordinates, 
                        joint.up.proxy1.coordinates
                    ) 
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.down.proxy1.coordinates,
                        joint.left.proxyMedian.coordinates
                    )   
                );
            }
            else if(joint.left == null) {
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.up.proxyMedian.coordinates, 
                        joint.up.proxy1.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.down.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates
                    )
                );

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
                    ...connectProxiesDiagonallyUphill(
                        joint.down.proxy2.coordinates, 
                        joint.down.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.right.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    )
                );
            }
            else if(joint.down == null) {

                if(joint.left.ductDimensions.y < joint.right.ductDimensions.y) {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.left.proxy2.coordinates,
                            joint.left.proxyMedian.coordinates
                        )
                    );
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.left.proxy2.coordinates,
                            joint.left.proxyMedian.coordinates
                        )
                    );
                }

                
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.left.proxyMedian.coordinates, 
                        joint.right.proxy2.coordinates,
                        true,
                        Math.PI / 2
                    )
                );

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.up.proxy1.coordinates, 
                        joint.up.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.left.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.right.proxy1.coordinates,
                        joint.right.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.right.proxyMedian.coordinates,
                        joint.up.proxy2.coordinates
                    )
                );
            }
            else if(joint.up == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.right.proxyMedian.coordinates, 
                        joint.left.proxy1.coordinates
                    )
                );

                if(joint.left.ductDimensions.y > joint.right.ductDimensions.y) {
                    geometries.push(
                        ...connectProxiesDiagonallyDownhill(
                            joint.right.proxy1.coordinates,
                            joint.right.proxyMedian.coordinates
                        ) 
                    );
                    
                }
                else {
                    geometries.push(
                        ...connectProxiesDiagonallyUphill(
                            joint.right.proxy1.coordinates,
                            joint.right.proxyMedian.coordinates
                        ) 
                    );
                }                

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.left.proxyMedian.coordinates, 
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
                    ...connectProxiesDiagonallyDownhill(
                        joint.left.proxy2.coordinates,
                        joint.left.proxyMedian.coordinates
                    ) 
                );       
            }
        }
        else if(sharedData.xzJointDirection == "inwards") {
            if(joint.right == null) {
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.down.proxy2.coordinates, 
                        joint.down.proxyMedian.coordinates,
                        true
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.up.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates,
                        true
                    )
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.down.proxy1.coordinates,
                        joint.left.proxyMedian.coordinates
                    )  
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.left.proxy2.coordinates, 
                        joint.left.proxyMedian.coordinates
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
                        joint.up.proxyMedian.coordinates, 
                        joint.up.proxy1.coordinates
                    )
                );
            }
            else if(joint.left == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.up.proxyMedian.coordinates, 
                        joint.up.proxy1.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.down.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates,
                        true
                    )
                );
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
                    ...connectProxiesDiagonallyUphill(
                        joint.down.proxy2.coordinates, 
                        joint.down.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.right.proxy2.coordinates,
                        joint.down.proxyMedian.coordinates
                    )
                );
            }
            else if(joint.down == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.left.proxy2.coordinates,
                        joint.left.proxyMedian.coordinates,
                        true
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.left.proxyMedian.coordinates, 
                        joint.right.proxy2.coordinates,
                        true
                    )
                );

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.up.proxy1.coordinates, 
                        joint.up.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.left.proxy1.coordinates,
                        joint.up.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.right.proxy1.coordinates,
                        joint.right.proxyMedian.coordinates
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.right.proxyMedian.coordinates,
                        joint.up.proxy2.coordinates
                    )
                );
            }
            else if(joint.up == null) {

                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.right.proxyMedian.coordinates, 
                        joint.left.proxy1.coordinates,
                        true
                    )
                );
                geometries.push(
                    ...connectProxiesDiagonallyUphill(
                        joint.right.proxy1.coordinates,
                        joint.right.proxyMedian.coordinates,
                        true
                    ) 
                );

                geometries.push(
                    ...connectProxiesDiagonallyDownhill(
                        joint.left.proxyMedian.coordinates, 
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
                    ...connectProxiesDiagonallyDownhill(
                        joint.left.proxy2.coordinates,
                        joint.left.proxyMedian.coordinates
                    ) 
                );   
            }
        }

        geometries.push(...this.createTJointBackwall(joint));

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

        console.log("createTJoint geometries:", geometries);

        const newMergedGeometry = mergeGeometries(geometries);
        return newMergedGeometry;
    }

    createTJointBackwall(joint) {
        let backwall = [];

        let topLeftMidpoint = {};
        let topRightMidpoint = {};
        let bottomRightMidpoint = {};
        let bottomLeftMidpoint = {};
        if(joint.right == null) {
            topLeftMidpoint = {
                x: joint.up.proxy1.coordinates[4].x,
                z: joint.left.proxy1.coordinates[4].z
            }
            bottomLeftMidpoint = {
                x: joint.down.proxy1.coordinates[4].x,
                z: joint.left.proxy2.coordinates[4].z
            }
            backwall = [
                joint.up.proxyMedian.coordinates[4],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy2.coordinates[7],
                joint.down.proxyMedian.coordinates[6],
                joint.down.proxy2.coordinates[6],
                joint.down.proxy1.coordinates[5],
                joint.left.proxyMedian.coordinates[5],
                joint.left.proxy2.coordinates[5],
                joint.left.proxy1.coordinates[4],
            ];
            if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
                backwall.splice(6, 0, bottomLeftMidpoint);
                backwall.splice(8, 0, bottomLeftMidpoint);
                backwall.splice(0, 0, topLeftMidpoint);
                backwall.splice(2, 0, topLeftMidpoint);
            }
        }
        else if(joint.left == null) {
            topRightMidpoint = {
                x: joint.up.proxy2.coordinates[4].x,
                y: joint.up.proxy2.coordinates[4].y,
                z: joint.right.proxy1.coordinates[4].z
            }
            bottomRightMidpoint = {
                x: joint.down.proxy2.coordinates[4].x,
                y: joint.down.proxy2.coordinates[4].y,
                z: joint.right.proxy2.coordinates[4].z
            }
            topLeftMidpoint = {
                x: joint.up.proxy1.coordinates[4].x,
                y: joint.up.proxy1.coordinates[4].y,
                z: joint.up.proxyMedian.coordinates[4].z
            }
            backwall = [
                joint.up.proxyMedian.coordinates[4],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy2.coordinates[7],
                joint.right.proxyMedian.coordinates[6],
                joint.right.proxy1.coordinates[6],
                joint.right.proxy2.coordinates[6],
                joint.down.proxyMedian.coordinates[6],
                joint.down.proxy2.coordinates[6],
                joint.down.proxy1.coordinates[5],
            ];
            if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
                backwall.splice(3, 0, topRightMidpoint);
                backwall.splice(5, 0, topRightMidpoint);
                backwall.splice(8, 0, bottomRightMidpoint);
                backwall.splice(10, 0, bottomRightMidpoint);
            }
        }
        else if(joint.down == null) {
            topLeftMidpoint = {
                x: joint.up.proxy1.coordinates[4].x,
                z: joint.left.proxy1.coordinates[4].z
            }
            topRightMidpoint = {
                x: joint.up.proxy2.coordinates[4].x,
                z: joint.right.proxy1.coordinates[4].z
            }
            backwall = [
                joint.up.proxyMedian.coordinates[4],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy2.coordinates[7],
                joint.right.proxyMedian.coordinates[6],
                joint.right.proxy1.coordinates[6],
                joint.right.proxy2.coordinates[6],
                joint.left.proxyMedian.coordinates[6],
                joint.left.proxy2.coordinates[5],
                joint.left.proxy1.coordinates[5],
            ];
            if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
                backwall.splice(4, 0, topRightMidpoint);
                backwall.splice(0, 0, topLeftMidpoint);
            }
        }
        else if(joint.up == null) {
            bottomRightMidpoint = {
                x: joint.down.proxy2.coordinates[4].x,
                z: joint.right.proxy2.coordinates[4].z
            }
            bottomLeftMidpoint = {
                x: joint.down.proxy1.coordinates[4].x,
                z: joint.left.proxy2.coordinates[4].z
            }
            backwall = [
                joint.down.proxyMedian.coordinates[5],
                joint.down.proxy2.coordinates[5],
                joint.down.proxy1.coordinates[6],
                joint.left.proxyMedian.coordinates[6],
                joint.left.proxy2.coordinates[4],
                joint.left.proxy1.coordinates[5],
                joint.right.proxyMedian.coordinates[4],
                joint.right.proxy1.coordinates[7],
                joint.right.proxy2.coordinates[6],
            ];
            if(sharedData.xzJointDirection == "inwards" && sharedData.xzJointStyle == "arc") {
                backwall.splice(4, 0, bottomLeftMidpoint);
                backwall.splice(0, 0, bottomRightMidpoint);
            }
        }

        let geometry = [];

        if(backwall.length >= 3) {
            geometry.push(createJointBackwall(backwall));
        }

        return geometry
    }
}