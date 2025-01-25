import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sharedData } from "../../../Ahu3D/globals.js";

export function calculateJointCenter(joint, type) {
    let xPositions = [];
    let zPositions = [];
    let ductKeys = [];

    console.log("calculateJointCenter joint:", joint);

    return

    if(intersection.left) {
        ductKeys.push("left");
        xPositions.push(intersection.left.segment.duct.userData.component.object.position.x);
        zPositions.push(intersection.left.segment.duct.userData.component.object.position.z);
    }
    if(intersection.right) {
        ductKeys.push("right");
        xPositions.push(intersection.right.segment.duct.userData.component.object.position.x);
        zPositions.push(intersection.right.segment.duct.userData.component.object.position.z);
    }
    if(intersection.up) {
        ductKeys.push("up");
        xPositions.push(intersection.up.segment.duct.userData.component.object.position.x);
        zPositions.push(intersection.up.segment.duct.userData.component.object.position.z);
    }
    if(intersection.down) {
        ductKeys.push("down");
        xPositions.push(intersection.down.segment.duct.userData.component.object.position.x);
        zPositions.push(intersection.down.segment.duct.userData.component.object.position.z);
    }

    let xCenter = (Math.max(...xPositions) + Math.min(...xPositions)) / 2;
    let zCenter = (Math.max(...zPositions) + Math.min(...zPositions)) / 2;

    if(type == "Cross-Joint" || type == "T-Joint") {
        if(intersection.up) {
            xCenter = intersection.up.segment.duct.userData.component.object.position.x;
        }
        else if(intersection.down) {
            xCenter = intersection.down.segment.duct.userData.component.object.position.x;
        }
        if(intersection.left) {
            zCenter = intersection.left.segment.duct.userData.component.object.position.z;
        }
        else if(intersection.right) {
            zCenter = intersection.right.segment.duct.userData.component.object.position.z;
        }
    }

    else if(type == "L-Joint") {
        if(ductKeys.includes("left") && ductKeys.includes("down")) {
            xCenter = Math.max(...xPositions);
            zCenter = Math.max(...zPositions);
        }
        else if(ductKeys.includes("right") && ductKeys.includes("down")) {
            xCenter = Math.min(...xPositions);
            zCenter = Math.max(...zPositions);
        }
        else if(ductKeys.includes("left") && ductKeys.includes("up")) {
            xCenter = Math.max(...xPositions);
            zCenter = Math.min(...zPositions);
        }
        else if(ductKeys.includes("right") && ductKeys.includes("up")) {
            xCenter = Math.min(...xPositions);
            zCenter = Math.min(...zPositions);
        }
    }

    // const geometry = new THREE.BoxGeometry(100, 100, 100);
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // for(const i in xPositions) {            
    //     const cube = new THREE.Mesh(geometry, material);
    //     cube.position.x = xPositions[i];
    //     cube.position.z = zPositions[i];
    //     cube.name = "joint";

    //     this.sceneHelper.addToScene(cube);
    // }     
    
    // const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // const cube = new THREE.Mesh(geometry, material2);
    // cube.position.x = xCenter;
    // cube.position.z = zCenter;
    // cube.name = "joint";
    // this.sceneHelper.addToScene(cube);        

    sharedData.jointCenter = {
        x: xCenter,
        z: zCenter
    }        
}

export function createJointBackwall(points, largestGlobalSize = 1000) {
    console.log("createJointBackwall started:", points);
    if (points.length < 3) {
        throw new Error("A shape requires at least 3 points.");
    }

    const wallThickness = sharedData.moduleConfigs.parametricOptions.wallThickness;

    // Ensure the points are flattened into 2D (projected onto XZ plane)
    const shapePoints = points.map(point => new THREE.Vector2(point.x, point.z));

    // Create a THREE.Shape from the points
    const shape = new THREE.Shape(shapePoints);

    // Create ExtrudeGeometry to add thickness to the shape
    const extrudeSettings = {
        depth: wallThickness, // Thickness of the extrusion
        bevelEnabled: false   // Ensure no bevel for consistent structure
    };
    const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Convert to BufferGeometry with indexing
    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', extrudeGeometry.getAttribute('position'));
    bufferGeometry.setAttribute('normal', extrudeGeometry.getAttribute('normal'));
    bufferGeometry.setIndex(extrudeGeometry.index || new THREE.BufferAttribute(new Uint16Array([...Array(bufferGeometry.attributes.position.count).keys()]), 1));

    // Apply transformations to the geometry
    const transformMatrix = new THREE.Matrix4();
    transformMatrix.makeRotationX(Math.PI / 2);
    bufferGeometry.applyMatrix4(transformMatrix);

    // Translate the geometry along the y-axis
    bufferGeometry.translate(0, points[0].y, 0);

    console.log("createJointBackwall bufferGeometry analysis:", bufferGeometry);

    return bufferGeometry;
}

export function connectProxiesDiagonallyDownhill(leftProxy, rightProxy, flipArc = false, overrideRotation) {
    const geometries = [];

    if(sharedData.xzJointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {
        calculateArc(leftProxy, rightProxy, flipArc, overrideRotation);
        return geometries;
    }

    geometries.push(
        createGeometryFromPoints(
            leftProxy[1],
            rightProxy[1],
            rightProxy[3],
            leftProxy[3],
            leftProxy,
            rightProxy
        )
    );
    geometries.push(
        createGeometryFromPoints(
            leftProxy[5],
            rightProxy[5],
            rightProxy[7],
            leftProxy[7],
            leftProxy,
            rightProxy
        )
    );
    geometries.push(
        createGeometryFromPoints(
            leftProxy[1],
            leftProxy[5],
            rightProxy[5],
            rightProxy[1],
            leftProxy,
            rightProxy
        )
    );
    geometries.push(
        createGeometryFromPoints(
            leftProxy[3],
            leftProxy[7],
            rightProxy[7],
            rightProxy[3],
            leftProxy,
            rightProxy
        )
    );

    return geometries;
}

export function connectProxiesDiagonallyUphill(leftProxy, rightProxy, flipArc = false, overrideRotation) {
    const geometries = [];

    if(sharedData.xzJointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {
        calculateArc(leftProxy, rightProxy, flipArc, overrideRotation);
        return geometries;
    }

    geometries.push(
        createGeometryFromPoints(
            leftProxy[0],
            rightProxy[0],
            rightProxy[2],
            leftProxy[2]
        )
    );
    geometries.push(
        createGeometryFromPoints(
            leftProxy[0],
            leftProxy[4],
            rightProxy[4],
            rightProxy[0]
        )
    );
    geometries.push(
        createGeometryFromPoints(
            leftProxy[2],
            leftProxy[6],
            rightProxy[6],
            rightProxy[2]
        )
    );

    return geometries;
}

export function calculateArc(leftProxy, rightProxy, flipArc = false, overrideRotation) {
    if(sharedData.xzJointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {

        let jointCenter = sharedData.jointCenter;

        let width = Math.abs(leftProxy[0].x - rightProxy[0].x);
        let length = leftProxy[7].y - leftProxy[0].y;
        const arc = createArc(width, length, flipArc);

        if(leftProxy[0].x > jointCenter.x && leftProxy[0].z > jointCenter.z){
            arc.rotation.z = Math.PI; // upper-right
        }
        else if(leftProxy[0].x > jointCenter.x && leftProxy[0].z < jointCenter.z) {
            arc.rotation.z = Math.PI / 2; // lower-right
        }
        else if(leftProxy[0].x < jointCenter.x && leftProxy[0].z < jointCenter.z) {
            arc.rotation.z = Math.PI * 2; // lower-left
        }
        else {
            arc.rotation.z = Math.PI / -2; // upper-left
        }

        if(sharedData.xzJointDirection == "outwards"){
            arc.rotation.z += Math.PI;
        }

        if(overrideRotation){
            arc.rotation.z = overrideRotation;
        }

        if(flipArc) {
            arc.rotation.z += Math.PI;
        }

        arc.position.x = Math.min(leftProxy[0].x, rightProxy[0].x) + (Math.abs(leftProxy[0].x - rightProxy[0].x) / 2) + 15;
        arc.position.z = Math.min(leftProxy[0].z, rightProxy[0].z) + (Math.abs(leftProxy[0].z - rightProxy[0].z) / 2) - 15;
        arc.position.y = leftProxy[0].y + length;

        sharedData.backwallArcConfigs[sharedData.backwallArcConfigs.length-1].ring2.userData.position = arc.position.clone();
        sharedData.backwallArcConfigs[sharedData.backwallArcConfigs.length-1].ring2.userData.width = width;
        sharedData.backwallArcConfigs[sharedData.backwallArcConfigs.length-1].ring2.userData.rotation = arc.rotation;
        
    }
}

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
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 1
    });
    
    const ring1 = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, 1, thetaStart, thetaLength);
    const ring2 = ring1.clone();
    const outerCylinderGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, length, thetaSegments, 1, true, thetaStart, thetaLength);
    const innerCylinderGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, length, thetaSegments, 1, true, thetaStart, thetaLength);                       

    // Create matrices
    const matrix = new THREE.Matrix4();
    const rotationMatrix1 = new THREE.Matrix4();
    const rotationMatrix2 = new THREE.Matrix4();

    // Transform geometries
    matrix.makeTranslation(0, 0, length); 
    rotationMatrix1.makeRotationY(Math.PI / 2); // 90 degrees around Y axis
    rotationMatrix2.makeRotationY(Math.PI / 2); // 90 degrees around Y axis
    rotationMatrix1.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)); // 90 degrees around X axis
    rotationMatrix2.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)); // 90 degrees around X axis  
    
    rotationMatrix1.multiply(new THREE.Matrix4().makeTranslation(0, length / 2, 0)); // Translate up by length / 2
    rotationMatrix2.multiply(new THREE.Matrix4().makeTranslation(0, length / 2, 0)); // Translate up by length / 2

    // Apply rotations to the geometries
    outerCylinderGeometry.applyMatrix4(rotationMatrix1);
    innerCylinderGeometry.applyMatrix4(rotationMatrix2);
    ring2.applyMatrix4(matrix);             

    // Define the ArcCurve
    const startAngle = 0;
    const endAngle = Math.PI / 2; // Quarter circle
    const arcCurve = new THREE.ArcCurve(0, 0, outerRadius, startAngle, endAngle, false);

    // Generate points for the arc
    let arcPoints = arcCurve.getPoints(8);

    const crescentShape = new THREE.Shape();
    if(sharedData.xzJointDirection == "outwards" || isCorner) {
        // Move to the first point of the arc
        crescentShape.moveTo(arcPoints[0].x, arcPoints[0].y);

        // Connect to all points of the arc
        arcPoints.forEach(point => crescentShape.lineTo(point.x - 30, point.y));

        // Diagonally connect the last arc point back to the first arc point
        crescentShape.lineTo(arcPoints[0].x, arcPoints[0].y);  
    }
    else {
        // Define the center point (flipped side apex)
        const centerPoint = new THREE.Vector2(outerRadius, outerRadius); // Origin

        // Create the shape for the crescent
        crescentShape.moveTo(centerPoint.x, centerPoint.y);
        arcPoints.forEach(point => crescentShape.lineTo(point.x, point.y));
        crescentShape.lineTo(centerPoint.x, centerPoint.y); // Close the shape back to the center
    }

    // Create a geometry from the shape
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

    if(sharedData.xzJointDirection == "inwards" && sharedData.isLJoint) {
        sharedData.backwallArcConfigs.push({
            innerRadius: innerRadius, 
            outerRadius: outerRadius, 
            thetaSegments: thetaSegments, 
            phiSegments: 1, 
            thetaStart: thetaStart, 
            thetaLength: thetaLength,
            ring2: ring2
        });
    }
    else {
        sharedData.backwallArcConfigs.push({
            ring2: ring2
        });
        geometriesToMerge.push(crescentGeometry);
        geometriesToMerge.push(crescentGeometry2);
    }

    let mergedGeometry = BufferGeometryUtils.mergeGeometries(geometriesToMerge, false);

    const mergedGeometryMatrix = new THREE.Matrix4();
    mergedGeometryMatrix.makeTranslation((width / -2) + 15,(width / -2) + 15, 0); 
    mergedGeometry.applyMatrix4(mergedGeometryMatrix);

    // Create a single mesh from the merged geometry
    const arcMesh = new THREE.Mesh(mergedGeometry, material);

    // Add the cylinder to the scene
    arcMesh.name = "jointArc";
    arcMesh.rotation.x = Math.PI / 2;
    arcMesh.rotation.z = Math.PI / -2;
    arcMesh.position.x -= 1000;
    sharedData.sceneHelper.addToScene(arcMesh);

    return arcMesh;
}

export function createGeometryFromPoints(pointA, pointB, pointC, pointD) {
    // Define the indices for the two triangles (clockwise winding order)
    let indices = [
        0, 1, 2, // First triangle (A -> B -> C)
        0, 2, 3  // Second triangle (A -> C -> D)
    ];
    
    // Convert vertices to Float32Array for BufferGeometry
    const verticesArray = new Float32Array([
        pointA.x, pointA.y, pointA.z, // Vertex 0
        pointB.x, pointB.y, pointB.z, // Vertex 1
        pointC.x, pointC.y, pointC.z, // Vertex 2
        pointD.x, pointD.y, pointD.z,  // Vertex 3            
    ]);

    // Create the BufferGeometry
    const geometry = new THREE.BufferGeometry();

    // Set the vertices and indices
    geometry.setAttribute('position', new THREE.BufferAttribute(verticesArray, 3));
    geometry.setIndex(indices);

    // Compute normals if you need lighting effects
    geometry.computeVertexNormals();

    return geometry;
}

export function createJointClosure(joint, direction) {
    const geometries = [];

    console.log("createJointClosure:", joint);

    if(joint == undefined) {
        return geometries;
    }

    if(direction == "horizontal") {
        geometries.push(
            createGeometryFromPoints(
                joint.proxyOriginal2.coordinates[4],
                joint.proxyOriginal1.coordinates[7],
                joint.proxy1.coordinates[7],
                joint.proxy2.coordinates[4]
            )
        );
        geometries.push(
            createGeometryFromPoints(
                joint.proxyOriginal2.coordinates[5],
                joint.proxyOriginal1.coordinates[6],
                joint.proxy1.coordinates[6],
                joint.proxy2.coordinates[5]
            )
        );
        geometries.push(
            createGeometryFromPoints(
                joint.proxyOriginal1.coordinates[7],
                joint.proxyOriginal2.coordinates[4],
                joint.proxyOriginal2.coordinates[5],
                joint.proxyOriginal1.coordinates[6]
            )
        );
    }
    else {
        geometries.push(
            createGeometryFromPoints(
                joint.proxyOriginal2.coordinates[4],
                joint.proxyOriginal1.coordinates[4],
                joint.proxy1.coordinates[4],
                joint.proxy2.coordinates[4]
            )
        );
        geometries.push(
            createGeometryFromPoints(
                joint.proxyOriginal2.coordinates[7],
                joint.proxyOriginal1.coordinates[7],
                joint.proxy1.coordinates[7],
                joint.proxy2.coordinates[7]
            )
        );
        geometries.push(
            createGeometryFromPoints(
                joint.proxyOriginal1.coordinates[7],
                joint.proxyOriginal2.coordinates[6],
                joint.proxyOriginal2.coordinates[5],
                joint.proxyOriginal1.coordinates[4]
            )
        );
    }

    return geometries;
}

export function mergeGeometries(geometries) {
    if (geometries.length > 0) {
        // Merge all geometries into one
        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);

        return mergedGeometry;
    }
}
