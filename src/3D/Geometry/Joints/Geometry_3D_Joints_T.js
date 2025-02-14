import { 
    createJointBackwall, 
    connectProxiesDiagonallyUphill, 
    connectProxiesDiagonallyDownhill,
    createJointClosure,
    mergeGeometries
} from "./Geometry_3D_Joints_Utils.js";
import { sharedData } from "../../../Ahu3D/globals.js";

export default class Geometry_3D_Joints_T {
    
    /**
     * createTJoint
     * 
     * This function creates a T-joint, which is a 3D geometric joint between 
     * four segments (up, down, left, right). It considers the direction and 
     * connectivity between the joints to create geometries based on the available 
     * proxy coordinates.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {THREE.BufferGeometry} The merged geometry for the T-joint.
     */
    createTJoint(joint) {
        console.log("createTJoint started:", joint);
        const geometries = [];

        // Reset any existing backwall arc configurations
        sharedData.backwallArcConfigs = [];

        // Check if the joint direction is "outwards" or "inwards"
        if(sharedData.jointDirection == "outwards") {
            // Handle the case when right duct is missing
            if(joint.right == null) {
                geometries.push(...this.handleMissingRightJoint(joint));
            }
            // Handle the case when left duct is missing
            else if(joint.left == null) {
                geometries.push(...this.handleMissingLeftJoint(joint));
            }
            // Handle the case when down duct is missing
            else if(joint.down == null) {
                geometries.push(...this.handleMissingDownJoint(joint));
            }
            // Handle the case when up duct is missing
            else if(joint.up == null) {
                geometries.push(...this.handleMissingUpJoint(joint));
            }
        }
        else if(sharedData.jointDirection == "inwards") {
            // Handle "inwards" direction with similar checks for missing ducts
            if(joint.right == null) {
                geometries.push(...this.handleInwardsMissingRight(joint));
            }
            else if(joint.left == null) {
                geometries.push(...this.handleInwardsMissingLeft(joint));
            }
            else if(joint.down == null) {
                geometries.push(...this.handleInwardsMissingDown(joint));
            }
            else if(joint.up == null) {
                geometries.push(...this.handleInwardsMissingUp(joint));
            }
        }

        // Add the backwall geometry and joint closures to the geometries
        geometries.push(...this.createTJointBackwall(joint));
        geometries.push(...createJointClosure(joint.up, "horizontal"));
        geometries.push(...createJointClosure(joint.right, "vertical"));
        geometries.push(...createJointClosure(joint.down, "horizontal"));
        geometries.push(...createJointClosure(joint.left, "vertical"));

        console.log("createTJoint geometries:", geometries);

        // Merge all geometries into one and return the result
        const newMergedGeometry = mergeGeometries(geometries);
        return newMergedGeometry;
    }

    /**
     * handleMissingRightJoint
     * 
     * Handles the creation of geometries when the right duct is missing in the T-joint.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} Array of geometries to be created for the T-joint when right duct is missing.
     */
    handleMissingRightJoint(joint) {
        const geometries = [];
        geometries.push(...connectProxiesDiagonallyUphill(joint.down.proxy2.coordinates, joint.down.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.up.proxy2.coordinates, joint.down.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.left.proxy2.coordinates, joint.left.proxyMedian.coordinates));  
        geometries.push(...connectProxiesDiagonallyUphill(joint.left.proxy1.coordinates, joint.up.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.up.proxyMedian.coordinates, joint.up.proxy1.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.down.proxy1.coordinates, joint.left.proxyMedian.coordinates));
        return geometries;
    }

    /**
     * handleMissingLeftJoint
     * 
     * Handles the creation of geometries when the left duct is missing in the T-joint.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} Array of geometries to be created for the T-joint when left duct is missing.
     */
    handleMissingLeftJoint(joint) {
        const geometries = [];
        geometries.push(...connectProxiesDiagonallyUphill(joint.up.proxyMedian.coordinates, joint.up.proxy1.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.down.proxy1.coordinates, joint.up.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.up.proxy2.coordinates, joint.right.proxyMedian.coordinates));  
        geometries.push(...connectProxiesDiagonallyDownhill(joint.right.proxyMedian.coordinates, joint.right.proxy1.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.down.proxy2.coordinates, joint.down.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.right.proxy2.coordinates, joint.down.proxyMedian.coordinates));
        return geometries;
    }

    /**
     * handleMissingDownJoint
     * 
     * Handles the creation of geometries when the down duct is missing in the T-joint.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} Array of geometries to be created for the T-joint when down duct is missing.
     */
    handleMissingDownJoint(joint) {
        const geometries = [];
        if(joint.left.ductDimensions.y < joint.right.ductDimensions.y) {
            geometries.push(...connectProxiesDiagonallyDownhill(joint.left.proxy2.coordinates, joint.left.proxyMedian.coordinates));
        } else {
            geometries.push(...connectProxiesDiagonallyUphill(joint.left.proxy2.coordinates, joint.left.proxyMedian.coordinates));
        }

        geometries.push(...connectProxiesDiagonallyUphill(joint.left.proxyMedian.coordinates, joint.right.proxy2.coordinates, true, Math.PI / 2));
        geometries.push(...connectProxiesDiagonallyUphill(joint.up.proxy1.coordinates, joint.up.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.left.proxy1.coordinates, joint.up.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.right.proxy1.coordinates, joint.right.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.right.proxyMedian.coordinates, joint.up.proxy2.coordinates));
        return geometries;
    }

    /**
     * handleMissingUpJoint
     * 
     * Handles the creation of geometries when the up duct is missing in the T-joint.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} Array of geometries to be created for the T-joint when up duct is missing.
     */
    handleMissingUpJoint(joint) {
        const geometries = [];
        geometries.push(...connectProxiesDiagonallyUphill(joint.right.proxyMedian.coordinates, joint.left.proxy1.coordinates, true, Math.PI / -2));
        geometries.push(...connectProxiesDiagonallyUphill(joint.right.proxy1.coordinates, joint.right.proxyMedian.coordinates));               

        geometries.push(...connectProxiesDiagonallyDownhill(joint.left.proxyMedian.coordinates, joint.down.proxy1.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.down.proxy2.coordinates, joint.down.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.down.proxyMedian.coordinates, joint.right.proxy2.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.left.proxy2.coordinates, joint.left.proxyMedian.coordinates));
        return geometries;
    }

    /**
     * handleInwardsMissingRight
     * 
     * Handles the creation of geometries for an "inwards" direction when the right duct is missing.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} Array of geometries to be created for the T-joint when right duct is missing.
     */
    handleInwardsMissingRight(joint) {
        const geometries = [];
        geometries.push(...connectProxiesDiagonallyUphill(joint.down.proxy2.coordinates, joint.down.proxyMedian.coordinates, true));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.up.proxy2.coordinates, joint.down.proxyMedian.coordinates, true));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.down.proxy1.coordinates, joint.left.proxyMedian.coordinates));  
        geometries.push(...connectProxiesDiagonallyDownhill(joint.left.proxy2.coordinates, joint.left.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.up.proxyMedian.coordinates, joint.left.proxy1.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.up.proxyMedian.coordinates, joint.up.proxy1.coordinates));
        return geometries;
    }

    /**
     * handleInwardsMissingLeft
     * 
     * Handles the creation of geometries for an "inwards" direction when the left duct is missing.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} Array of geometries to be created for the T-joint when left duct is missing.
     */
    handleInwardsMissingLeft(joint) {
        const geometries = [];
        geometries.push(...connectProxiesDiagonallyUphill(joint.up.proxyMedian.coordinates, joint.up.proxy1.coordinates, true));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.down.proxy1.coordinates, joint.up.proxyMedian.coordinates, true));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.up.proxy2.coordinates, joint.right.proxyMedian.coordinates));   
        geometries.push(...connectProxiesDiagonallyDownhill(joint.right.proxyMedian.coordinates, joint.right.proxy1.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.down.proxy2.coordinates, joint.down.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.right.proxy2.coordinates, joint.down.proxyMedian.coordinates));
        return geometries;
    }

    /**
     * handleInwardsMissingDown
     * 
     * Handles the creation of geometries for an "inwards" direction when the down duct is missing.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} Array of geometries to be created for the T-joint when down duct is missing.
     */
    handleInwardsMissingDown(joint) {
        const geometries = [];
        geometries.push(...connectProxiesDiagonallyUphill(joint.left.proxy2.coordinates, joint.left.proxyMedian.coordinates, true));
        geometries.push(...connectProxiesDiagonallyUphill(joint.left.proxyMedian.coordinates, joint.right.proxy2.coordinates, true));
        geometries.push(...connectProxiesDiagonallyUphill(joint.up.proxy1.coordinates, joint.up.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.left.proxy1.coordinates, joint.up.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.right.proxy1.coordinates, joint.right.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.right.proxyMedian.coordinates, joint.up.proxy2.coordinates));
        return geometries;
    }

    /**
     * handleInwardsMissingUp
     * 
     * Handles the creation of geometries for an "inwards" direction when the up duct is missing.
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} Array of geometries to be created for the T-joint when up duct is missing.
     */
    handleInwardsMissingUp(joint) {
        const geometries = [];
        geometries.push(...connectProxiesDiagonallyUphill(joint.right.proxyMedian.coordinates, joint.left.proxy1.coordinates, true, Math.PI / -2));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.right.proxyMedian.coordinates, joint.right.proxy1.coordinates, true));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.left.proxyMedian.coordinates, joint.down.proxy1.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.down.proxy2.coordinates, joint.down.proxyMedian.coordinates));
        geometries.push(...connectProxiesDiagonallyUphill(joint.down.proxyMedian.coordinates, joint.right.proxy2.coordinates));
        geometries.push(...connectProxiesDiagonallyDownhill(joint.left.proxy2.coordinates, joint.left.proxyMedian.coordinates));
        return geometries;
    }

    /**
     * createTJointBackwall
     * 
     * This function generates the backwall geometry for the T-joint based on the provided 
     * proxy coordinates and the joint direction (inwards or outwards).
     * 
     * @param {Object} joint - The joint data containing coordinates and duct information.
     * @returns {Array} The backwall geometry for the T-joint.
     */
    createTJointBackwall(joint) {
        console.log("createTJointBackwall joint:", joint);
        let backwall = [];
        let topLeftMidpoint = {};
        let topRightMidpoint = {};
        let bottomRightMidpoint = {};
        let bottomLeftMidpoint = {};

        // Determine backwall creation based on missing ducts and direction
        if(joint.right == null) {
            topLeftMidpoint = {
                x: joint.up.proxy1.coordinates[4].x,
                y: joint.up.proxy1.coordinates[4].y,
                z: joint.left.proxy1.coordinates[4].z
            };
            bottomLeftMidpoint = {
                x: joint.down.proxy1.coordinates[4].x,
                y: joint.down.proxy1.coordinates[4].y,
                z: joint.left.proxy2.coordinates[4].z
            };

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

            // Special cases for "inwards" direction and "arc" style
            if(sharedData.jointDirection == "inwards" && sharedData.jointStyle == "arc") {
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
            };
            bottomRightMidpoint = {
                x: joint.down.proxy2.coordinates[4].x,
                y: joint.down.proxy2.coordinates[4].y,
                z: joint.right.proxy2.coordinates[4].z
            };
            topLeftMidpoint = {
                x: joint.up.proxy1.coordinates[4].x,
                y: joint.up.proxy1.coordinates[4].y,
                z: joint.up.proxyMedian.coordinates[4].z
            };

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

            if(sharedData.jointDirection == "inwards" && sharedData.jointStyle == "arc") {
                backwall.splice(3, 0, topRightMidpoint);
                backwall.splice(5, 0, topRightMidpoint);
                backwall.splice(8, 0, bottomRightMidpoint);
                backwall.splice(10, 0, bottomRightMidpoint);
            }
        }

        // Handle cases when down or up ducts are missing
        else if(joint.down == null) {
            topLeftMidpoint = {
                x: joint.up.proxy1.coordinates[4].x,
                y: joint.up.proxy1.coordinates[4].y,
                z: joint.left.proxy1.coordinates[4].z
            };
            topRightMidpoint = {
                x: joint.up.proxy2.coordinates[4].x,
                y: joint.up.proxy2.coordinates[4].y,
                z: joint.right.proxy1.coordinates[4].z
            };

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

            if(sharedData.jointDirection == "inwards" && sharedData.jointStyle == "arc") {
                backwall.splice(4, 0, topRightMidpoint);
                backwall.splice(0, 0, topLeftMidpoint);
            }
        }
        else if(joint.up == null) {
            bottomLeftMidpoint = {
                x: joint.down.proxy1.coordinates[4].x,
                y: joint.down.proxy1.coordinates[4].y,
                z: joint.left.proxy2.coordinates[4].z
            };
            bottomRightMidpoint = {
                x: joint.down.proxy2.coordinates[4].x,
                y: joint.down.proxy2.coordinates[4].y,
                z: joint.right.proxy2.coordinates[4].z
            };

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

            if(sharedData.jointDirection == "inwards" && sharedData.jointStyle == "arc") {
                backwall.splice(4, 0, bottomLeftMidpoint);
                backwall.splice(0, 0, bottomRightMidpoint);
            }
        }

        let geometry = [];

        // Create backwall geometry if there are enough points
        if(backwall.length >= 3) {
            geometry.push(createJointBackwall(backwall));
        }

        return geometry;
    }
}
