import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharedData } from "../../../Ahu3D/globals.js";

/**
 * calculateJointCenter
 *
 * This function calculates the center point of a joint based on the associated ducts
 * and their positions. It takes into account whether the ducts are vertical or horizontal.
 * 
 * @param {string} jointKey - The key identifying the joint.
 * @param {Object} ahuObject - The AHU object containing the joint and duct information.
 */
export function calculateJointCenter(joint, jointKey) {
    console.log("calculateJointCenter started");
    let jointCenter = {
        x: 0,
        z: 0,
    };
    // Iterate through all ducts associated with the joint
    for (const ductKey of sharedData.ahuObject.associations.joints[jointKey].ducts) {
        const duct = sharedData.ahuObject.resources.ducts[ductKey];
        // Check if the duct is vertical
        if (sharedData.ahuObject.xetoDictionary.edges[ductKey].isVertical) {
            jointCenter.x = duct.position.x;
        } else {
            jointCenter.z = duct.position.z;
        }
    }

    const offset = 100;

    const jointKeys = Object.keys(joint);

    if(jointKeys.length == 2) {
      if(joint.up && joint.left) {
        jointCenter.x += -offset;
        jointCenter.z += offset;
      }
      else if(joint.up && joint.right) {
        jointCenter.x += offset;
        jointCenter.z += offset;
      }
      else if(joint.down && joint.right) {
        jointCenter.x += offset;
        jointCenter.z += -offset;
      }
      else if(joint.down && joint.left) {
        jointCenter.x += -offset;
        jointCenter.z += -offset;
      }
    }

    sharedData.jointCenter = jointCenter;
    
    // ===== JOINT CENTER HELPER VISUALIZATION =====
    // Comment out this block when not needed
    {
        // Create a cube geometry - small size for precision
        const geometry = new THREE.BoxGeometry(50, 50, 50);
        
        // Red material with some transparency
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        // Create and position the cube
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(jointCenter.x, 0, jointCenter.z);
        
        // Add to scene
        sharedData.sceneHelper.addToScene(cube);
    }
    // ===== END HELPER VISUALIZATION =====
}

/**
 * createJointBackwall
 * 
 * Creates the 3D geometry for a joint backwall from the given points. The shape is extruded
 * along the y-axis to create a solid backwall.
 * 
 * @param {Array} points - An array of points that define the backwall shape.
 * @returns {THREE.BufferGeometry} The generated backwall geometry.
 */
export function createJointBackwall(points) {
    console.log("createJointBackwall started:", points);
    if (points.length < 3) {
        throw new Error("A shape requires at least 3 points.");
    }

    const wallThickness = sharedData.moduleConfigs.parametricOptions.wallThickness;

    // Flatten the points into 2D (XZ plane)
    const shapePoints = points.map(point => new THREE.Vector2(point.x, point.z));

    // Create a 2D shape from the points
    const shape = new THREE.Shape(shapePoints);

    // Set extrude settings for the backwall geometry
    const extrudeSettings = {
        depth: wallThickness, 
        bevelEnabled: false 
    };

    // Create extrude geometry from the shape
    const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Convert to BufferGeometry and apply indexing
    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', extrudeGeometry.getAttribute('position'));
    bufferGeometry.setAttribute('normal', extrudeGeometry.getAttribute('normal'));
    bufferGeometry.setIndex(
        extrudeGeometry.index || 
        new THREE.BufferAttribute(
            new Uint16Array([...Array(bufferGeometry.attributes.position.count).keys()]), 1
        )
    );

    // Apply rotation to the geometry (rotate along X-axis)
    const transformMatrix = new THREE.Matrix4();
    transformMatrix.makeRotationX(Math.PI / 2);
    bufferGeometry.applyMatrix4(transformMatrix);

    // Translate the geometry based on the first point's Y-coordinate
    bufferGeometry.translate(0, points[0].y, 0);

    console.log("createJointBackwall bufferGeometry analysis:", bufferGeometry);

    return bufferGeometry;
}

/**
 * connectProxiesDiagonallyUphill
 * 
 * Connects two proxies diagonally uphill (for example, from bottom to top) using geometry.
 * If the joint style is "arc", it calculates the arc instead.
 * 
 * @param {Array} leftProxy - The coordinates of the left proxy.
 * @param {Array} rightProxy - The coordinates of the right proxy.
 * @param {boolean} flipArc - If true, flips the direction of the arc.
 * @param {number} overrideRotation - An optional rotation value to override the default rotation.
 * @returns {Array} The list of geometries created between the two proxies.
 */
export function connectProxiesDiagonallyUphill(leftProxy, rightProxy, flipArc = false, overrideRotation) {
    const geometries = [];

    if (sharedData.jointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {

        if(leftProxy[0].x > rightProxy[0].x) {
            let temp = leftProxy;
            leftProxy = rightProxy;
            rightProxy = temp;
        }

        // calculateArc(leftProxy, rightProxy, flipArc, overrideRotation);

        const offset = 275;
        let xzOffset = {x: 0, z: 0};

        if(flipArc == false) {
            xzOffset = {x: offset, z: offset};
        }

        const result = calculateArcWithCrescent(leftProxy, rightProxy, false, overrideRotation, xzOffset);
        console.log("calculateArc result:", result);

        return geometries;
    }

    geometries.push(createGeometryFromPoints(leftProxy[0], rightProxy[0], rightProxy[2], leftProxy[2]));
    geometries.push(createGeometryFromPoints(leftProxy[0], leftProxy[4], rightProxy[4], rightProxy[0]));
    geometries.push(createGeometryFromPoints(leftProxy[2], leftProxy[6], rightProxy[6], rightProxy[2]));

    return geometries;
}

/**
 * connectProxiesDiagonallyDownhill
 * 
 * Connects two proxies diagonally downhill (for example, from left to right) using geometry.
 * If the joint style is "arc", it calculates the arc instead.
 * 
 * @param {Array} leftProxy - The coordinates of the left proxy.
 * @param {Array} rightProxy - The coordinates of the right proxy.
 * @param {boolean} flipArc - If true, flips the direction of the arc.
 * @param {number} overrideRotation - An optional rotation value to override the default rotation.
 * @returns {Array} The list of geometries created between the two proxies.
 */
export function connectProxiesDiagonallyDownhill(leftProxy, rightProxy, flipArc = false, overrideRotation) {
    const geometries = [];

    if (sharedData.jointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {

        if(leftProxy[0].x > rightProxy[0].x) {
            let temp = leftProxy;
            leftProxy = rightProxy;
            rightProxy = temp;
        }

        // calculateArc(leftProxy, rightProxy, flipArc, overrideRotation);

        const offset = 275;
        let xzOffset = {x: 0, z: 0};

        if(flipArc == false) {
            xzOffset = {x: offset, z: offset};
        }

        const result = calculateArcWithCrescent(leftProxy, rightProxy, false, overrideRotation, xzOffset);
        // result.crescentPanel.scale.set(1.5, 1, 1.5);
        console.log("calculateArc result:", result);

        return geometries;
    }

    // Create geometries connecting the left and right proxies diagonally
    geometries.push(createGeometryFromPoints(leftProxy[1], rightProxy[1], rightProxy[3], leftProxy[3]));
    geometries.push(createGeometryFromPoints(leftProxy[5], rightProxy[5], rightProxy[7], leftProxy[7]));
    geometries.push(createGeometryFromPoints(leftProxy[1], leftProxy[5], rightProxy[5], rightProxy[1]));
    geometries.push(createGeometryFromPoints(leftProxy[3], leftProxy[7], rightProxy[7], rightProxy[3]));

    return geometries;
}

/**
 * createArcBufferGeometry
 * 
 * Creates a custom buffer geometry arc between two points with a 90-degree angle.
 * 
 * @param {THREE.Vector3} point1 - The first point of the arc.
 * @param {THREE.Vector3} point2 - The second point of the arc.
 * @param {number} thickness - The thickness of the arc tube.
 * @param {number} height - The height of the arc.
 * @param {boolean} flipArc - If true, flips the arc's direction.
 * @param {number} segments - The number of segments used to create the arc.
 * @returns {THREE.BufferGeometry} The generated arc buffer geometry.
 */
export function createArcBufferGeometry(point1, point2, thickness = 15, height = 30, flipArc = false, segments = 36) {
    // Calculate the center of the arc based on the two points
    const center = calculateArcCenter(point1, point2, flipArc);
    
    // Calculate arc radius based on the distance between points (for a 90-degree arc)
    const radius = Math.sqrt(
        Math.pow(point1.x - center.x, 2) + 
        Math.pow(point1.z - center.z, 2)
    );
    
    // Calculate the start and end angles of the arc
    const startAngle = Math.atan2(point1.z - center.z, point1.x - center.x);
    const endAngle = Math.atan2(point2.z - center.z, point2.x - center.x);
    
    // Ensure we're drawing the shorter 90-degree arc
    let angleLength = endAngle - startAngle;
    if (Math.abs(angleLength) > Math.PI) {
        angleLength = angleLength - Math.sign(angleLength) * Math.PI * 2;
    }
    
    // If the angle is not approximately 90 degrees (π/2), adjust it
    if (Math.abs(Math.abs(angleLength) - Math.PI/2) > 0.01) {
        console.warn("Points don't form a 90-degree arc. Adjusting to 90 degrees.");
        angleLength = Math.sign(angleLength) * Math.PI/2;
    }
    
    return createArcGeometry(center, radius, radius + thickness, height, startAngle, angleLength, segments);
}

/**
 * calculateArcCenter
 * 
 * Calculates the center of a 90-degree arc between two points.
 * 
 * @param {THREE.Vector3} point1 - The first point of the arc.
 * @param {THREE.Vector3} point2 - The second point of the arc.
 * @param {boolean} flipArc - If true, flips the arc's direction.
 * @returns {THREE.Vector3} The center point of the arc.
 */
function calculateArcCenter(point1, point2, flipArc = false) {
    // For a 90-degree arc, the center forms a right angle with the two points
    const dx = point2.x - point1.x;
    const dz = point2.z - point1.z;
    
    // Default center location (one of four possible positions for a 90-degree arc)
    let centerX = point1.x;
    let centerZ = point2.z;
    
    // If we need to flip the arc, we can use the opposite corner
    if (flipArc) {
        centerX = point2.x;
        centerZ = point1.z;
    }
    
    return new THREE.Vector3(centerX, 0, centerZ);
}

/**
 * createArcGeometry
 * 
 * Creates a custom buffer geometry for an arc with inner and outer radii.
 * 
 * @param {THREE.Vector3} center - The center point of the arc.
 * @param {number} innerRadius - The inner radius of the arc.
 * @param {number} outerRadius - The outer radius of the arc.
 * @param {number} height - The height of the arc.
 * @param {number} startAngle - The starting angle of the arc in radians.
 * @param {number} angleLength - The angular length of the arc in radians.
 * @param {number} segments - The number of segments used to create the arc.
 * @returns {THREE.BufferGeometry} The generated arc buffer geometry.
 */
function createArcGeometry(center, innerRadius, outerRadius, height, startAngle, angleLength, segments) {
    const geometry = new THREE.BufferGeometry();
    
    // Calculate vertices, normals, and uvs
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    // Number of points along the arc
    const arcPoints = segments + 1; 
    
    // Create vertices
    for (let i = 0; i < arcPoints; i++) {
        // Calculate angle for this segment
        const angle = startAngle + (angleLength * i / segments);
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        // Inner radius, bottom
        vertices.push(
            center.x + innerRadius * cosAngle,
            center.y,
            center.z + innerRadius * sinAngle
        );
        
        // Outer radius, bottom
        vertices.push(
            center.x + outerRadius * cosAngle,
            center.y,
            center.z + outerRadius * sinAngle
        );
        
        // Inner radius, top
        vertices.push(
            center.x + innerRadius * cosAngle,
            center.y + height,
            center.z + innerRadius * sinAngle
        );
        
        // Outer radius, top
        vertices.push(
            center.x + outerRadius * cosAngle,
            center.y + height,
            center.z + outerRadius * sinAngle
        );
        
        // UV coordinates
        const u = i / segments;
        uvs.push(
            u, 0,
            u, 0.25,
            u, 0.75,
            u, 1
        );
        
        // Normal vectors (more accurate - based on surface orientation)
        // For inner side
        const innerNormalX = -cosAngle;
        const innerNormalZ = -sinAngle;
        // For outer side
        const outerNormalX = cosAngle;
        const outerNormalZ = sinAngle;
        
        normals.push(
            innerNormalX, 0, innerNormalZ,  // Inner bottom
            outerNormalX, 0, outerNormalZ,  // Outer bottom
            innerNormalX, 0, innerNormalZ,  // Inner top
            outerNormalX, 0, outerNormalZ   // Outer top
        );
        
        // Create faces (triangles) for the arc
        if (i < segments) {
            const baseIndex = i * 4;
            
            // Side faces
            indices.push(
                baseIndex, baseIndex + 1, baseIndex + 5,
                baseIndex, baseIndex + 5, baseIndex + 4
            );
            
            // Top faces
            indices.push(
                baseIndex + 2, baseIndex + 3, baseIndex + 7,
                baseIndex + 2, baseIndex + 7, baseIndex + 6
            );
            
            // Bottom faces
            indices.push(
                baseIndex, baseIndex + 4, baseIndex + 1,
                baseIndex + 1, baseIndex + 4, baseIndex + 5
            );
            
            // Inner radius face
            indices.push(
                baseIndex, baseIndex + 2, baseIndex + 6,
                baseIndex, baseIndex + 6, baseIndex + 4
            );
            
            // Outer radius face
            indices.push(
                baseIndex + 1, baseIndex + 5, baseIndex + 7,
                baseIndex + 1, baseIndex + 7, baseIndex + 3
            );
        }
    }
    
    // Create end cap faces (first and last segment) with correct winding order
    const lastBaseIndex = (arcPoints - 1) * 4;
    
    // First end cap - ensure proper winding direction for visibility
    indices.push(
        0, 2, 1,  // Bottom-left to top-left to bottom-right
        1, 2, 3   // Bottom-right to top-left to top-right
    );
    
    // Last end cap - ensure proper winding direction for visibility
    indices.push(
        lastBaseIndex, lastBaseIndex + 1, lastBaseIndex + 2,     // Bottom-left to bottom-right to top-left
        lastBaseIndex + 1, lastBaseIndex + 3, lastBaseIndex + 2  // Bottom-right to top-right to top-left
    );
    
    // Add back panel between start and end angle
    // We'll create a curved surface that connects the inner and outer arcs
    
    // Calculate normal for back panel (average of start and end normals, pointing outward)
    const startNormal = new THREE.Vector3(
        Math.cos(startAngle + Math.PI/2),
        0,
        Math.sin(startAngle + Math.PI/2)
    );
    
    const endNormal = new THREE.Vector3(
        Math.cos(startAngle + angleLength + Math.PI/2),
        0,
        Math.sin(startAngle + angleLength + Math.PI/2)
    );
    
    const backNormal = new THREE.Vector3()
        .addVectors(startNormal, endNormal)
        .normalize();
    
    // Calculate positions for back panel vertices
    const backPanelVertexCount = vertices.length / 3;
    const backPanelBaseIndex = backPanelVertexCount;
    
    // Connect start angle inner and outer points (bottom and top)
    // This creates a rectangular face between inner and outer radius at the start angle
    
    // Connect end angle inner and outer points (bottom and top)
    // This creates a rectangular face between inner and outer radius at the end angle
    
    // Add bottom arc back panel
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + angleLength * t;
        
        // Calculate position for this point on the arc
        const x = center.x + (innerRadius * (1 - t) + outerRadius * t) * Math.cos(angle);
        const z = center.z + (innerRadius * (1 - t) + outerRadius * t) * Math.sin(angle);
        
        // Bottom point
        vertices.push(x, center.y, z);
        
        // Top point
        vertices.push(x, center.y + height, z);
        
        // Add UV coordinates for back panel
        uvs.push(t, 0.4, t, 0.6);
        
        // Add normal vectors for back panel (pointing backward)
        normals.push(
            backNormal.x, backNormal.y, backNormal.z,
            backNormal.x, backNormal.y, backNormal.z
        );
        
        // Add faces for back panel (connecting adjacent points)
        if (i < segments) {
            const backPanelIndex = backPanelBaseIndex + i * 2;
            
            // Bottom face triangles
            indices.push(
                backPanelIndex, backPanelIndex + 2, backPanelIndex + 3,
                backPanelIndex, backPanelIndex + 3, backPanelIndex + 1
            );
        }
    }
    
    // Set the buffer attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    // Compute vertex normals for better lighting
    geometry.computeVertexNormals();
    
    return geometry;
}

/**
 * calculateProxyCenterArc
 * 
 * Creates an arc between the centers of two proxies using buffer geometry.
 * This function calculates the center of each proxy and creates an arc between them.
 * 
 * @param {Array} proxy1 - The first proxy (array of 8 points representing a cuboid).
 * @param {Array} proxy2 - The second proxy (array of 8 points representing a cuboid).
 * @param {number} thickness - The thickness of the arc tube.
 * @param {number} height - Optional height override for the arc. If not provided, uses the height from proxies.
 * @param {boolean} flipArc - If true, flips the arc's direction.
 * @param {number} segments - The number of segments used to create the arc.
 * @returns {THREE.BufferGeometry} The generated arc buffer geometry.
 */
function calculateProxyCenterArc(proxy1, proxy2, thickness = 15, height = null, flipArc = false, segments = 36) {
    if (!proxy1 || !proxy2 || proxy1.length !== 8 || proxy2.length !== 8) {
        console.error("Invalid proxies provided. Each proxy must have 8 points.");
        return null;
    }

    // Calculate center of proxy1
    const center1 = calculateProxyCenter(proxy1);
    
    // Calculate center of proxy2
    const center2 = calculateProxyCenter(proxy2);
    
    console.log("Proxy 1 center:", center1);
    console.log("Proxy 2 center:", center2);
    
    // Ensure the points are not the same
    if (center1.x === center2.x && center1.z === center2.z) {
        console.error("Proxy centers have the same X and Z coordinates. Cannot create a 90-degree arc.");
        return null;
    }
    
    // Determine arc height from proxies if not provided
    if (height === null) {
        // Use the height of the proxies (y-axis distance from bottom to top)
        height = proxy1[7].y - proxy1[0].y;
    }
    
    // Create points as THREE.Vector3 objects
    const point1 = new THREE.Vector3(center1.x, center1.y, center1.z);
    const point2 = new THREE.Vector3(center2.x, center2.y, center2.z);
    
    // Create the arc buffer geometry
    return createArcBufferGeometry(point1, point2, thickness, height, flipArc, segments);
}

/**
 * calculateProxyCenter
 * 
 * Calculates the center point of a proxy (cuboid defined by 8 vertices).
 * 
 * @param {Array} proxy - Array of 8 points representing a cuboid.
 * @returns {Object} An object with x, y, z coordinates of the center.
 */
function calculateProxyCenter(proxy) {
    // Validate input
    if (!proxy || proxy.length !== 8) {
        console.error("Invalid proxy. Must have 8 points.");
        return null;
    }
    
    // Sum all coordinates
    let sumX = 0, sumY = 0, sumZ = 0;
    
    for (let i = 0; i < 8; i++) {
        sumX += proxy[i].x;
        sumY += proxy[i].y;
        sumZ += proxy[i].z;
    }
    
    // Return the average (center)
    return {
        x: sumX / 8,
        y: sumY / 8,
        z: sumZ / 8
    };
}

/**
 * createCrescentPanelGeometry
 * 
 * Creates a crescent-shaped panel that fills the inner curved space of an arc.
 * 
 * @param {THREE.Vector3} center - The center point of the arc.
 * @param {number} innerRadius - The inner radius of the arc.
 * @param {number} height - The height of the crescent panel.
 * @param {number} startAngle - The starting angle of the arc in radians.
 * @param {number} angleLength - The angular length of the arc in radians.
 * @param {number} segments - The number of segments used to create the curved panel.
 * @param {Object} cornerOffset - Optional offset for the corner vertex position {x, z}.
 * @returns {THREE.BufferGeometry} The generated crescent panel buffer geometry.
 */
function createCrescentPanelGeometry(center, innerRadius, height, startAngle, angleLength, segments, cornerOffset = {x: 0, z: 0}) {
    const geometry = new THREE.BufferGeometry();
    
    // Calculate vertices, normals, and uvs
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    // Number of points along the arc
    const arcPoints = segments + 1; 
    
    // Create vertices
    for (let i = 0; i < arcPoints; i++) {
        // Calculate angle for this segment
        const angle = startAngle + (angleLength * i / segments);
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        // Inner radius point on the arc, bottom
        vertices.push(
            center.x + innerRadius * cosAngle,
            center.y,
            center.z + innerRadius * sinAngle
        );
        
        // Center point (with offset), bottom
        vertices.push(
            center.x + cornerOffset.x,
            center.y,
            center.z + cornerOffset.z
        );
        
        // Inner radius point on the arc, top
        vertices.push(
            center.x + innerRadius * cosAngle,
            center.y + height,
            center.z + innerRadius * sinAngle
        );
        
        // Center point (with offset), top
        vertices.push(
            center.x + cornerOffset.x,
            center.y + height,
            center.z + cornerOffset.z
        );
        
        // UV coordinates
        const u = i / segments;
        uvs.push(
            u, 0,
            0.5, 0,
            u, 1,
            0.5, 1
        );
        
        // We need to recalculate normals since the panel may no longer be flat
        // This will be handled by computeVertexNormals() at the end
        normals.push(
            0, 1, 0,  // Placeholder
            0, 1, 0,  // Placeholder
            0, 1, 0,  // Placeholder
            0, 1, 0   // Placeholder
        );
        
        // Create faces (triangles) for the panel
        if (i < segments) {
            const baseIndex = i * 4;
            
            // Top face
            indices.push(
                baseIndex + 2, baseIndex + 3, baseIndex + 7,
                baseIndex + 2, baseIndex + 7, baseIndex + 6
            );
            
            // Bottom face
            indices.push(
                baseIndex, baseIndex + 4, baseIndex + 1,
                baseIndex + 1, baseIndex + 4, baseIndex + 5
            );
        }
    }
    
    // Set the buffer attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    // Compute vertex normals for better lighting
    geometry.computeVertexNormals();
    
    return geometry;
}

/**
 * createCrescentPanel
 * 
 * Creates a crescent panel that fills the space between the arc's inner curve and the center.
 * 
 * @param {THREE.Vector3} point1 - The first point of the arc.
 * @param {THREE.Vector3} point2 - The second point of the arc.
 * @param {number} height - The height of the crescent panel.
 * @param {boolean} flipArc - If true, flips the arc's direction.
 * @param {number} segments - The number of segments used to create the curved panel.
 * @param {Object} cornerOffset - Optional offset for the corner vertex position {x, z}.
 * @returns {THREE.BufferGeometry} The generated crescent panel buffer geometry.
 */
export function createCrescentPanel(point1, point2, height = 30, flipArc = false, segments = 36, cornerOffset = {x: 0, z: 0}) {
    // Calculate the center of the arc based on the two points
    const center = calculateArcCenter(point1, point2, flipArc);
    
    // Calculate arc radius based on the distance between points (for a 90-degree arc)
    const radius = Math.sqrt(
        Math.pow(point1.x - center.x, 2) + 
        Math.pow(point1.z - center.z, 2)
    );
    
    // Calculate the start and end angles of the arc
    const startAngle = Math.atan2(point1.z - center.z, point1.x - center.x);
    const endAngle = Math.atan2(point2.z - center.z, point2.x - center.x);
    
    // Ensure we're drawing the shorter 90-degree arc
    let angleLength = endAngle - startAngle;
    if (Math.abs(angleLength) > Math.PI) {
        angleLength = angleLength - Math.sign(angleLength) * Math.PI * 2;
    }
    
    // Create the crescent panel geometry
    return createCrescentPanelGeometry(center, radius, height, startAngle, angleLength, segments, cornerOffset);
}

/**
 * createProxyCenterCrescentPanel
 * 
 * Creates a crescent panel between the centers of two proxies.
 * 
 * @param {Array} proxy1 - The first proxy (array of 8 points representing a cuboid).
 * @param {Array} proxy2 - The second proxy (array of 8 points representing a cuboid).
 * @param {number} height - Optional height override for the panel. If not provided, uses the height from proxies.
 * @param {boolean} flipArc - If true, flips the arc's direction.
 * @param {number} segments - The number of segments used to create the curved panel.
 * @param {Object} cornerOffset - Optional offset for the corner vertex position {x, z}.
 * @returns {THREE.Mesh} The crescent panel mesh.
 */
export function createProxyCenterCrescentPanel(proxy1, proxy2, height = null, flipArc = false, segments = 36, cornerOffset = {x: 0, z: 0}) {
    if (!proxy1 || !proxy2 || proxy1.length !== 8 || proxy2.length !== 8) {
        console.error("Invalid proxies provided. Each proxy must have 8 points.");
        return null;
    }

    // Calculate center of proxy1
    const center1 = calculateProxyCenter(proxy1);
    
    // Calculate center of proxy2
    const center2 = calculateProxyCenter(proxy2);
    
    // Ensure the points are not the same
    if (center1.x === center2.x && center1.z === center2.z) {
        console.error("Proxy centers have the same X and Z coordinates. Cannot create a crescent panel.");
        return null;
    }
    
    // Determine panel height from proxies if not provided
    if (height === null) {
        // Use the height of the proxies (y-axis distance from bottom to top)
        height = proxy1[7].y - proxy1[0].y;
    }
    
    // Create points as THREE.Vector3 objects
    const point1 = new THREE.Vector3(center1.x, center1.y, center1.z);
    const point2 = new THREE.Vector3(center2.x, center2.y, center2.z);
    
    // Create the crescent panel geometry
    const crescentGeometry = createCrescentPanel(point1, point2, height, flipArc, segments, cornerOffset);
    
    // Create material for the crescent panel
    const material = new THREE.MeshStandardMaterial({
        color: sharedData.secondaryColor || 0x2255aa,  // Use secondary color if available
        flatShading: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85  // Make it slightly transparent
    });
    
    // Create the mesh
    const crescentMesh = new THREE.Mesh(crescentGeometry, material);
    crescentMesh.name = "crescentPanel";
    
    return crescentMesh;
}

/**
 * calculateArcWithCrescent
 * 
 * Calculates an arc between two proxies and adds a crescent panel, creating both geometries.
 * 
 * @param {Array} leftProxy - The coordinates of the left proxy.
 * @param {Array} rightProxy - The coordinates of the right proxy.
 * @param {boolean} flipArc - If true, flips the arc's direction.
 * @param {number} overrideRotation - An optional rotation value to override the default arc rotation.
 * @param {Object} cornerOffset - Optional offset for the crescent corner vertex position {x, z}.
 * @returns {Object} An object containing both the arc and crescent panel meshes.
 */
export function calculateArcWithCrescent(leftProxy, rightProxy, flipArc = false, overrideRotation, cornerOffset = {x: 0, z: 0}) {
    // Create the original arc geometry
    const arcGeometry = calculateProxyCenterArc(leftProxy, rightProxy, 30);
    const proxyCenterY = leftProxy[0].y + (Math.abs(leftProxy[0].y - leftProxy[7].y) / 2);
    
    // Reset arc origin
    resetArcOrigin(arcGeometry);
    
    // Create arc material
    const arcMaterial = new THREE.MeshStandardMaterial({
        color: sharedData.primaryColor,
        flatShading: true,
        side: THREE.DoubleSide,
    });
    
    // Create arc mesh
    const arcMesh = new THREE.Mesh(arcGeometry, arcMaterial);
    
    // Create crescent panel with corner offset
    const crescentPanel = createProxyCenterCrescentPanel(leftProxy, rightProxy, null, flipArc, 36, cornerOffset);
    
    // Reset crescent panel origin
    resetArcOrigin(crescentPanel.geometry);
    
    // Calculate pivot position
    const pivotPosition = {
        x: Math.min(leftProxy[0].x, rightProxy[0].x) + (Math.abs(leftProxy[0].x - rightProxy[0].x) / 2) + 15,
        y: proxyCenterY,
        z: Math.max(leftProxy[0].z, rightProxy[0].z) - (Math.abs(leftProxy[0].z - rightProxy[0].z) / 2) - 15,
    };
    
    // Create parent object
    const geometry = new THREE.BoxGeometry(30, 30, 30);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.1  // Nearly invisible, just for positioning
    });
    
    const arcParent = new THREE.Mesh(geometry, material);
    arcParent.position.set(pivotPosition.x, pivotPosition.y, pivotPosition.z);
    
    // Add both arc and crescent panel to parent
    arcParent.add(arcMesh);
    arcParent.add(crescentPanel);
    
    // Rotate the parent (which rotates both children)
    rotateArc(arcParent, overrideRotation); 
    
    arcParent.name = "jointArcWithCrescent";
    
    // Add arcParent to scene
    sharedData.sceneHelper.addToScene(arcParent);
    
    return {
        parentObject: arcParent,
        arcMesh: arcMesh,
        crescentPanel: crescentPanel
    };
}

function resetArcOrigin(arcGeometry) {
    // Reset the geometry's origin to (0,0,0) by translating all vertices
    // First calculate the center of the geometry to use as offset
    arcGeometry.computeBoundingBox();
    const center = new THREE.Vector3();
    arcGeometry.boundingBox.getCenter(center);
    
    // Translate all vertices to center the geometry at origin
    arcGeometry.translate(-center.x, -center.y, -center.z);
}

function rotateArc(arcParent, overrideRotation) {

    if(arcParent.position.x > sharedData.jointCenter.x && arcParent.position.z < sharedData.jointCenter.z) {
        arcParent.rotation.y = Math.PI;

        // arcParent.material.color = new THREE.Color("#FF00FF");
        // arcParent.scale.set(5, 5, 5);
        // arcParent.children[0].scale.set(0.2, 0.2, 0.2);
    }
    else if(arcParent.position.x > sharedData.jointCenter.x && arcParent.position.z > sharedData.jointCenter.z) {
        arcParent.rotation.y = Math.PI;

        // arcParent.material.color = new THREE.Color("#FF00FF");
        // arcParent.scale.set(5, 5, 5);
        // arcParent.children[0].scale.set(0.2, 0.2, 0.2);
    }

    if(sharedData.jointDirection == "outwards") {
        arcParent.rotation.y += Math.PI;
    }

    arcParent.rotation.y = overrideRotation || arcParent.rotation.y;
}

/**
 * createGeometryFromPoints
 * 
 * Creates a geometry from the provided points and returns the BufferGeometry.
 * The points define a quadrilateral (2 triangles) used to create the geometry.
 * 
 * @param {THREE.Vector3} pointA - The first point.
 * @param {THREE.Vector3} pointB - The second point.
 * @param {THREE.Vector3} pointC - The third point.
 * @param {THREE.Vector3} pointD - The fourth point.
 * @returns {THREE.BufferGeometry} The created geometry.
 */
export function createGeometryFromPoints(pointA, pointB, pointC, pointD) {
    const indices = [
        0, 1, 2, // First triangle (A -> B -> C)
        0, 2, 3  // Second triangle (A -> C -> D)
    ];

    const verticesArray = new Float32Array([
        pointA.x, pointA.y, pointA.z, // Vertex 0
        pointB.x, pointB.y, pointB.z, // Vertex 1
        pointC.x, pointC.y, pointC.z, // Vertex 2
        pointD.x, pointD.y, pointD.z  // Vertex 3            
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(verticesArray, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

/**
 * createJointClosure
 * 
 * Creates a closure geometry for a joint, used to close the joint's geometry at the connection.
 * It can be either horizontal or vertical based on the direction.
 * 
 * @param {Object} joint - The joint object containing proxy coordinates.
 * @param {string} direction - The direction of the closure ("horizontal" or "vertical").
 * @returns {Array} An array of geometries representing the closure.
 */
export function createJointClosure(joint, direction) {
    const geometries = [];

    console.log("createJointClosure:", joint);

    if (joint === undefined) {
        return geometries;
    }

    if (direction === "horizontal") {
        geometries.push(createGeometryFromPoints(
            joint.proxyOriginal2.coordinates[4],
            joint.proxyOriginal1.coordinates[7],
            joint.proxy1.coordinates[7],
            joint.proxy2.coordinates[4]
        ));
        geometries.push(createGeometryFromPoints(
            joint.proxyOriginal2.coordinates[5],
            joint.proxyOriginal1.coordinates[6],
            joint.proxy1.coordinates[6],
            joint.proxy2.coordinates[5]
        ));
        geometries.push(createGeometryFromPoints(
            joint.proxyOriginal1.coordinates[7],
            joint.proxyOriginal2.coordinates[4],
            joint.proxyOriginal2.coordinates[5],
            joint.proxyOriginal1.coordinates[6]
        ));
    } else {
        geometries.push(createGeometryFromPoints(
            joint.proxyOriginal2.coordinates[4],
            joint.proxyOriginal1.coordinates[4],
            joint.proxy1.coordinates[4],
            joint.proxy2.coordinates[4]
        ));
        geometries.push(createGeometryFromPoints(
            joint.proxyOriginal2.coordinates[7],
            joint.proxyOriginal1.coordinates[7],
            joint.proxy1.coordinates[7],
            joint.proxy2.coordinates[7]
        ));
        geometries.push(createGeometryFromPoints(
            joint.proxyOriginal1.coordinates[7],
            joint.proxyOriginal2.coordinates[6],
            joint.proxyOriginal2.coordinates[5],
            joint.proxyOriginal1.coordinates[4]
        ));
    }

    return geometries;
}

/**
 * mergeGeometries
 * 
 * Merges an array of geometries into one single geometry. This is useful for optimizing the rendering
 * of multiple objects into one mesh.
 * 
 * @param {Array} geometries - The array of geometries to be merged.
 * @returns {THREE.BufferGeometry} The merged geometry.
 */
export function mergeGeometries(geometries) {
    if (geometries.length > 0) {
        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
        return mergedGeometry;
    }
}
