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
export function calculateJointCenter(jointKey) {
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

    sharedData.jointCenter = jointCenter;
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
        calculateArc(leftProxy, rightProxy, flipArc, overrideRotation);
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
        calculateArc(leftProxy, rightProxy, flipArc, overrideRotation);
        return geometries;
    }

    geometries.push(createGeometryFromPoints(leftProxy[0], rightProxy[0], rightProxy[2], leftProxy[2]));
    geometries.push(createGeometryFromPoints(leftProxy[0], leftProxy[4], rightProxy[4], rightProxy[0]));
    geometries.push(createGeometryFromPoints(leftProxy[2], leftProxy[6], rightProxy[6], rightProxy[2]));

    return geometries;
}

/**
 * calculateArc
 * 
 * Calculates an arc between two proxies, creating the necessary geometry for the arc.
 * 
 * @param {Array} leftProxy - The coordinates of the left proxy.
 * @param {Array} rightProxy - The coordinates of the right proxy.
 * @param {boolean} flipArc - If true, flips the arc's direction.
 * @param {number} overrideRotation - An optional rotation value to override the default arc rotation.
 */
export function calculateArc(leftProxy, rightProxy, flipArc = false, overrideRotation) {
    if (sharedData.jointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {

        let jointCenter = sharedData.jointCenter;

        let width = Math.abs(leftProxy[0].x - rightProxy[0].x);
        let length = leftProxy[7].y - leftProxy[0].y;
        const arc = createArc(width, length, flipArc);

        // Determine the rotation of the arc based on joint position and direction
        if (leftProxy[0].x > jointCenter.x && leftProxy[0].z > jointCenter.z) {
            arc.rotation.z = Math.PI; // upper-right
        } else if (leftProxy[0].x > jointCenter.x && leftProxy[0].z < jointCenter.z) {
            arc.rotation.z = Math.PI / 2; // lower-right
        } else if (leftProxy[0].x < jointCenter.x && leftProxy[0].z < jointCenter.z) {
            arc.rotation.z = Math.PI * 2; // lower-left
        } else {
            arc.rotation.z = Math.PI / -2; // upper-left
        }

        // Adjust for outward direction or override rotation
        if (sharedData.jointDirection == "outwards") {
            arc.rotation.z += Math.PI;
        }

        if (overrideRotation) {
            arc.rotation.z = overrideRotation;
        }

        if (flipArc) {
            arc.rotation.z += Math.PI;
        }

        // Position the arc based on the proxy coordinates and width/length
        arc.position.x = Math.min(leftProxy[0].x, rightProxy[0].x) + (Math.abs(leftProxy[0].x - rightProxy[0].x) / 2) + 15;
        arc.position.z = Math.min(leftProxy[0].z, rightProxy[0].z) + (Math.abs(leftProxy[0].z - rightProxy[0].z) / 2) - 15;
        arc.position.y = leftProxy[0].y + length;

        sharedData.backwallArcConfigs[sharedData.backwallArcConfigs.length - 1].ring2.userData.position = arc.position.clone();
        sharedData.backwallArcConfigs[sharedData.backwallArcConfigs.length - 1].ring2.userData.width = width;
        sharedData.backwallArcConfigs[sharedData.backwallArcConfigs.length - 1].ring2.userData.rotation = arc.rotation;

        sharedData.ahuObject["3d"].joints.arcs.push(arc);
    }
}

/**
 * createArc
 * 
 * Creates an arc geometry based on the given width and length. Optionally, a corner shape can be created.
 * 
 * @param {number} width - The width of the arc.
 * @param {number} length - The length of the arc.
 * @param {boolean} isCorner - Whether the arc is for a corner shape.
 * @returns {THREE.Mesh} The generated arc mesh.
 */
export function createArc(width, length, isCorner = false) {
    const scaleFactor = width - 30;
    const innerRadius = scaleFactor;
    let outerRadius = 1 + (0.12015 / (scaleFactor / 250));
    outerRadius *= scaleFactor;
    const thetaSegments = 8;
    const thetaStart = 0;
    const thetaLength = Math.PI / 2;

    const material = new THREE.MeshStandardMaterial({
        color: sharedData.primaryColor,
        side: THREE.DoubleSide
    });

    const ring1 = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, 1, thetaStart, thetaLength);
    const ring2 = ring1.clone();
    const outerCylinderGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, length, thetaSegments, 1, true, thetaStart, thetaLength);
    const innerCylinderGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, length, thetaSegments, 1, true, thetaStart, thetaLength);

    // Apply transformations to the geometry
    const matrix = new THREE.Matrix4();
    const rotationMatrix1 = new THREE.Matrix4();
    const rotationMatrix2 = new THREE.Matrix4();

    matrix.makeTranslation(0, 0, length);
    rotationMatrix1.makeRotationY(Math.PI / 2); 
    rotationMatrix2.makeRotationY(Math.PI / 2); 
    rotationMatrix1.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)); 
    rotationMatrix2.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));  

    rotationMatrix1.multiply(new THREE.Matrix4().makeTranslation(0, length / 2, 0)); 
    rotationMatrix2.multiply(new THREE.Matrix4().makeTranslation(0, length / 2, 0)); 

    outerCylinderGeometry.applyMatrix4(rotationMatrix1);
    innerCylinderGeometry.applyMatrix4(rotationMatrix2);
    ring2.applyMatrix4(matrix);

    // Define the arc curve
    const arcCurve = new THREE.ArcCurve(0, 0, outerRadius, 0, Math.PI / 2, false);

    const arcPoints = arcCurve.getPoints(8);

    const crescentShape = new THREE.Shape();
    if (sharedData.jointDirection == "outwards" || isCorner) {
        crescentShape.moveTo(arcPoints[0].x, arcPoints[0].y);
        arcPoints.forEach(point => crescentShape.lineTo(point.x - 30, point.y));
        crescentShape.lineTo(arcPoints[0].x, arcPoints[0].y);  
    } else {
        const centerPoint = new THREE.Vector2(outerRadius, outerRadius);
        crescentShape.moveTo(centerPoint.x, centerPoint.y);
        arcPoints.forEach(point => crescentShape.lineTo(point.x, point.y));
        crescentShape.lineTo(centerPoint.x, centerPoint.y);
    }

    // Create the geometry from the crescent shape
    const crescentGeometry = new THREE.ShapeGeometry(crescentShape);
    const crescentGeometry2 = crescentGeometry.clone();
    
    const crescentMatrix = new THREE.Matrix4();
    crescentMatrix.makeTranslation(0, 0, 30);
    crescentGeometry2.applyMatrix4(crescentMatrix);

    let geometriesToMerge = [
        ring1, 
        ring2,
        outerCylinderGeometry,
        innerCylinderGeometry
    ];

    sharedData.backwallArcConfigs.push({
        ring2: ring2
    });
    geometriesToMerge.push(crescentGeometry);
    geometriesToMerge.push(crescentGeometry2);

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometriesToMerge, false);

    const mergedGeometryMatrix = new THREE.Matrix4();
    mergedGeometryMatrix.makeTranslation((width / -2) + 15, (width / -2) + 15, 0); 
    mergedGeometry.applyMatrix4(mergedGeometryMatrix);

    const arcMesh = new THREE.Mesh(mergedGeometry, material);
    arcMesh.name = "jointArc";
    arcMesh.rotation.x = Math.PI / 2;
    arcMesh.rotation.z = Math.PI / -2;
    arcMesh.position.x -= 1000;

    // sharedData.sceneHelper.addToScene(arcMesh);

    return arcMesh;
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
