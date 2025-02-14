import { 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeGeometries,
    createGeometryFromPoints
} from "./Geometry_3D_Joints_Utils.js";
import { sharedData } from "../../../Ahu3D/globals.js";

export default class Geometry_3D_Joints_Colinear {
    /**
     * createParallelJoint
     * 
     * This function generates the geometry for a parallel joint based on the provided joint data.
     * The direction of the pair (vertical or horizontal) determines how the geometry will be generated.
     * It uses various utility functions to create geometry based on the joint's proxy coordinates.
     * 
     * @param {Object} joint - The joint data, which includes the coordinates of the proxies.
     * @param {string} pairDirection - The direction of the pair ("vertical" or "horizontal").
     * @returns {THREE.BufferGeometry} - The merged geometry for the parallel joint.
     */
    createParallelJoint(joint, pairDirection) {
        const geometries = [];

        // If the pair direction is vertical, generate vertical geometry for the joint.
        if(pairDirection == "vertical") {
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy1.coordinates[1],
                    joint.down.proxy1.coordinates[1],
                    joint.down.proxy1.coordinates[5],
                    joint.up.proxy1.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy1.coordinates[0],
                    joint.down.proxy1.coordinates[0],
                    joint.down.proxy1.coordinates[4],
                    joint.up.proxy1.coordinates[4]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy1.coordinates[0],
                    joint.down.proxy1.coordinates[3],
                    joint.down.proxy1.coordinates[2],
                    joint.up.proxy1.coordinates[1]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy1.coordinates[4],
                    joint.down.proxy1.coordinates[4],
                    joint.down.proxy1.coordinates[5],
                    joint.up.proxy1.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxyOriginal1.coordinates[7],
                    joint.up.proxyOriginal2.coordinates[7],
                    joint.up.proxy2.coordinates[7],
                    joint.up.proxy1.coordinates[7]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.down.proxyOriginal1.coordinates[5],
                    joint.down.proxyOriginal2.coordinates[5],
                    joint.down.proxy2.coordinates[5],
                    joint.down.proxy1.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.down.proxyOriginal1.coordinates[4],
                    joint.down.proxyOriginal2.coordinates[4],
                    joint.down.proxyOriginal2.coordinates[5],
                    joint.down.proxyOriginal1.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy1.coordinates[4],
                    joint.down.proxy2.coordinates[4],
                    joint.down.proxy2.coordinates[5],
                    joint.up.proxy1.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy2.coordinates[1],
                    joint.down.proxy2.coordinates[1],
                    joint.down.proxy2.coordinates[5],
                    joint.up.proxy2.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy2.coordinates[0],
                    joint.down.proxy2.coordinates[0],
                    joint.down.proxy2.coordinates[4],
                    joint.up.proxy2.coordinates[4]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy2.coordinates[0],
                    joint.down.proxy2.coordinates[3],
                    joint.down.proxy2.coordinates[2],
                    joint.up.proxy2.coordinates[1]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.up.proxy2.coordinates[4],
                    joint.down.proxy2.coordinates[4],
                    joint.down.proxy2.coordinates[5],
                    joint.up.proxy2.coordinates[5]
                )
            );
        }
        
        // If the pair direction is horizontal, generate horizontal geometry for the joint.
        if(pairDirection == "horizontal") {
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy1.coordinates[2],
                    joint.right.proxy1.coordinates[2],
                    joint.right.proxy1.coordinates[6],
                    joint.left.proxy1.coordinates[6]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy1.coordinates[1],
                    joint.right.proxy1.coordinates[1],
                    joint.right.proxy1.coordinates[5],
                    joint.left.proxy1.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy1.coordinates[1],
                    joint.right.proxy1.coordinates[0],
                    joint.right.proxy1.coordinates[3],
                    joint.left.proxy1.coordinates[2]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy1.coordinates[5],
                    joint.right.proxy1.coordinates[5],
                    joint.right.proxy1.coordinates[6],
                    joint.left.proxy1.coordinates[6]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.right.proxyOriginal1.coordinates[5],
                    joint.right.proxyOriginal2.coordinates[5],
                    joint.right.proxy2.coordinates[5],
                    joint.right.proxy1.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.right.proxyOriginal1.coordinates[6],
                    joint.right.proxyOriginal2.coordinates[6],
                    joint.right.proxy2.coordinates[6],
                    joint.right.proxy1.coordinates[6]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.right.proxyOriginal1.coordinates[5],
                    joint.right.proxyOriginal2.coordinates[5],
                    joint.right.proxyOriginal2.coordinates[6],
                    joint.right.proxyOriginal1.coordinates[6]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy1.coordinates[5],
                    joint.right.proxy2.coordinates[5],
                    joint.right.proxy2.coordinates[6],
                    joint.left.proxy1.coordinates[6]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy2.coordinates[2],
                    joint.right.proxy2.coordinates[2],
                    joint.right.proxy2.coordinates[6],
                    joint.left.proxy2.coordinates[6]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy2.coordinates[1],
                    joint.right.proxy2.coordinates[1],
                    joint.right.proxy2.coordinates[5],
                    joint.left.proxy2.coordinates[5]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy2.coordinates[1],
                    joint.right.proxy2.coordinates[0],
                    joint.right.proxy2.coordinates[3],
                    joint.left.proxy2.coordinates[2]
                )
            );
            geometries.push(
                createGeometryFromPoints(
                    joint.left.proxy2.coordinates[5],
                    joint.right.proxy2.coordinates[5],
                    joint.right.proxy2.coordinates[6],
                    joint.left.proxy2.coordinates[6]
                )
            );
        }

        // Merge all the geometries created and return the final geometry for the parallel joint.
        const newMergedGeometry = mergeGeometries(geometries);
        return newMergedGeometry;
    }
}
