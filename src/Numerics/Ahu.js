/**
 * @file Ahu.js
 * @description This module defines the Ahu class, which is responsible for managing and rendering 2D and 3D representations of Air Handling Units (AHUs).
 * It includes methods for translating and calculating the dimensions of AHU assemblies.
 */

export default class Ahu {

    /**
     * Calculate a bounding box for a collection of edges
     * @param {Object} edges - Object containing edge data with position, rotation, and dimensions
     * @returns {Object} Bounding box with min and max points
     */
    calculateBoundingBox(edges) {
        // Initialize min and max values to the first vertex we process
        let minX = Infinity;
        let minY = Infinity;
        let minZ = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let maxZ = -Infinity;
        
        // Process each edge
        for (const edgeId in edges) {
            const edge = edges[edgeId];
            const { position, rotation, dimensions } = edge;
        
            // Calculate the 8 corners of this edge's bounding box
            const corners = this.calculateRotatedCorners(position, rotation, dimensions);
        
            // Update min and max values based on the corners
            for (const corner of corners) {
            minX = Math.min(minX, corner.x);
            minY = Math.min(minY, corner.y);
            minZ = Math.min(minZ, corner.z);
            maxX = Math.max(maxX, corner.x);
            maxY = Math.max(maxY, corner.y);
            maxZ = Math.max(maxZ, corner.z);
            }
        }
        
        return {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ },
            center: {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            z: (minZ + maxZ) / 2
            },
            dimensions: {
            x: maxX - minX,
            y: maxY - minY,
            z: maxZ - minZ
            }
        };
    }
        
    /**
     * Calculate the 8 corners of a rotated box
     * @param {Object} position - Position of the box center {x, y, z}
     * @param {Object} rotation - Rotation in degrees {x, y, z}
     * @param {Object} dimensions - Dimensions of the box {x, y, z}
     * @returns {Array} Array of 8 corner points
     */
    calculateRotatedCorners(position, rotation, dimensions) {
        // Calculate half-dimensions
        const halfWidth = dimensions.x / 2;
        const halfHeight = dimensions.y / 2;
        const halfDepth = dimensions.z / 2;
        
        // Define the 8 corners of the box (before rotation)
        const corners = [
            { x: -halfWidth, y: -halfHeight, z: -halfDepth },
            { x: halfWidth, y: -halfHeight, z: -halfDepth },
            { x: halfWidth, y: halfHeight, z: -halfDepth },
            { x: -halfWidth, y: halfHeight, z: -halfDepth },
            { x: -halfWidth, y: -halfHeight, z: halfDepth },
            { x: halfWidth, y: -halfHeight, z: halfDepth },
            { x: halfWidth, y: halfHeight, z: halfDepth },
            { x: -halfWidth, y: halfHeight, z: halfDepth }
        ];
        
        // Convert rotation from degrees to radians
        const rotX = rotation.x * Math.PI / 180;
        const rotY = rotation.y * Math.PI / 180;
        const rotZ = rotation.z * Math.PI / 180;
        
        // Apply rotation and translation to each corner
        return corners.map(corner => {
            // Apply rotation around X axis
            const y1 = corner.y * Math.cos(rotX) - corner.z * Math.sin(rotX);
            const z1 = corner.y * Math.sin(rotX) + corner.z * Math.cos(rotX);
        
            // Apply rotation around Y axis
            const x2 = corner.x * Math.cos(rotY) + z1 * Math.sin(rotY);
            const z2 = -corner.x * Math.sin(rotY) + z1 * Math.cos(rotY);
        
            // Apply rotation around Z axis
            const x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
            const y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ);
        
            // Apply translation
            return {
            x: x3 + position.x,
            y: y3 + position.y,
            z: z2 + position.z
            };
        });
    }
}
