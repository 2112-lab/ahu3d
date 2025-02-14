import { sharedData } from "../../../Ahu3D/globals.js";
import { 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeGeometries
} from "./Geometry_3D_Joints_Utils.js";

export default class Geometry_3D_Joints_Cross {
    /**
     * createCrossJoint
     * 
     * This function generates the geometry for the "cross" joint based on the provided joint data.
     * The function considers the direction (inwards or outwards) and the joint style (arc or other) 
     * to create a set of connected geometries representing the cross joint.
     * 
     * @param {Object} joint - The joint data, which includes the coordinates of the proxies.
     * @param {number} largestGlobalSize - A parameter that determines the size of the cross joint geometry.
     * @returns {THREE.BufferGeometry} - The merged geometry for the cross joint.
     */
    createCrossJoint(joint, largestGlobalSize) {
        const geometries = [];

        this.backwallArcConfigs = []; // Initialize an empty array for storing arc configurations.

        // Check if the joint style is "arc"
        if(sharedData.jointStyle == "arc") {     

            // Define midpoints for the four directions of the cross joint.
            let upMidpoint = {
                x: joint.up.proxy1.coordinates[4].x,
                z: joint.up.proxyMedian.coordinates[4].z
            }
            let rightMidpoint = {
                x: joint.up.proxy2.coordinates[4].x,
                z: joint.right.proxyMedian.coordinates[4].z
            }
            let downMidpoint = {
                x: joint.down.proxyMedian.coordinates[4].x,
                z: joint.right.proxy2.coordinates[4].z
            }
            let leftMidpoint = {
                x: joint.down.proxy1.coordinates[4].x,
                z: joint.left.proxyMedian.coordinates[4].z
            }

            // Default backwall geometry for the cross joint in "arc" style.
            let backwall = [
                joint.up.proxyMedian.coordinates[4],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy2.coordinates[7],
                joint.right.proxyMedian.coordinates[7],
                joint.right.proxy1.coordinates[7],
                joint.right.proxy2.coordinates[6],
                joint.down.proxyMedian.coordinates[6],
                joint.down.proxy2.coordinates[6],
                joint.down.proxy1.coordinates[5],
                joint.left.proxyMedian.coordinates[5],
                joint.left.proxy2.coordinates[5],
                joint.left.proxy1.coordinates[4]
            ];

            // Modify midpoints and backwall if the joint direction is "inwards"
            if(sharedData.jointDirection == "inwards") {
                upMidpoint = {
                    x: joint.up.proxy1.coordinates[4].x,
                    y: joint.up.proxy1.coordinates[4].y,
                    z: joint.up.proxyMedian.coordinates[4].z
                }
                let upMidpoint2 = {
                    x: joint.up.proxy1.coordinates[4].x,
                    y: joint.up.proxy1.coordinates[4].y,
                    z: joint.left.proxy1.coordinates[4].z
                }

                rightMidpoint = {
                    x: joint.up.proxy2.coordinates[4].x,
                    y: joint.up.proxy2.coordinates[4].y,
                    z: joint.right.proxyMedian.coordinates[4].z
                }
                let rightMidpoint2 = {
                    x: joint.up.proxy2.coordinates[4].x,
                    y: joint.up.proxy2.coordinates[4].y,
                    z: joint.right.proxy1.coordinates[4].z
                }

                leftMidpoint = {
                    x: joint.down.proxy1.coordinates[4].x,
                    y: joint.down.proxy1.coordinates[4].y,
                    z: joint.left.proxyMedian.coordinates[4].z
                }
                let leftMidpoint2 = {
                    x: joint.down.proxy1.coordinates[4].x,
                    y: joint.down.proxy1.coordinates[4].y,
                    z: joint.left.proxy2.coordinates[4].z
                }

                downMidpoint = {
                    x: joint.down.proxyMedian.coordinates[4].x,
                    y: joint.down.proxyMedian.coordinates[4].y,
                    z: joint.right.proxy2.coordinates[4].z
                }
                let downMidpoint2 = {
                    x: joint.down.proxy2.coordinates[4].x,
                    y: joint.down.proxy2.coordinates[4].y,
                    z: joint.right.proxy2.coordinates[4].z
                }

                // Modified backwall for the "inwards" direction.
                backwall = [
                    upMidpoint2,
                    joint.up.proxyMedian.coordinates[4],
                    upMidpoint,
                    joint.up.proxy1.coordinates[4],
                    joint.up.proxy2.coordinates[7],
                    rightMidpoint,
                    joint.right.proxyMedian.coordinates[7],
                    rightMidpoint2,
                    joint.right.proxy1.coordinates[7],
                    joint.right.proxy2.coordinates[6],
                    downMidpoint,
                    joint.down.proxyMedian.coordinates[6],
                    downMidpoint2,
                    joint.down.proxy2.coordinates[6],
                    joint.down.proxy1.coordinates[5],
                    leftMidpoint,
                    joint.left.proxyMedian.coordinates[5],
                    leftMidpoint2,
                    joint.left.proxy2.coordinates[5],
                    joint.left.proxy1.coordinates[4]
                ];
            }

            // Create the backwall geometry for the cross joint and add it to the geometries array.
            geometries.push(createJointBackwall(backwall));
        }
        // If the joint style is not "arc", use a default backwall
        else {
            let backwall = [
                joint.up.proxyMedian.coordinates[4],
                joint.up.proxy1.coordinates[4],
                joint.up.proxy2.coordinates[7],
                joint.right.proxyMedian.coordinates[7],
                joint.right.proxy1.coordinates[7],
                joint.right.proxy2.coordinates[6],
                joint.down.proxyMedian.coordinates[6],
                joint.down.proxy2.coordinates[6],
                joint.down.proxy1.coordinates[5],
                joint.left.proxyMedian.coordinates[5],
                joint.left.proxy2.coordinates[5],
                joint.left.proxy1.coordinates[4]
            ];

            geometries.push(createJointBackwall(backwall));
        }  

        // Connect the proxies using diagonally-uphill and diagonally-downhill connections to form the cross joint.
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

        // Add joint closures for each side of the joint (horizontal for up/down, vertical for left/right).
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

        // Merge all the geometries created and return the final geometry for the cross joint.
        const newMergedGeometry = mergeGeometries(geometries);
        return newMergedGeometry;
    }
}
