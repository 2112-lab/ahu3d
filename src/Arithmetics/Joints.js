import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export default class Joints {
    constructor(ahuGroup, innerDuctDimensions, sceneHelper, primaryColor) {
        this.ahuGroup = ahuGroup;
        this.innerDuctDimensions = innerDuctDimensions;
        this.sceneHelper = sceneHelper;
        this.primaryColor = primaryColor;

        console.log("Joints started this.sceneHelper:", this.sceneHelper);

        this.jointBlockStyle = this.ahuGroup.blockStyle.joints;

        this.xzJointStyle = this.jointBlockStyle.XZ.style;
        this.xzJointDirection = this.jointBlockStyle.XZ.direction;
        this.xzJointContext = this.jointBlockStyle.XZ.context;
        this.xzJointPadding = this.jointBlockStyle.XZ.padding;

        this.xzJointYStyle = this.jointBlockStyle.XZ.yStyle;
        this.xzJointYDirection = this.jointBlockStyle.XZ.yDirection;
    }

    createArc(width, length, isCorner = false) {
        const scaleFactor = width - 30;
        const innerRadius = scaleFactor;
        let outerRadius = 1 + (0.12015 / (scaleFactor / 250));
        outerRadius *= scaleFactor;
        const thetaSegments = 8;
        const thetaStart = 0;
        const thetaLength = Math.PI / 2;
        
        const material = new THREE.MeshStandardMaterial({ 
            color: this.primaryColor, 
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
        if(this.xzJointDirection == "outwards" || isCorner) {
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

        if(this.xzJointDirection == "inwards" && this.isLJoint) {
            this.backwallArcConfigs.push({
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
            this.backwallArcConfigs.push({
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
        this.sceneHelper.addToScene(arcMesh);

        return arcMesh;
    }

    calculateJointCenter(intersection, type) {
        let xPositions = [];
        let zPositions = [];
        let ductKeys = [];

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

        console.log("calculateJointCenter xPositions:", xPositions);
        console.log("calculateJointCenter zPositions:", zPositions);

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

        this.jointCenter = {
            x: xCenter,
            z: zCenter
        }        
    }

    createCrossJoint(intersection, largestGlobalSize) {
        const geometries = [];

        this.backwallArcConfigs = [];

        this.calculateJointCenter(intersection, "Cross-Joint");        

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

            this.createJointBackwall(backwall, largestGlobalSize);
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
    
            this.createJointBackwall(backwall, largestGlobalSize);
        }  

        geometries.push(
            ...this.connectProxiesDiagonallyUphill(
                intersection.left.segment.duct.userData.proxy1Vertices,
                intersection.up.segment.duct.userData.proxyMedianVertices
            )
        ); 
        geometries.push(
            ...this.connectProxiesDiagonallyUphill(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.up.segment.duct.userData.proxy1Vertices
            )
        );

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

    }

    createTJoint(intersection, largestGlobalSize) {
        const geometries = [];

        this.backwallArcConfigs = [];

        this.calculateJointCenter(intersection, "T-Joint");  

        if(this.xzJointDirection == "outwards") {
            if(intersection.right == null) {

                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill( 
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );

                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    ) 
                );

                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )   
                );
            }
            else if(intersection.left == null) {
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );

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
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.down == null) {

                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        true,
                        Math.PI / 2
                    )
                );

                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }
            else if(intersection.up == null) {

                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    ) 
                );

                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
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
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    ) 
                );       
            }
        }
        else if(this.xzJointDirection == "inwards") {
            if(intersection.right == null) {
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices,
                        true
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices,
                        true
                    )
                );

                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
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
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    )
                );
            }
            else if(intersection.left == null) {

                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices,
                        true
                    )
                );
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
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.down == null) {

                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        true
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        true
                    )
                );

                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }
            else if(intersection.up == null) {

                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        true
                    )
                );
                geometries.push(
                    ...this.connectProxiesDiagonallyUphill(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        true
                    ) 
                );

                geometries.push(
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
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
                    ...this.connectProxiesDiagonallyDownhill(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    ) 
                );   
            }
        }

        this.createTJointBackwall(intersection, largestGlobalSize);

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
    }

    createLJoint(intersection, largestGlobalSize) {
        const geometries = [];
        let diagonalWidth = 0;

        this.backwallArcConfigs = [];

        this.isLJoint = true;

        this.calculateJointCenter(intersection, "L-Joint"); 

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

    createJointProxies(intersection, pairDirection = null) {
        console.log("createJointProxies started");
          
        const wallThickness = 30;
  
        let largestGlobalSize = this.innerDuctDimensions["small"];
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                if(this.innerDuctDimensions[duct.xetoDuct.graphicLocation.size] > largestGlobalSize) {
                    largestGlobalSize = this.innerDuctDimensions[duct.xetoDuct.graphicLocation.size];
                }
            }
        }

        const areHelpersOn = false;

        let material = new THREE.MeshStandardMaterial({ color: this.primaryColor });
        let material2 = new THREE.MeshStandardMaterial({ color: this.primaryColor });
        let material3 = new THREE.MeshStandardMaterial({ color: this.primaryColor });
        let material4 = new THREE.MeshStandardMaterial({ color: this.primaryColor });
        let material5 = new THREE.MeshStandardMaterial({ color: this.primaryColor });
        
        if(areHelpersOn) {
            material.color.setHex("0xFF0000");
            material2.color.setHex("0x0000FF");
            material3.color.setHex("0x00FF00");
            material4.color.setHex("0xFF0000");
            material5.color.setHex("0x0000FF");
        }          

        let y_offset = -30;

        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        this.calculateAdjacentContext(intersection, largestGlobalSize, definedIntersectionCount);
  
        for(const key in intersection) {
            let duct = intersection[key];

            if(duct != null) {
                const innerDuctDimensionsensions = duct.segment.duct.userData.component.object.innerDuctDimensionsensions;

                const ductDepth = this.innerDuctDimensions[duct.xetoDuct.graphicLocation.size];

                const proxyDepth = this.innerDuctDimensions[duct.xetoDuct.graphicLocation.size] + y_offset;

                const proxy1Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxy2Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyOriginal1Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyOriginal2Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);    
                const proxyMedianGeometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);

                this.moveProxyVertices(proxy1Geometry, ductDepth, duct.proxyLengths.proxy1, largestGlobalSize);
                this.moveProxyVertices(proxy2Geometry, ductDepth, duct.proxyLengths.proxy2, largestGlobalSize);
                this.moveProxyVertices(proxyMedianGeometry, ductDepth, duct.proxyLengths.proxyMedian, largestGlobalSize);
                this.moveOriginalProxyVertices(proxyOriginal1Geometry);
                this.moveOriginalProxyVertices(proxyOriginal2Geometry);

                const proxy1 = new THREE.Mesh(proxy1Geometry, material);
                proxy1.position.copy(duct.segment.duct.userData.component.object.position);
                const proxy2 = new THREE.Mesh(proxy2Geometry, material2);
                const proxyOriginal1 = new THREE.Mesh(proxyOriginal1Geometry, material4); 
                const proxyOriginal2 = new THREE.Mesh(proxyOriginal2Geometry, material5); 
                const proxyMedian = new THREE.Mesh(proxyMedianGeometry, material3);

                

                if(key == "up") {
                    proxy1.position.x += (innerDuctDimensionsensions.x / -2);
                    proxy1.position.z += (innerDuctDimensionsensions.z) / -2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.x += (innerDuctDimensionsensions.x);
                }
                else if(key == "down") {
                    proxy1.position.x += (innerDuctDimensionsensions.x / -2);
                    proxy1.position.z += (innerDuctDimensionsensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.x += (innerDuctDimensionsensions.x);
                }
                else if(key == "left") {
                    proxy1.position.x += (innerDuctDimensionsensions.x / 2);
                    proxy1.position.z += (innerDuctDimensionsensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.z += (innerDuctDimensionsensions.z * -1);
                }
                else if(key == "right") {
                    proxy1.position.x += (innerDuctDimensionsensions.x / -2);
                    proxy1.position.z += (innerDuctDimensionsensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.z += (innerDuctDimensionsensions.z * -1);
                }   

                proxyMedian.position.copy(proxy1.position);

                proxyOriginal1.position.copy(proxy1.position);
                proxyOriginal2.position.copy(proxy2.position);
                
                const proxy1Vertices = this.mapProxyVertices(proxy1);
                const proxy2Vertices = this.mapProxyVertices(proxy2);
                const proxyOriginal1Vertices = this.mapProxyVertices(proxyOriginal1);
                const proxyOriginal2Vertices = this.mapProxyVertices(proxyOriginal2);
        
                duct.segment.duct.userData.proxy1Vertices = proxy1Vertices;
                duct.segment.duct.userData.proxy2Vertices = proxy2Vertices;
                duct.segment.duct.userData.proxyOriginal1Vertices = proxyOriginal1Vertices;
                duct.segment.duct.userData.proxyOriginal2Vertices = proxyOriginal2Vertices;
        
                proxy1.name = "jointHelperProxy";
                proxy2.name = "jointHelperProxy";
                proxyOriginal1.name = "jointHelperProxy";
                proxyOriginal2.name = "jointHelperProxy";
                proxyMedian.name = "jointHelperProxy";

                proxy1.userData = {
                    helperColor: "0xFF0000",
                    productionColor: "this.primaryColor"
                };
                proxy2.userData = {
                    helperColor: "0x0000FF",
                    productionColor: "this.primaryColor"
                };
                proxyOriginal1.userData = {
                    helperColor: "0xFF0000",
                    productionColor: "this.primaryColor"
                };
                proxyOriginal2.userData = {
                    helperColor: "0x0000FF",
                    productionColor: "this.primaryColor"
                };
                proxyMedian.userData = {
                    helperColor: "0x00FF00",
                    productionColor: "this.primaryColor"
                };

                this.sceneHelper.addToScene(proxy1);
                this.sceneHelper.addToScene(proxy2);
                this.sceneHelper.addToScene(proxyOriginal1);
                this.sceneHelper.addToScene(proxyOriginal2);
                if(pairDirection === null) {
                    this.sceneHelper.addToScene(proxyMedian);
                }

                duct.segment.duct.userData.proxies = {
                    proxy1: proxy1, 
                    proxy2: proxy2,
                    proxyOriginal1: proxyOriginal1, 
                    proxyOriginal2: proxyOriginal2, 
                    proxyMedian: proxyMedian, 
                };

                for(const key in duct.segment.duct.userData.proxies) {
                    let proxy = duct.segment.duct.userData.proxies[key];
                    
                    const wireframe = new THREE.WireframeGeometry(proxy.geometry);
                    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                    const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);
                    wireframeMesh.visible = false;
                    proxy.add(wireframeMesh); // Add wireframe as a child of the original mesh
                }

                this.renderProxyVertices(proxy1Vertices, areHelpersOn);
                this.renderProxyVertices(proxy2Vertices, areHelpersOn);
                this.renderProxyVertices(proxyOriginal1Vertices, areHelpersOn);
                this.renderProxyVertices(proxyOriginal2Vertices, areHelpersOn);
            }
  
        }

        if(this.xzJointDirection == "inwards") {
            this.alignProxyMediansInwards(intersection); 
        }
        else if(this.xzJointDirection == "outwards") {
            this.alignProxyMediansOutwards(intersection); 
        }
                         
  
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                const proxyMedianVertices = this.mapProxyVertices(duct.segment.duct.userData.proxies.proxyMedian);
                duct.segment.duct.userData.proxyMedianVertices = proxyMedianVertices;
                this.renderProxyVertices(proxyMedianVertices, areHelpersOn);
            }
        }

        return largestGlobalSize;
    }

    calculateAdjacentContext(intersection, largestGlobalSize, definedIntersectionCount) {

        let ductSize1 = 0;
        let ductSize2 = 0;
        const selectedSize = this.xzJointYDirection;
        let sizes = {
            inwards: null,
            outwards: null
        }

        function compareSizes(sizes, ductSize1, ductSize2) {
            if(ductSize2 < ductSize1) {
                sizes.inwards = ductSize2;
                sizes.outwards = ductSize1;
            }
            else {
                sizes.outwards = ductSize2;
                sizes.inwards = ductSize1;
            }
        }

        for(const key in intersection) {
            if(intersection[key] != null) {
                intersection[key].proxyLengths = {
                    proxy1: largestGlobalSize,
                    proxy2: largestGlobalSize,
                    proxyMedian: largestGlobalSize
                };
            }
        }

        if(this.xzJointContext == "global") {
            return;
        }

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.down != null) {
                return
            }
            if(intersection.left != null && intersection.right != null) {
                return
            }
        }

        if(this.xzJointYStyle == "diagonal") {
            for(const key in intersection) {
                if(intersection[key] != null) {
                    const currentSize = this.innerDuctDimensions[intersection[key].xetoDuct.graphicLocation.size];
                    intersection[key].proxyLengths.proxy1 = currentSize;
                    intersection[key].proxyLengths.proxy2 = currentSize;
                }
            }

            if(intersection.up != null && intersection.left != null) {
                ductSize1 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
                ductSize2 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
    
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if(intersection.left != null && intersection.down != null) {
                ductSize1 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
                ductSize2 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
    
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if(intersection.down != null && intersection.right != null) {
                ductSize1 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
                ductSize2 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
    
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if(intersection.right != null && intersection.up != null) {
                ductSize1 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
                ductSize2 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
    
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            
        }
        else if(this.xzJointYStyle == "orthogonal") {
            
            if(definedIntersectionCount == 4) {

                //////////////////
                // up-left proxies
                //////////////////
    
                ductSize1 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
                ductSize2 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
    
                compareSizes(sizes, ductSize1, ductSize2);
    
                intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
    
                //////////////////
                // down-left proxies
                //////////////////
                
                ductSize1 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
                ductSize2 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
    
                compareSizes(sizes, ductSize1, ductSize2)
    
                intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.down.proxyLengths.proxy1 = sizes[selectedSize];
    
                //////////////////
                // down-right proxies
                //////////////////
                
                ductSize1 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
                ductSize2 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
    
                compareSizes(sizes, ductSize1, ductSize2);
    
                intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
    
                //////////////////
                // up-right proxies
                //////////////////
                
                ductSize1 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
                ductSize2 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
    
                compareSizes(sizes, ductSize1, ductSize2);
    
                intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
            }
            else if(definedIntersectionCount == 3) {
    
                //////////////////
                // up-left proxies
                //////////////////
    
                if(intersection.up != null && intersection.left != null) {
                    ductSize1 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
                }
    
                //////////////////
                // down-left proxies
                //////////////////
    
                if(intersection.left != null && intersection.down != null) {
                    ductSize1 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2)
    
                    intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.down.proxyLengths.proxy1 = sizes[selectedSize];
                }
    
                //////////////////
                // down-right proxies
                //////////////////
    
                if(intersection.down != null && intersection.right != null) {
                    ductSize1 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
                }
    
                //////////////////
                // up-right proxies
                //////////////////
    
                if(intersection.right != null && intersection.up != null) {
                    ductSize1 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                }
    
                //////////////////
                // up-down proxies
                //////////////////
    
                if(intersection.left == null) {
                    ductSize1 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                }
                // if(intersection.up != null && intersection.down != null) {
                //     ductSize1 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
                //     ductSize2 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
    
                //     compareSizes(sizes, ductSize1, ductSize2);
    
                //     intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                //     intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                //     intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                // }

                //////////////////
                // left-right proxies
                //////////////////
    
                if(intersection.down == null) {
                    ductSize1 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
                }
                else if(intersection.up == null) {
                    ductSize1 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                }
                
            }
            else if(definedIntersectionCount == 2) {
    
                //////////////////
                // up-left proxies
                //////////////////
    
                if(intersection.up != null && intersection.left != null) {
                    ductSize1 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
                }
    
                //////////////////
                // down-left proxies
                //////////////////
    
                if(intersection.left != null && intersection.down != null) {
                    ductSize1 = this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2)
    
                    intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.down.proxyLengths.proxy1 = sizes[selectedSize];
                }
    
                //////////////////
                // down-right proxies
                //////////////////
    
                if(intersection.down != null && intersection.right != null) {
                    ductSize1 = this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
                }
    
                //////////////////
                // up-right proxies
                //////////////////
    
                if(intersection.right != null && intersection.up != null) {
                    ductSize1 = this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size];
                    ductSize2 = this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size];
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                }
                
            }
        }

    }

    moveOriginalProxyVertices(proxyGeometry) {
        // Access the position attribute
        const positionAttribute = proxyGeometry.attributes.position;
    
        for (let i = 0; i < positionAttribute.count; i++) {
            const y = positionAttribute.getY(i);
    
            if (y < 0.5) {
                positionAttribute.setY(i, 0);
            }
        }
    
        // Mark the position attribute as needing an update
        positionAttribute.needsUpdate = true;
    }

    moveProxyVertices(proxyGeometry, ductDepth, proxyLength, maxLength) {

        const globalLength = ((maxLength - ductDepth) / 2);
        const adjacentLength = ((proxyLength - ductDepth) / 2);
    
        // Access the position attribute
        const positionAttribute = proxyGeometry.attributes.position;
    
        for (let i = 0; i < positionAttribute.count; i++) {
            const y = positionAttribute.getY(i);
    
            // Move vertices with y > 0.5 upwards by "globalLength/adjacentLength" units
            if (y > 0.5) {
                positionAttribute.setY(i, y + globalLength + 30);
            }
            else if (y < 0.5) {
                positionAttribute.setY(i, y - adjacentLength - 30);
            }
        }
    
        // Mark the position attribute as needing an update
        positionAttribute.needsUpdate = true;
    }

    createGeometryFromPoints(pointA, pointB, pointC, pointD) {
        
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

    alignProxyMediansInwards(intersection) {
        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        let upProxies, rightProxies, leftProxies, downProxies = null;

        if(intersection.up) {
            upProxies =  intersection.up.segment.duct.userData.proxies;
        }
        if(intersection.right) {
            rightProxies =  intersection.right.segment.duct.userData.proxies;
        }
        if(intersection.left) {
            leftProxies =  intersection.left.segment.duct.userData.proxies;
        }
        if(intersection.down) {
            downProxies =  intersection.down.segment.duct.userData.proxies;
        }

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {

                upProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {

                    const distances = {
                        right: {
                            x: Math.abs(rightProxies.proxyMedian.position.x - rightProxies.proxy1.position.x),
                            z: Math.abs(rightProxies.proxyMedian.position.z - upProxies.proxy2.position.z)
                        }
                    }
    
                    if(distances.right.x > distances.right.z) {
                        rightProxies.proxyMedian.position.x += distances.right.z;
                    }
                    else if(distances.right.x <= distances.right.z) {
                        rightProxies.proxyMedian.position.z += distances.right.x;
                    }

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += this.xzJointPadding;
                    const medianClone = upProxies.proxyMedian.clone();
                    medianClone.position.x += medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.up.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    this.sceneHelper.addToScene(medianClone);
                    upProxies.proxyMedian.position.z += medianOffset;
                }
            }
            else if(intersection.down != null && intersection.right != null) {
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                rightProxies.proxyMedian.position.x = downProxies.proxy1.position.x;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        down: {
                            x: Math.abs(downProxies.proxyMedian.position.x - rightProxies.proxy2.position.x),
                            z: Math.abs(downProxies.proxyMedian.position.z - downProxies.proxy2.position.z)
                        },
                    }
                    if(distances.down.x > distances.down.z) {
                        downProxies.proxyMedian.position.x += distances.down.z;
                    }
                    else if(distances.down.x <= distances.down.z) {
                        downProxies.proxyMedian.position.z -= distances.down.x;
                    }

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += this.xzJointPadding;
                    const medianClone = rightProxies.proxyMedian.clone();
                    medianClone.position.x += medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.right.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    this.sceneHelper.addToScene(medianClone);
                    rightProxies.proxyMedian.position.z -= medianOffset;
                }
            }
            else if(intersection.up != null && intersection.left != null) {
                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                leftProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        up: {
                            x: Math.abs(upProxies.proxyMedian.position.x - leftProxies.proxy1.position.x),
                            z: Math.abs(upProxies.proxyMedian.position.z - upProxies.proxy1.position.z)
                        }
                    }
    
                    if(distances.up.x > distances.up.z) {
                        upProxies.proxyMedian.position.x -= distances.up.z;
                    }
                    else if(distances.up.x <= distances.up.z) {
                        upProxies.proxyMedian.position.z += distances.up.x;
                    }

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += this.xzJointPadding;
                    const medianClone = leftProxies.proxyMedian.clone();
                    medianClone.position.x -= medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.left.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    this.sceneHelper.addToScene(medianClone);
                    leftProxies.proxyMedian.position.z += medianOffset;
                }
            }
            else if(intersection.down != null && intersection.left != null) {
                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        left: {
                            x: Math.abs(leftProxies.proxyMedian.position.x - leftProxies.proxy2.position.x),
                            z: Math.abs(leftProxies.proxyMedian.position.z - downProxies.proxy1.position.z)
                        }
                    }    
                    if(distances.left.x > distances.left.z) {
                        leftProxies.proxyMedian.position.x -= distances.left.z;
                    }
                    else if(distances.left.x <= distances.left.z) {
                        leftProxies.proxyMedian.position.z -= distances.left.x;
                    }

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += this.xzJointPadding;
                    const medianClone = downProxies.proxyMedian.clone();
                    medianClone.position.x -= medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.down.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    this.sceneHelper.addToScene(medianClone);
                    downProxies.proxyMedian.position.z -= medianOffset;
                }
            }

        }
        else if(definedIntersectionCount == 3) {
            if(intersection.right == null) {
                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]) {
                    downProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                }
                else {
                    downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                    downProxies.proxyMedian.position.z = upProxies.proxy2.position.z;
                }

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        left: {
                            x: Math.abs(leftProxies.proxyMedian.position.x - leftProxies.proxy2.position.x),
                            z: Math.abs(leftProxies.proxyMedian.position.z - downProxies.proxy1.position.z)
                        },
                        up: {
                            x: Math.abs(upProxies.proxyMedian.position.x - leftProxies.proxy1.position.x),
                            z: Math.abs(upProxies.proxyMedian.position.z - upProxies.proxy1.position.z)
                        },
                    }
    
                    if(distances.up.x > distances.up.z) {
                        upProxies.proxyMedian.position.x -= distances.up.z;
                    }
                    else if(distances.up.x <= distances.up.z) {
                        upProxies.proxyMedian.position.z += distances.up.x;
                    }
    
                    if(distances.left.x > distances.left.z) {
                        leftProxies.proxyMedian.position.x -= distances.left.z;
                    }
                    else if(distances.left.x <= distances.left.z) {
                        leftProxies.proxyMedian.position.z -= distances.left.x;
                    }

                    let cornerWidth = 0;
                    if(downProxies.proxyMedian.position.z == downProxies.proxy2.position.z) {
                        cornerWidth = downProxies.proxyMedian.position.x - downProxies.proxy2.position.x;
                    }
                    else {
                        cornerWidth = downProxies.proxyMedian.position.x - upProxies.proxy2.position.x;
                        cornerWidth *= -1;
                    }

                    downProxies.proxyMedian.position.z += cornerWidth;
                }

            }
            else if(intersection.left == null) {
                if(this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]) {
                    upProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                }
                else {
                    upProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                }
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;  
                
                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        down: {
                            x: Math.abs(downProxies.proxyMedian.position.x - rightProxies.proxy2.position.x),
                            z: Math.abs(downProxies.proxyMedian.position.z - downProxies.proxy2.position.z)
                        },
                        right: {
                            x: Math.abs(rightProxies.proxyMedian.position.x - rightProxies.proxy1.position.x),
                            z: Math.abs(rightProxies.proxyMedian.position.z - upProxies.proxy2.position.z)
                        }
                    }
                    if(distances.down.x > distances.down.z) {
                        downProxies.proxyMedian.position.x += distances.down.z;
                    }
                    else if(distances.down.x <= distances.down.z) {
                        downProxies.proxyMedian.position.z -= distances.down.x;
                    }
    
                    if(distances.right.x > distances.right.z) {
                        rightProxies.proxyMedian.position.x += distances.right.z;
                    }
                    else if(distances.right.x <= distances.right.z) {
                        rightProxies.proxyMedian.position.z += distances.right.x;
                    }

                    let cornerWidth = 0;
                    if(upProxies.proxyMedian.position.z == upProxies.proxy1.position.z) {
                        cornerWidth = upProxies.proxyMedian.position.x - upProxies.proxy1.position.x;
                    }
                    else {
                        cornerWidth = upProxies.proxyMedian.position.x - downProxies.proxy1.position.x;
                        cornerWidth *= -1;
                    }

                    upProxies.proxyMedian.position.z += cornerWidth;
                }
            }
            else if(intersection.down == null) {
                if(this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size]) {
                    leftProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                    leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                }
                else {
                    leftProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                } 

                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        up: {
                            x: Math.abs(upProxies.proxyMedian.position.x - leftProxies.proxy1.position.x),
                            z: Math.abs(upProxies.proxyMedian.position.z - upProxies.proxy1.position.z)
                        },
                        right: {
                            x: Math.abs(rightProxies.proxyMedian.position.x - rightProxies.proxy1.position.x),
                            z: Math.abs(rightProxies.proxyMedian.position.z - upProxies.proxy2.position.z)
                        }
                    }
    
                    if(distances.right.x > distances.right.z) {
                        rightProxies.proxyMedian.position.x += distances.right.z;
                    }
                    else if(distances.right.x <= distances.right.z) {
                        rightProxies.proxyMedian.position.z += distances.right.x;
                    }
    
                    if(distances.up.x > distances.up.z) {
                        upProxies.proxyMedian.position.x -= distances.up.z;
                    }
                    else if(distances.up.x <= distances.up.z) {
                        upProxies.proxyMedian.position.z += distances.up.x;
                    }

                    let cornerWidth = 0;
                    if(leftProxies.proxy2.position.x == leftProxies.proxyMedian.position.x) {
                        cornerWidth = leftProxies.proxy2.position.z - leftProxies.proxyMedian.position.z;
                    }
                    else {
                        cornerWidth = rightProxies.proxy2.position.z - leftProxies.proxyMedian.position.z;
                        cornerWidth *= -1;
                    }

                    leftProxies.proxyMedian.position.x += cornerWidth;
                }
                
            }
            else if(intersection.up == null) {
                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                if(this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size]) {
                    rightProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                }
                else {
                    rightProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;
                }

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        down: {
                            x: Math.abs(downProxies.proxyMedian.position.x - rightProxies.proxy2.position.x),
                            z: Math.abs(downProxies.proxyMedian.position.z - downProxies.proxy2.position.z)
                        },
                        left: {
                            x: Math.abs(leftProxies.proxyMedian.position.x - leftProxies.proxy2.position.x),
                            z: Math.abs(leftProxies.proxyMedian.position.z - downProxies.proxy1.position.z)
                        },
                    }
                    if(distances.down.x > distances.down.z) {
                        downProxies.proxyMedian.position.x += distances.down.z;
                    }
                    else if(distances.down.x <= distances.down.z) {
                        downProxies.proxyMedian.position.z -= distances.down.x;
                    }
    
                    if(distances.left.x > distances.left.z) {
                        leftProxies.proxyMedian.position.x -= distances.left.z;
                    }
                    else if(distances.left.x <= distances.left.z) {
                        leftProxies.proxyMedian.position.z -= distances.left.x;
                    }

                    let cornerWidth = 0;
                    if(leftProxies.proxy1.position.x == rightProxies.proxyMedian.position.x) {
                        cornerWidth = leftProxies.proxy1.position.z - rightProxies.proxyMedian.position.z;
                        cornerWidth *= -1;
                    }
                    else {
                        cornerWidth = rightProxies.proxyMedian.position.z - rightProxies.proxy1.position.z;
                        cornerWidth *= -1;
                    }

                    rightProxies.proxyMedian.position.x += cornerWidth;
                }
            }
        }
        else if(definedIntersectionCount == 4) {
            // top-left median
            upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
            // bottom-right median
            downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
            downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
            // bottom-left median
            leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
            leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
            // top-right median
            rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;

            if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                const distances = {
                    down: {
                        x: Math.abs(downProxies.proxyMedian.position.x - rightProxies.proxy2.position.x),
                        z: Math.abs(downProxies.proxyMedian.position.z - downProxies.proxy2.position.z)
                    },
                    left: {
                        x: Math.abs(leftProxies.proxyMedian.position.x - leftProxies.proxy2.position.x),
                        z: Math.abs(leftProxies.proxyMedian.position.z - downProxies.proxy1.position.z)
                    },
                    up: {
                        x: Math.abs(upProxies.proxyMedian.position.x - leftProxies.proxy1.position.x),
                        z: Math.abs(upProxies.proxyMedian.position.z - upProxies.proxy1.position.z)
                    },
                    right: {
                        x: Math.abs(rightProxies.proxyMedian.position.x - rightProxies.proxy1.position.x),
                        z: Math.abs(rightProxies.proxyMedian.position.z - upProxies.proxy2.position.z)
                    }
                }
                if(distances.down.x > distances.down.z) {
                    downProxies.proxyMedian.position.x += distances.down.z;
                    downProxies.proxyMedian.userData.isDiagonal = true;
                    downProxies.proxyMedian.userData.diagonalWidth = distances.down.z;
                    downProxies.proxyMedian.userData.arcOrigin = {
                        x: downProxies.proxyMedian.position.x,
                        z: downProxies.proxy2.position.z
                    }
                    
                }
                else if(distances.down.x <= distances.down.z) {
                    downProxies.proxyMedian.position.z -= distances.down.x;
                    downProxies.proxyMedian.userData.isDiagonal = true;
                    downProxies.proxyMedian.userData.diagonalWidth = distances.down.x;
                    downProxies.proxyMedian.userData.arcOrigin = {
                        x: downProxies.proxy2.position.x,
                        z: downProxies.proxyMedian.position.z
                    }
                }

                if(distances.right.x > distances.right.z) {
                    rightProxies.proxyMedian.position.x += distances.right.z;
                    rightProxies.proxyMedian.userData.isDiagonal = true;
                    rightProxies.proxyMedian.userData.diagonalWidth = distances.right.z;
                    rightProxies.proxyMedian.userData.arcOrigin = {
                        x: rightProxies.proxy2.position.x,
                        z: rightProxies.proxyMedian.position.z
                    }
                }
                else if(distances.right.x <= distances.right.z) {
                    rightProxies.proxyMedian.position.z += distances.right.x;
                    rightProxies.proxyMedian.userData.isDiagonal = true;
                    rightProxies.proxyMedian.userData.diagonalWidth = distances.right.x;
                    rightProxies.proxyMedian.userData.arcOrigin = {
                        x: rightProxies.proxy2.position.x,
                        z: rightProxies.proxyMedian.position.z
                    }
                }

                if(distances.up.x > distances.up.z) {
                    upProxies.proxyMedian.position.x -= distances.up.z;
                    upProxies.proxyMedian.userData.isDiagonal = true;
                    upProxies.proxyMedian.userData.diagonalWidth = distances.up.z;
                    upProxies.proxyMedian.userData.arcOrigin = {
                        x: leftProxies.proxy2.position.x,
                        z: upProxies.proxyMedian.position.z
                    }
                }
                else if(distances.up.x <= distances.up.z) {
                    upProxies.proxyMedian.position.z += distances.up.x;
                    upProxies.proxyMedian.userData.isDiagonal = true;
                    upProxies.proxyMedian.userData.diagonalWidth = distances.up.x;
                    upProxies.proxyMedian.userData.arcOrigin = {
                        x: leftProxies.proxy2.position.x,
                        z: upProxies.proxyMedian.position.z
                    }
                }

                if(distances.left.x > distances.left.z) {
                    leftProxies.proxyMedian.position.x -= distances.left.z;
                    leftProxies.proxyMedian.userData.isDiagonal = true;
                    leftProxies.proxyMedian.userData.diagonalWidth = distances.left.z;
                    leftProxies.proxyMedian.userData.arcOrigin = {
                        x: leftProxies.proxy2.position.x,
                        z: leftProxies.proxyMedian.position.z
                    }
                }
                else if(distances.left.x <= distances.left.z) {
                    leftProxies.proxyMedian.position.z -= distances.left.x;
                    leftProxies.proxyMedian.userData.isDiagonal = true;
                    leftProxies.proxyMedian.userData.diagonalWidth = distances.left.x;
                    leftProxies.proxyMedian.userData.arcOrigin = {
                        x: leftProxies.proxy2.position.x,
                        z: leftProxies.proxyMedian.position.z
                    }
                }
            }
        }
    }

    alignProxyMediansOutwards(intersection) {        
        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        let upProxies, rightProxies, leftProxies, downProxies = null;

        if(intersection.up) {
            upProxies =  intersection.up.segment.duct.userData.proxies;
        }
        if(intersection.right) {
            rightProxies =  intersection.right.segment.duct.userData.proxies;
        }
        if(intersection.left) {
            leftProxies =  intersection.left.segment.duct.userData.proxies;
        }
        if(intersection.down) {
            downProxies =  intersection.down.segment.duct.userData.proxies;
        }

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {
                upProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        right: {
                            x: Math.abs(rightProxies.proxyMedian.position.x - upProxies.proxy2.position.x),
                            z: Math.abs(rightProxies.proxyMedian.position.z - rightProxies.proxy1.position.z)
                        }
                    }
    
                    if(distances.right.x > distances.right.z) {
                        rightProxies.proxyMedian.position.x -= distances.right.z;
                    }
                    else if(distances.right.x <= distances.right.z) {
                        rightProxies.proxyMedian.position.z -= distances.right.x;
                    }

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += this.xzJointPadding;
                    const medianClone = upProxies.proxyMedian.clone();
                    medianClone.position.x += medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.up.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    this.sceneHelper.addToScene(medianClone);
                    upProxies.proxyMedian.position.z += medianOffset;

                }
            }
            else if(intersection.down != null && intersection.right != null) {
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                rightProxies.proxyMedian.position.x = downProxies.proxy1.position.x;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        down: {
                            x: Math.abs(downProxies.proxyMedian.position.x - downProxies.proxy2.position.x),
                            z: Math.abs(downProxies.proxyMedian.position.z - rightProxies.proxy2.position.z)
                        }
                    }
                    if(distances.down.x > distances.down.z) {
                        downProxies.proxyMedian.position.x -= distances.down.z;
                    }
                    else if(distances.down.x <= distances.down.z) {
                        downProxies.proxyMedian.position.z += distances.down.x;
                    }

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += this.xzJointPadding;
                    const medianClone = rightProxies.proxyMedian.clone();
                    medianClone.position.x += medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.right.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    this.sceneHelper.addToScene(medianClone);
                    rightProxies.proxyMedian.position.z -= medianOffset;
                }
            }
            else if(intersection.up != null && intersection.left != null) {
                upProxies.proxyMedian.position.x = leftProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        up: {
                            x: Math.abs(upProxies.proxyMedian.position.x - upProxies.proxy1.position.x),
                            z: Math.abs(upProxies.proxyMedian.position.z - leftProxies.proxy1.position.z)
                        }
                    }
    
                    if(distances.up.x > distances.up.z) {
                        upProxies.proxyMedian.position.x += distances.up.z;
                    }
                    else if(distances.up.x <= distances.up.z) {
                        upProxies.proxyMedian.position.z -= distances.up.x;
                    }

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += this.xzJointPadding;
                    const medianClone = leftProxies.proxyMedian.clone();
                    medianClone.position.x -= medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.left.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    this.sceneHelper.addToScene(medianClone);
                    leftProxies.proxyMedian.position.z += medianOffset;
                }
            }
            else if(intersection.down != null && intersection.left != null) {
                leftProxies.proxyMedian.position.z = downProxies.proxy1.position.z;
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                
                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        left: {
                            x: Math.abs(leftProxies.proxyMedian.position.x - downProxies.proxy1.position.x),
                            z: Math.abs(leftProxies.proxyMedian.position.z - leftProxies.proxy2.position.z)
                        },
                    }    
                    if(distances.left.x > distances.left.z) {
                        leftProxies.proxyMedian.position.x += distances.left.z;
                    }
                    else if(distances.left.x <= distances.left.z) {
                        leftProxies.proxyMedian.position.z += distances.left.x;
                    }

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += this.xzJointPadding;
                    const medianClone = downProxies.proxyMedian.clone();
                    medianClone.position.x -= medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.down.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    this.sceneHelper.addToScene(medianClone);
                    downProxies.proxyMedian.position.z -= medianOffset;
                }
            }
        }
        else if(definedIntersectionCount == 3) {
            
            if(intersection.right == null) {
                upProxies.proxyMedian.position.x = leftProxies.proxyMedian.position.x;
                leftProxies.proxyMedian.position.z = downProxies.proxyMedian.position.z;

                if(this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]) {
                    downProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                }
                else {
                    downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                    downProxies.proxyMedian.position.z = upProxies.proxy2.position.z;
                }

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        left: {
                            x: Math.abs(leftProxies.proxyMedian.position.x - downProxies.proxy1.position.x),
                            z: Math.abs(leftProxies.proxyMedian.position.z - leftProxies.proxy2.position.z)
                        },
                        up: {
                            x: Math.abs(upProxies.proxyMedian.position.x - upProxies.proxy1.position.x),
                            z: Math.abs(upProxies.proxyMedian.position.z - leftProxies.proxy1.position.z)
                        },
                    }
    
                    if(distances.up.x > distances.up.z) {
                        upProxies.proxyMedian.position.x += distances.up.z;
                    }
                    else if(distances.up.x <= distances.up.z) {
                        upProxies.proxyMedian.position.z -= distances.up.x;
                    }
    
                    if(distances.left.x > distances.left.z) {
                        leftProxies.proxyMedian.position.x += distances.left.z;
                    }
                    else if(distances.left.x <= distances.left.z) {
                        leftProxies.proxyMedian.position.z += distances.left.x;
                    }

                    let cornerWidth = 0;
                    if(downProxies.proxyMedian.position.z == downProxies.proxy2.position.z) {
                        cornerWidth = downProxies.proxyMedian.position.x - downProxies.proxy2.position.x;
                    }
                    else {
                        cornerWidth = downProxies.proxyMedian.position.x - upProxies.proxy2.position.x;
                        cornerWidth *= -1;
                    }

                    downProxies.proxyMedian.position.z += cornerWidth;
                }
            }
            else if(intersection.left == null) {
                if(this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]) {
                    upProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                }
                else {
                    upProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                }
                downProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;

                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;   
                
                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        down: {
                            x: Math.abs(downProxies.proxyMedian.position.x - downProxies.proxy2.position.x),
                            z: Math.abs(downProxies.proxyMedian.position.z - rightProxies.proxy2.position.z)
                        },
                        right: {
                            x: Math.abs(rightProxies.proxyMedian.position.x - upProxies.proxy2.position.x),
                            z: Math.abs(rightProxies.proxyMedian.position.z - rightProxies.proxy1.position.z)
                        }
                    }
                    if(distances.down.x > distances.down.z) {
                        downProxies.proxyMedian.position.x -= distances.down.z;
                    }
                    else if(distances.down.x <= distances.down.z) {
                        downProxies.proxyMedian.position.z += distances.down.x;
                    }
    
                    if(distances.right.x > distances.right.z) {
                        rightProxies.proxyMedian.position.x -= distances.right.z;
                    }
                    else if(distances.right.x <= distances.right.z) {
                        rightProxies.proxyMedian.position.z -= distances.right.x;
                    }

                    let cornerWidth = 0;
                    if(upProxies.proxyMedian.position.z == upProxies.proxy1.position.z) {
                        cornerWidth = upProxies.proxyMedian.position.x - upProxies.proxy1.position.x;
                    }
                    else {
                        cornerWidth = upProxies.proxyMedian.position.x - downProxies.proxy1.position.x;
                        cornerWidth *= -1;
                    }

                    upProxies.proxyMedian.position.z += cornerWidth;
                }
            }
            else if(intersection.down == null) {
                if(this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size]) {
                    leftProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                    leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                }
                else {
                    leftProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                } 

                upProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;

                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;

                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        up: {
                            x: Math.abs(upProxies.proxyMedian.position.x - upProxies.proxy1.position.x),
                            z: Math.abs(upProxies.proxyMedian.position.z - leftProxies.proxy1.position.z)
                        },
                        right: {
                            x: Math.abs(rightProxies.proxyMedian.position.x - upProxies.proxy2.position.x),
                            z: Math.abs(rightProxies.proxyMedian.position.z - rightProxies.proxy1.position.z)
                        }
                    }
                    if(distances.right.x > distances.right.z) {
                        rightProxies.proxyMedian.position.x -= distances.right.z;
                    }
                    else if(distances.right.x <= distances.right.z) {
                        rightProxies.proxyMedian.position.z -= distances.right.x;
                    }
    
                    if(distances.up.x > distances.up.z) {
                        upProxies.proxyMedian.position.x += distances.up.z;
                    }
                    else if(distances.up.x <= distances.up.z) {
                        upProxies.proxyMedian.position.z -= distances.up.x;
                    }

                    let cornerWidth = 0;
                    if(leftProxies.proxy2.position.x == leftProxies.proxyMedian.position.x) {
                        cornerWidth = leftProxies.proxy2.position.z - leftProxies.proxyMedian.position.z;
                    }
                    else {
                        cornerWidth = rightProxies.proxy2.position.z - leftProxies.proxyMedian.position.z;
                        cornerWidth *= -1;
                    }

                    leftProxies.proxyMedian.position.x += cornerWidth;
                }
                
            }
            else if(intersection.up == null) {
                leftProxies.proxyMedian.position.z = downProxies.proxy1.position.z;
                leftProxies.proxyMedian.position.x = leftProxies.proxy2.position.x;

                downProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;

                if(this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size]) {
                    rightProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                }
                else {
                    rightProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;
                } 
                
                if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                    const distances = {
                        down: {
                            x: Math.abs(downProxies.proxyMedian.position.x - downProxies.proxy2.position.x),
                            z: Math.abs(downProxies.proxyMedian.position.z - rightProxies.proxy2.position.z)
                        },
                        left: {
                            x: Math.abs(leftProxies.proxyMedian.position.x - downProxies.proxy1.position.x),
                            z: Math.abs(leftProxies.proxyMedian.position.z - leftProxies.proxy2.position.z)
                        },
                    }
                    if(distances.down.x > distances.down.z) {
                        downProxies.proxyMedian.position.x -= distances.down.z;
                    }
                    else if(distances.down.x <= distances.down.z) {
                        downProxies.proxyMedian.position.z += distances.down.x;
                    }
    
                    if(distances.left.x > distances.left.z) {
                        leftProxies.proxyMedian.position.x += distances.left.z;
                    }
                    else if(distances.left.x <= distances.left.z) {
                        leftProxies.proxyMedian.position.z += distances.left.x;
                    }

                    let cornerWidth = 0;
                    if(leftProxies.proxy1.position.x == rightProxies.proxyMedian.position.x) {
                        cornerWidth = leftProxies.proxy1.position.z - rightProxies.proxyMedian.position.z;
                        cornerWidth *= -1;
                    }
                    else {
                        cornerWidth = rightProxies.proxyMedian.position.z - rightProxies.proxy1.position.z;
                        cornerWidth *= -1;
                    }

                    rightProxies.proxyMedian.position.x += cornerWidth;
                }
            }
        }
        else if(definedIntersectionCount == 4) {
            // top-left median
            upProxies.proxyMedian.position.x = leftProxies.proxyMedian.position.x;
            // bottom-right median
            downProxies.proxyMedian.position.x = rightProxies.proxyMedian.position.x;
            // bottom-right median
            leftProxies.proxyMedian.position.z = downProxies.proxyMedian.position.z;
            // top-right median
            rightProxies.proxyMedian.position.z = upProxies.proxyMedian.position.z;

            if(this.xzJointStyle == "diagonal" || this.xzJointStyle == "arc") {
                const distances = {
                    down: {
                        x: Math.abs(downProxies.proxyMedian.position.x - downProxies.proxy2.position.x),
                        z: Math.abs(downProxies.proxyMedian.position.z - rightProxies.proxy2.position.z)
                    },
                    left: {
                        x: Math.abs(leftProxies.proxyMedian.position.x - downProxies.proxy1.position.x),
                        z: Math.abs(leftProxies.proxyMedian.position.z - leftProxies.proxy2.position.z)
                    },
                    up: {
                        x: Math.abs(upProxies.proxyMedian.position.x - upProxies.proxy1.position.x),
                        z: Math.abs(upProxies.proxyMedian.position.z - leftProxies.proxy1.position.z)
                    },
                    right: {
                        x: Math.abs(rightProxies.proxyMedian.position.x - upProxies.proxy2.position.x),
                        z: Math.abs(rightProxies.proxyMedian.position.z - rightProxies.proxy1.position.z)
                    }
                }
                if(distances.down.x > distances.down.z) {
                    downProxies.proxyMedian.position.x -= distances.down.z;
                }
                else if(distances.down.x <= distances.down.z) {
                    downProxies.proxyMedian.position.z += distances.down.x;
                }

                if(distances.right.x > distances.right.z) {
                    rightProxies.proxyMedian.position.x -= distances.right.z;
                }
                else if(distances.right.x <= distances.right.z) {
                    rightProxies.proxyMedian.position.z -= distances.right.x;
                }

                if(distances.up.x > distances.up.z) {
                    upProxies.proxyMedian.position.x += distances.up.z;
                }
                else if(distances.up.x <= distances.up.z) {
                    upProxies.proxyMedian.position.z -= distances.up.x;
                }

                if(distances.left.x > distances.left.z) {
                    leftProxies.proxyMedian.position.x += distances.left.z;
                }
                else if(distances.left.x <= distances.left.z) {
                    leftProxies.proxyMedian.position.z += distances.left.x;
                }
            }
        }
    }

    mapProxyVertices(proxy) {
        const detachedProxy = proxy.clone();
        const proxyBB = new THREE.Box3().setFromObject(detachedProxy);
        const proxyMin = proxyBB.min;
        const proxyMax = proxyBB.max;
  
        const proxyCorners = [
          new THREE.Vector3(proxyMin.x, proxyMin.y, proxyMax.z),
          new THREE.Vector3(proxyMin.x, proxyMin.y, proxyMin.z),
          new THREE.Vector3(proxyMax.x, proxyMin.y, proxyMin.z),
          new THREE.Vector3(proxyMax.x, proxyMin.y, proxyMax.z),
  
          new THREE.Vector3(proxyMin.x, proxyMax.y, proxyMax.z),
          new THREE.Vector3(proxyMin.x, proxyMax.y, proxyMin.z),
          new THREE.Vector3(proxyMax.x, proxyMax.y, proxyMin.z),
          new THREE.Vector3(proxyMax.x, proxyMax.y, proxyMax.z),
        ];
  
        return proxyCorners;
    }

    renderProxyVertices(proxyCorners, areHelpersOn) {

        let indicatorSize = 27;
        if(indicatorSize > 30) {
            indicatorSize = 30;
        }

        const createTextCanvasTexture = (text) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const size = 1000; // Higher size for better resolution
            canvas.width = size;
            canvas.height = size;

            // Fill the canvas with a background color
            context.fillStyle = 'green';
            context.fillRect(0, 0, size, size);

            // Draw the text
            context.fillStyle = 'black';
            context.font = 'bold 800px Arial'; // Adjust font size and style
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, size / 2, size / 2);

            // Create a texture from the canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true; // Ensure the texture is updated
            return texture;
        };

        proxyCorners.forEach((proxyCorner, index) => {
            const textTexture = createTextCanvasTexture(index.toString());

            const material = new THREE.MeshStandardMaterial({
                map: textTexture,
                transparent: true,
            });

            const vertexGeometry = new THREE.BoxGeometry(indicatorSize, indicatorSize, indicatorSize);
            const vertexIndicator = new THREE.Mesh(vertexGeometry, material);

            if(index >= 4 && index <= 7) {
                vertexIndicator.rotation.y += Math.PI;
            }            

            vertexIndicator.position.copy(proxyCorner);
            vertexIndicator.name = "jointHelperVertices";
            vertexIndicator.visible = areHelpersOn;
            this.sceneHelper.addToScene(vertexIndicator);
        });
        
    }

    removeUVAttribute(geometry) {
        if (geometry.attributes.uv) {
            geometry.deleteAttribute('uv');
        }
    }

    createJointBackwall(points, largestGlobalSize = 1000) {
        console.log("createJointBackwall started:", points);
        if (points.length < 3) {
            throw new Error("A shape requires at least 3 points.");
        }

        const wallThickness = 30;
    
        // Ensure the points are flattened into 2D (projected onto XZ plane)
        const shapePoints = points.map(point => new THREE.Vector2(point.x, point.z));

        // Create a THREE.Shape from the points
        const shape = new THREE.Shape(shapePoints);

        // Create ExtrudeGeometry to add thickness to the shape
        const extrudeSettings = {
            depth: wallThickness, // Thickness of the extrusion
            bevelEnabled: false, // No bevel for a straight extrusion
        };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Create the material and mesh
        const material = new THREE.MeshStandardMaterial({ color: this.primaryColor, side: THREE.DoubleSide, opacity: 1.0 });
        const mesh = new THREE.Mesh(geometry, material);

        // Rotate and position the mesh
        mesh.rotation.x = Math.PI / 2;
        mesh.position.y += (largestGlobalSize / 2) - 15;

        mesh.position.y += wallThickness;

        mesh.name = "joint";

        // Add an optional wireframe
        const wireframe = new THREE.WireframeGeometry(mesh.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000 
        });

        // Enable depth testing and set render order to ensure visibility
        lineMaterial.depthTest = false; // Makes sure the wireframe is rendered on top
        lineMaterial.renderOrder = 3;  // Prioritize rendering order (higher values render later)
        // lineMaterial.opacity = 0.3;

        // Create the wireframe mesh
        const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);
        wireframeMesh.visible = false; // Set visibility based on your requirements
        mesh.add(wireframeMesh); // Add wireframe as a child of the original mesh

        // Ensure the original mesh is rendered with a slight polygon offset
        // mesh.material.polygonOffset = true;
        // mesh.material.polygonOffsetFactor = 2; // Adjust this value as needed
        // mesh.material.polygonOffsetUnits = 5;  // Fine-tune offset to prevent Z-fighting

        this.sceneHelper.addToScene(mesh);
    }

    connectProxiesHorizontally(leftProxy, rightProxy) {
        const geometries = [];

        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[2],
                rightProxy[1],
                rightProxy[6],
                leftProxy[6]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[0],
                rightProxy[0],
                rightProxy[4],
                leftProxy[4]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[3],
                rightProxy[0],
                rightProxy[1],
                leftProxy[2]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[4],
                rightProxy[7],
                rightProxy[6],
                leftProxy[5]
            )
        );

        return geometries;
    }

    connectProxiesVertically(topProxy, bottomProxy) {
        const geometries = [];

        const vectors = [topProxy[0], bottomProxy[0]];
        
        if (topProxy[0].y !== bottomProxy[0].y) {
            console.log("connectProxiesVertically vectors:", JSON.stringify(vectors, null, 2));

            let yMinTopProxy = topProxy[0].y;
            let yMaxTopProxy = topProxy[0].y;
            for(const vector of topProxy) {
                if(vector.y < yMinTopProxy) {
                    yMinTopProxy = vector.y;
                }
                else if(vector.y > yMinTopProxy) {
                    yMaxTopProxy = vector.y;
                }
            }
            const topProxyLength = Math.abs(yMinTopProxy - yMaxTopProxy);
            console.log("connectProxiesVertically topProxyLength:", topProxyLength);

            console.log("connectProxiesVertically bottomProxy:", bottomProxy);
            let yMinBottomProxy = bottomProxy[0].y;
            let yMaxBottomProxy = bottomProxy[0].y;
            for(const vector of bottomProxy) {
                if(vector.y < yMinBottomProxy) {
                    yMinBottomProxy = vector.y;
                }
                else if(vector.y > yMinTopProxy) {
                    yMaxBottomProxy = vector.y;
                }
            }
            const bottomProxyLength = Math.abs(yMinBottomProxy - yMaxBottomProxy);
            console.log("connectProxiesVertically bottomProxyLength:", bottomProxyLength);

            const material = new THREE.MeshStandardMaterial({
                color: 0xFF0000,
                side: THREE.DoubleSide,
            });
            const material2 = new THREE.MeshStandardMaterial({
                color: 0x0000FF,
                side: THREE.DoubleSide,
            });
            const cubeGeometry = new THREE.BoxGeometry(27, 27, 27);
            const frontLeftPoint = new THREE.Mesh(cubeGeometry, material);
            frontLeftPoint.name = "jointHelperVertices";

            const longestProxyPosition = topProxy[0].y < bottomProxy[0].y ? topProxy[0] : bottomProxy[0];
            frontLeftPoint.position.copy(longestProxyPosition);

            const length = Math.abs(topProxyLength - bottomProxyLength);
            console.log("connectProxiesVertically length:", length);

            frontLeftPoint.position.z -= length;
            frontLeftPoint.position.y += length;

            const frontRightPoint = frontLeftPoint.clone();
            frontRightPoint.position.x += 30;

            const backLeftPoint = frontLeftPoint.clone();  
            backLeftPoint.material = material2;

            backLeftPoint.position.y = topProxy[4].y;

            const backRightPoint = backLeftPoint.clone();  
            backRightPoint.position.x += 30; 

            // this.sceneHelper.addToScene(frontLeftPoint);
            // this.sceneHelper.addToScene(frontRightPoint);

            // this.sceneHelper.addToScene(backLeftPoint);
            // this.sceneHelper.addToScene(backRightPoint);

            geometries.push(
                this.createGeometryFromPoints(
                    topProxy[1],
                    frontLeftPoint.position,
                    frontRightPoint.position,
                    topProxy[2]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    frontLeftPoint.position,
                    bottomProxy[0],
                    bottomProxy[3],
                    frontRightPoint.position,
                )
            );

            geometries.push(
                this.createGeometryFromPoints(
                    topProxy[2],
                    frontRightPoint.position,
                    backRightPoint.position,
                    topProxy[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    frontRightPoint.position,
                    bottomProxy[3],
                    bottomProxy[7],
                    backRightPoint.position
                )
            );

            geometries.push(
                this.createGeometryFromPoints(
                    topProxy[1],
                    frontLeftPoint.position,
                    backLeftPoint.position,
                    topProxy[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    frontLeftPoint.position,
                    bottomProxy[0],
                    bottomProxy[4],
                    backLeftPoint.position
                )
            );
        }
        else {
            geometries.push(
                this.createGeometryFromPoints(
                    topProxy[1],
                    bottomProxy[0],
                    bottomProxy[3],
                    topProxy[2]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    topProxy[2],
                    bottomProxy[3],
                    bottomProxy[7],
                    topProxy[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    topProxy[1],
                    bottomProxy[0],
                    bottomProxy[4],
                    topProxy[5]
                )
            );
        }
        

        return geometries;
    }

    calculateArc(leftProxy, rightProxy, flipArc = false, overrideRotation) {
        if(this.xzJointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {

            let jointCenter = this.jointCenter;

            let width = Math.abs(leftProxy[0].x - rightProxy[0].x);
            let length = leftProxy[7].y - leftProxy[0].y;
            const arc = this.createArc(width, length, flipArc);

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

            if(this.xzJointDirection == "outwards"){
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

            this.backwallArcConfigs[this.backwallArcConfigs.length-1].ring2.userData.position = arc.position.clone();
            this.backwallArcConfigs[this.backwallArcConfigs.length-1].ring2.userData.width = width;
            this.backwallArcConfigs[this.backwallArcConfigs.length-1].ring2.userData.rotation = arc.rotation;
            
        }
    }

    connectProxiesDiagonallyDownhill(leftProxy, rightProxy, flipArc = false, overrideRotation) {
        const geometries = [];

        if(this.xzJointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {
            this.calculateArc(leftProxy, rightProxy, flipArc, overrideRotation);
            return geometries;
        }

        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[1],
                rightProxy[1],
                rightProxy[3],
                leftProxy[3],
                leftProxy,
                rightProxy
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[5],
                rightProxy[5],
                rightProxy[7],
                leftProxy[7],
                leftProxy,
                rightProxy
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[1],
                leftProxy[5],
                rightProxy[5],
                rightProxy[1],
                leftProxy,
                rightProxy
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
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

    connectProxiesDiagonallyUphill(leftProxy, rightProxy, flipArc = false, overrideRotation) {
        const geometries = [];

        if(this.xzJointStyle == "arc" && (leftProxy[0].x != rightProxy[0].x && leftProxy[0].z != rightProxy[0].z)) {
            this.calculateArc(leftProxy, rightProxy, flipArc, overrideRotation);
            return geometries;
        }

        const vectors = [leftProxy[0], rightProxy[0]];

        // if (leftProxy[0].y !== rightProxy[0].y) {
        //     console.log("connectProxiesVertically vectors:", JSON.stringify(vectors, null, 2));

        //     let yMinLeftProxy = leftProxy[0].y;
        //     let yMaxLeftProxy = leftProxy[0].y;
        //     for(const vector of leftProxy) {
        //         if(vector.y < yMinLeftProxy) {
        //             yMinLeftProxy = vector.y;
        //         }
        //         else if(vector.y > yMinLeftProxy) {
        //             yMaxLeftProxy = vector.y;
        //         }
        //     }
        //     const leftProxyLength = Math.abs(yMinLeftProxy - yMaxLeftProxy);
        //     console.log("connectProxiesVertically leftProxyLength:", leftProxyLength);

        //     console.log("connectProxiesVertically rightProxy:", rightProxy);
        //     let yMinRightProxy = rightProxy[0].y;
        //     let yMaxRightProxy = rightProxy[0].y;
        //     for(const vector of rightProxy) {
        //         if(vector.y < yMinRightProxy) {
        //             yMinRightProxy = vector.y;
        //         }
        //         else if(vector.y > yMinLeftProxy) {
        //             yMaxRightProxy = vector.y;
        //         }
        //     }
        //     const rightProxyLength = Math.abs(yMinRightProxy - yMaxRightProxy);
        //     console.log("connectProxiesVertically rightProxyLength:", rightProxyLength);

        //     const material = new THREE.MeshStandardMaterial({
        //         color: 0xFF0000,
        //         side: THREE.DoubleSide,
        //     });
        //     const material2 = new THREE.MeshStandardMaterial({
        //         color: 0x0000FF,
        //         side: THREE.DoubleSide,
        //     });
        //     const cubeGeometry = new THREE.BoxGeometry(27, 27, 27);
        //     const frontLeftPoint = new THREE.Mesh(cubeGeometry, material);
        //     frontLeftPoint.name = "jointHelperVertices";

        //     const longestProxyPosition = leftProxy[0].y < rightProxy[0].y ? leftProxy[0] : rightProxy[0];
        //     frontLeftPoint.position.copy(longestProxyPosition);

        //     const length = Math.abs(leftProxyLength - rightProxyLength);
        //     console.log("connectProxiesVertically length:", length);

        //     if(length < Math.abs(leftProxy[0].z - rightProxy[0].z)) {
        //         frontLeftPoint.position.z -= length;
        //         frontLeftPoint.position.y += length;

        //         const frontRightPoint = frontLeftPoint.clone();
        //         frontRightPoint.position.x += 30;

        //         const backLeftPoint = frontLeftPoint.clone();  
        //         backLeftPoint.material = material2;

        //         backLeftPoint.position.y = leftProxy[4].y;

        //         const backRightPoint = backLeftPoint.clone();  
        //         backRightPoint.position.x += 30; 

        //         // this.sceneHelper.addToScene(frontLeftPoint);
        //         // this.sceneHelper.addToScene(frontRightPoint);

        //         // this.sceneHelper.addToScene(backLeftPoint);
        //         // this.sceneHelper.addToScene(backRightPoint);

        //         geometries.push(
        //             this.createGeometryFromPoints(
        //                 leftProxy[0],
        //                 frontLeftPoint.position,
        //                 frontRightPoint.position,
        //                 leftProxy[2]
        //             )
        //         );
        //         geometries.push(
        //             this.createGeometryFromPoints(
        //                 frontLeftPoint.position,
        //                 rightProxy[0],
        //                 rightProxy[2],
        //                 frontRightPoint.position
        //             )
        //         );
                
        //         geometries.push(
        //             this.createGeometryFromPoints(
        //                 leftProxy[0],
        //                 leftProxy[4],
        //                 backLeftPoint.position,
        //                 frontLeftPoint.position
        //             )
        //         );
        //         geometries.push(
        //             this.createGeometryFromPoints(
        //                 frontLeftPoint.position,
        //                 backLeftPoint.position,
        //                 rightProxy[4],
        //                 rightProxy[0]
        //             )
        //         );

        //         geometries.push(
        //             this.createGeometryFromPoints(
        //                 leftProxy[2],
        //                 leftProxy[6],
        //                 backRightPoint.position,
        //                 frontRightPoint.position
        //             )
        //         );
        //         geometries.push(
        //             this.createGeometryFromPoints(
        //                 frontRightPoint.position,
        //                 backRightPoint.position,
        //                 rightProxy[6],
        //                 rightProxy[2]
        //             )
        //         );
        //     }            

        // }

        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[0],
                rightProxy[0],
                rightProxy[2],
                leftProxy[2]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[0],
                leftProxy[4],
                rightProxy[4],
                rightProxy[0]
            )
        );
        geometries.push(
            this.createGeometryFromPoints(
                leftProxy[2],
                leftProxy[6],
                rightProxy[6],
                rightProxy[2]
            )
        );

        return geometries;
    }
    
    createParallelJoint(intersection, pairDirection) {
        const geometries = [];

        if(pairDirection == "vertical") {
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[1],
                    intersection.down.segment.duct.userData.proxy1Vertices[1],
                    intersection.down.segment.duct.userData.proxy1Vertices[5],
                    intersection.up.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[0],
                    intersection.down.segment.duct.userData.proxy1Vertices[0],
                    intersection.down.segment.duct.userData.proxy1Vertices[4],
                    intersection.up.segment.duct.userData.proxy1Vertices[4]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[0],
                    intersection.down.segment.duct.userData.proxy1Vertices[3],
                    intersection.down.segment.duct.userData.proxy1Vertices[2],
                    intersection.up.segment.duct.userData.proxy1Vertices[1]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[4],
                    intersection.down.segment.duct.userData.proxy1Vertices[4],
                    intersection.down.segment.duct.userData.proxy1Vertices[5],
                    intersection.up.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                    intersection.up.segment.duct.userData.proxyOriginal2Vertices[7],
                    intersection.up.segment.duct.userData.proxy2Vertices[7],
                    intersection.up.segment.duct.userData.proxy1Vertices[7]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.down.segment.duct.userData.proxyOriginal1Vertices[5],
                    intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                    intersection.down.segment.duct.userData.proxy2Vertices[5],
                    intersection.down.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.down.segment.duct.userData.proxyOriginal1Vertices[4],
                    intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                    intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                    intersection.down.segment.duct.userData.proxyOriginal1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy1Vertices[4],
                    intersection.down.segment.duct.userData.proxy2Vertices[4],
                    intersection.down.segment.duct.userData.proxy2Vertices[5],
                    intersection.up.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy2Vertices[1],
                    intersection.down.segment.duct.userData.proxy2Vertices[1],
                    intersection.down.segment.duct.userData.proxy2Vertices[5],
                    intersection.up.segment.duct.userData.proxy2Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy2Vertices[0],
                    intersection.down.segment.duct.userData.proxy2Vertices[0],
                    intersection.down.segment.duct.userData.proxy2Vertices[4],
                    intersection.up.segment.duct.userData.proxy2Vertices[4]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy2Vertices[0],
                    intersection.down.segment.duct.userData.proxy2Vertices[3],
                    intersection.down.segment.duct.userData.proxy2Vertices[2],
                    intersection.up.segment.duct.userData.proxy2Vertices[1]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.up.segment.duct.userData.proxy2Vertices[4],
                    intersection.down.segment.duct.userData.proxy2Vertices[4],
                    intersection.down.segment.duct.userData.proxy2Vertices[5],
                    intersection.up.segment.duct.userData.proxy2Vertices[5]
                )
            );
        }
        if(pairDirection == "horizontal") {
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[2],
                    intersection.right.segment.duct.userData.proxy1Vertices[2],
                    intersection.right.segment.duct.userData.proxy1Vertices[6],
                    intersection.left.segment.duct.userData.proxy1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[1],
                    intersection.right.segment.duct.userData.proxy1Vertices[1],
                    intersection.right.segment.duct.userData.proxy1Vertices[5],
                    intersection.left.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[1],
                    intersection.right.segment.duct.userData.proxy1Vertices[0],
                    intersection.right.segment.duct.userData.proxy1Vertices[3],
                    intersection.left.segment.duct.userData.proxy1Vertices[2]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[5],
                    intersection.right.segment.duct.userData.proxy1Vertices[5],
                    intersection.right.segment.duct.userData.proxy1Vertices[6],
                    intersection.left.segment.duct.userData.proxy1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
                    intersection.right.segment.duct.userData.proxyOriginal2Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[5],
                    intersection.right.segment.duct.userData.proxy1Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.right.segment.duct.userData.proxyOriginal1Vertices[6],
                    intersection.right.segment.duct.userData.proxyOriginal2Vertices[6],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    intersection.right.segment.duct.userData.proxy1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
                    intersection.right.segment.duct.userData.proxyOriginal2Vertices[5],
                    intersection.right.segment.duct.userData.proxyOriginal2Vertices[6],
                    intersection.right.segment.duct.userData.proxyOriginal1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy1Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    intersection.left.segment.duct.userData.proxy1Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy2Vertices[2],
                    intersection.right.segment.duct.userData.proxy2Vertices[2],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    intersection.left.segment.duct.userData.proxy2Vertices[6]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy2Vertices[1],
                    intersection.right.segment.duct.userData.proxy2Vertices[1],
                    intersection.right.segment.duct.userData.proxy2Vertices[5],
                    intersection.left.segment.duct.userData.proxy2Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy2Vertices[1],
                    intersection.right.segment.duct.userData.proxy2Vertices[0],
                    intersection.right.segment.duct.userData.proxy2Vertices[3],
                    intersection.left.segment.duct.userData.proxy2Vertices[2]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    intersection.left.segment.duct.userData.proxy2Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[5],
                    intersection.right.segment.duct.userData.proxy2Vertices[6],
                    intersection.left.segment.duct.userData.proxy2Vertices[6]
                )
            );
        }

        // return geometries;

        this.mergeAndAddToScene(geometries);
    }

    mergeAndAddToScene(geometries) {
        if (geometries.length > 0) {
            // Merge all geometries into one
            const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
            
            // Create a material (opacity can be passed as needed)
            const material = new THREE.MeshStandardMaterial({ 
                color: this.primaryColor, 
                side: THREE.DoubleSide
            });
    
            // Create the merged mesh
            const mergedMesh = new THREE.Mesh(mergedGeometry, material);
            mergedMesh.name = "joint";
            mergedMesh.renderOrder = 2;

            const wireframe = new THREE.WireframeGeometry(mergedMesh.geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);
            wireframeMesh.visible = false;
            mergedMesh.add(wireframeMesh); // Add wireframe as a child of the original mesh
    
            this.sceneHelper.addToScene(mergedMesh);
        }
    }

    createTJointBackwall(intersection, largestGlobalSize) {
        let backwall = [];

        let topLeftMidpoint = {};
        let topRightMidpoint = {};
        let bottomRightMidpoint = {};
        let bottomLeftMidpoint = {};
        if(intersection.right == null) {
            topLeftMidpoint = {
                x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxy1Vertices[4].z
            }
            bottomLeftMidpoint = {
                x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxy2Vertices[4].z
            }
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
            ];
            if(this.xzJointDirection == "inwards" && this.xzJointStyle == "arc") {
                backwall.splice(6, 0, bottomLeftMidpoint);
                backwall.splice(8, 0, bottomLeftMidpoint);
                backwall.splice(0, 0, topLeftMidpoint);
                backwall.splice(2, 0, topLeftMidpoint);
            }
        }
        else if(intersection.left == null) {
            topRightMidpoint = {
                x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxy1Vertices[4].z
            }
            bottomRightMidpoint = {
                x: intersection.down.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
            }
            topLeftMidpoint = {
                x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.up.segment.duct.userData.proxyMedianVertices[4].z
            }
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
            ];
            if(this.xzJointDirection == "inwards" && this.xzJointStyle == "arc") {
                backwall.splice(3, 0, topRightMidpoint);
                backwall.splice(5, 0, topRightMidpoint);
                backwall.splice(8, 0, bottomRightMidpoint);
                backwall.splice(10, 0, bottomRightMidpoint);
            }
        }
        else if(intersection.down == null) {
            topLeftMidpoint = {
                x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxy1Vertices[4].z
            }
            topRightMidpoint = {
                x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxy1Vertices[4].z
            }
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[5],
            ];
            if(this.xzJointDirection == "inwards" && this.xzJointStyle == "arc") {
                backwall.splice(4, 0, topRightMidpoint);
                backwall.splice(0, 0, topLeftMidpoint);
            }
        }
        else if(intersection.up == null) {
            bottomRightMidpoint = {
                x: intersection.down.segment.duct.userData.proxy2Vertices[4].x,
                z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
            }
            bottomLeftMidpoint = {
                x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                z: intersection.left.segment.duct.userData.proxy2Vertices[4].z
            }
            backwall = [
                intersection.down.segment.duct.userData.proxyMedianVertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.down.segment.duct.userData.proxy1Vertices[6],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxy2Vertices[4],
                intersection.left.segment.duct.userData.proxy1Vertices[5],
                intersection.right.segment.duct.userData.proxyMedianVertices[4],
                intersection.right.segment.duct.userData.proxy1Vertices[7],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
            ];
            if(this.xzJointDirection == "inwards" && this.xzJointStyle == "arc") {
                backwall.splice(4, 0, bottomLeftMidpoint);
                backwall.splice(0, 0, bottomRightMidpoint);
            }
        }

        if(backwall.length >= 3) {
            this.createJointBackwall(backwall, largestGlobalSize);
        }
    }

    createLJointBackwall(intersection, largestGlobalSize) {
        let backwall = [];
        if(intersection.up != null && intersection.right != null) {    
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
            ];
            if(this.xzJointStyle == "arc" && this.xzJointDirection == "inwards") {
                let rightMidpoint = {
                    x: intersection.up.segment.duct.userData.proxy2Vertices[4].x,
                    z: intersection.right.segment.duct.userData.proxy1Vertices[4].z
                }
                backwall.splice(4, 0, rightMidpoint);
            }
            if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, intersection.up.segment.duct.userData.proxyMedianVertices2[4]);
            }
        }
        else if(intersection.up != null && intersection.left != null) {    
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
            ];
            if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal"){
                backwall.splice(4, 0, intersection.left.segment.duct.userData.proxyMedianVertices2[6]);
            }
            if(this.xzJointStyle == "arc" && this.xzJointDirection == "inwards") {
                let leftMidpoint = {
                    x: intersection.up.segment.duct.userData.proxy1Vertices[4].x,
                    z: intersection.left.segment.duct.userData.proxy1Vertices[4].z
                }
                backwall.splice(0, 0, leftMidpoint);
            }
        }
        else if(intersection.down != null && intersection.right != null) {    
            backwall = [
                intersection.right.segment.duct.userData.proxy1Vertices[7],
                intersection.right.segment.duct.userData.proxy2Vertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.right.segment.duct.userData.proxyMedianVertices[4],
            ];
            if(this.xzJointStyle == "arc" && this.xzJointDirection == "inwards") {
                let downMidpoint = {
                    x: intersection.down.segment.duct.userData.proxy2Vertices[4].x,
                    z: intersection.right.segment.duct.userData.proxy2Vertices[4].z
                }
                backwall.splice(2, 0, downMidpoint);
            }
            if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, intersection.right.segment.duct.userData.proxyMedianVertices2[4]);
            }
        }
        else if(intersection.down != null && intersection.left != null) {    
            backwall = [
                intersection.left.segment.duct.userData.proxy1Vertices[4],
                intersection.left.segment.duct.userData.proxy2Vertices[4],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
            ];
            if(this.xzJointStyle == "arc" && this.xzJointDirection == "inwards") {
                let downMidpoint = {
                    x: intersection.down.segment.duct.userData.proxy1Vertices[4].x,
                    z: intersection.left.segment.duct.userData.proxy2Vertices[4].z
                }
                backwall.splice(2, 0, downMidpoint);
            }
            if(this.xzJointStyle == "arc" || this.xzJointStyle == "diagonal"){
                backwall.splice(0, 0, intersection.down.segment.duct.userData.proxyMedianVertices2[4]);
            }
            
        }
        
        if(backwall.length >= 3) {
            this.createJointBackwall(backwall, largestGlobalSize);
        }

    }

    patchLJointBackwall(intersection, largestGlobalSize) {
        let backwall = [];
        if(intersection.up != null && intersection.right != null) {    
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices2[4],
                intersection.up.segment.duct.userData.proxyMedianVertices2[5],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[4],
            ];
            this.createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                intersection.up.segment.duct.userData.proxyMedianVertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxyMedianVertices[5],
            ];
            this.createJointBackwall(backwall, largestGlobalSize);
        }
        else if(intersection.up != null && intersection.left != null) {  
            backwall = [
                intersection.left.segment.duct.userData.proxyMedianVertices2[7],
                intersection.left.segment.duct.userData.proxy1Vertices[7],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices2[6],
            ];
            this.createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[5],
            ];
            this.createJointBackwall(backwall, largestGlobalSize);  
        }
        else if(intersection.down != null && intersection.right != null) {  
            backwall = [
                intersection.right.segment.duct.userData.proxyMedianVertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[4],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[7],
            ];
            this.createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                intersection.right.segment.duct.userData.proxyMedianVertices2[4],
                intersection.right.segment.duct.userData.proxyMedianVertices2[5],
                intersection.right.segment.duct.userData.proxy2Vertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[7],
            ];
            this.createJointBackwall(backwall, largestGlobalSize);   
        }
        else if(intersection.down != null && intersection.left != null) {   
            backwall = [
                intersection.down.segment.duct.userData.proxyMedianVertices2[6],
                intersection.down.segment.duct.userData.proxyMedianVertices2[7],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[6],
            ];
            this.createJointBackwall(backwall, largestGlobalSize);
            backwall = [
                intersection.down.segment.duct.userData.proxyMedianVertices[4],
                intersection.down.segment.duct.userData.proxy1Vertices[4],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxyMedianVertices[7],
            ];
            this.createJointBackwall(backwall, largestGlobalSize);  
        }

    }

    createJointClosure(intersect, direction) {
        const geometries = [];

        if(intersect == undefined) {
            return geometries;
        }
        const duct = intersect.segment.duct;

        if(direction == "horizontal") {
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal2Vertices[4],
                    duct.userData.proxyOriginal1Vertices[7],
                    duct.userData.proxy1Vertices[7],
                    duct.userData.proxy2Vertices[4]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal2Vertices[5],
                    duct.userData.proxyOriginal1Vertices[6],
                    duct.userData.proxy1Vertices[6],
                    duct.userData.proxy2Vertices[5]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal1Vertices[7],
                    duct.userData.proxyOriginal2Vertices[4],
                    duct.userData.proxyOriginal2Vertices[5],
                    duct.userData.proxyOriginal1Vertices[6]
                )
            );
        }
        else {
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal2Vertices[4],
                    duct.userData.proxyOriginal1Vertices[4],
                    duct.userData.proxy1Vertices[4],
                    duct.userData.proxy2Vertices[4]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal2Vertices[7],
                    duct.userData.proxyOriginal1Vertices[7],
                    duct.userData.proxy1Vertices[7],
                    duct.userData.proxy2Vertices[7]
                )
            );
            geometries.push(
                this.createGeometryFromPoints(
                    duct.userData.proxyOriginal1Vertices[7],
                    duct.userData.proxyOriginal2Vertices[6],
                    duct.userData.proxyOriginal2Vertices[5],
                    duct.userData.proxyOriginal1Vertices[4]
                )
            );
        }

        return geometries;
    }

    createWallMesh(intersection, largestGlobalSize) {
        const mergeLineValue = 5;
        const backwallArcConfigs = this.backwallArcConfigs;

        const wallMaterial = new THREE.MeshStandardMaterial({ color: this.primaryColor, side: THREE.DoubleSide });

        const backwallGeometry = new THREE.RingGeometry(
            backwallArcConfigs[0].innerRadius + mergeLineValue, 
            backwallArcConfigs[0].outerRadius - mergeLineValue, 
            backwallArcConfigs[0].thetaSegments, 
            backwallArcConfigs[0].phiSegments, 
            backwallArcConfigs[0].thetaStart, 
            backwallArcConfigs[0].thetaLength
        );

        const backwallGeometry2 = new THREE.RingGeometry(
            backwallArcConfigs[1].innerRadius + mergeLineValue, 
            backwallArcConfigs[1].outerRadius - mergeLineValue, 
            backwallArcConfigs[1].thetaSegments, 
            backwallArcConfigs[1].phiSegments, 
            backwallArcConfigs[1].thetaStart, 
            backwallArcConfigs[1].thetaLength
        );

        const backwall = new THREE.Mesh(backwallGeometry, wallMaterial);
        const backwall2 = new THREE.Mesh(backwallGeometry2, wallMaterial);

        backwall.position.copy(backwallArcConfigs[0].ring2.userData.position);
        backwall.rotation.copy(backwallArcConfigs[0].ring2.userData.rotation);
        backwall2.position.copy(backwallArcConfigs[1].ring2.userData.position);
        backwall2.rotation.copy(backwallArcConfigs[1].ring2.userData.rotation); 
        
        const width = backwallArcConfigs[0].ring2.userData.width;
        const width2 = backwallArcConfigs[1].ring2.userData.width;

        let xFactor = 1;
        let zFactor = 1;
        if(intersection.left != null) {
            xFactor = -1;
        }
        if(intersection.down != null) {
            zFactor = -1;
        }

        backwall.position.x += ((width / 2) - 15) * xFactor;
        backwall.position.z += ((width / 2) - 15) * zFactor;

        backwall2.position.x += ((width2 / 2) - 15) * xFactor;
        backwall2.position.z += ((width2 / 2) - 15) * zFactor;

        // this.sceneHelper.addToScene(backwall);
        // this.sceneHelper.addToScene(backwall2);

        backwall.updateMatrix();
        backwall.geometry.applyMatrix4(backwall.matrix);

        backwall2.updateMatrix();
        backwall2.geometry.applyMatrix4(backwall2.matrix);        

        const wallMesh = this.connectWallArcs(backwall.geometry, backwall2.geometry);

        wallMesh.name = "jointWall";

        // Add to scene
        this.sceneHelper.addToScene(wallMesh);
        const wallMesh2 = wallMesh.clone();
        wallMesh2.position.y -= 30;
        this.sceneHelper.addToScene(wallMesh2);
    }

    connectWallArcs(backwallGeometry, backwallGeometry2) {
        // Extract the outer vertices of each ring
        function getArcVertices(geometry) {
            const positions = geometry.attributes.position.array;
            const vertices = [];
            for (let i = 0; i < positions.length; i += 3) {
                vertices.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
            }
            return vertices.slice(vertices.length / 2); // Keep only the outer arc
        }

        const arc1Vertices = getArcVertices(backwallGeometry);
        const arc2Vertices = getArcVertices(backwallGeometry2);

        // Generate faces and vertices for the wall
        const wallVertices = [];
        const wallIndices = [];

        for (let i = 0; i < arc1Vertices.length - 1; i++) {
            const a = arc1Vertices[i];
            const b = arc1Vertices[i + 1];
            const c = arc2Vertices[i];
            const d = arc2Vertices[i + 1];

            // Push vertices
            wallVertices.push(a.x, a.y, a.z);
            wallVertices.push(b.x, b.y, b.z);
            wallVertices.push(c.x, c.y, c.z);
            wallVertices.push(d.x, d.y, d.z);

            // Define indices for two triangles forming a quad
            const index = i * 4;
            wallIndices.push(index, index + 2, index + 1);
            wallIndices.push(index + 1, index + 2, index + 3);
        }

        // Create the wall geometry
        const wallGeometry = new THREE.BufferGeometry();
        wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wallVertices, 3));
        wallGeometry.setIndex(wallIndices);
        wallGeometry.computeVertexNormals(); // Optional: Compute normals for lighting

        // Create the mesh
        const wallMaterial = new THREE.MeshStandardMaterial({ color: this.primaryColor, side: THREE.DoubleSide });
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

        // Add to scene
        this.sceneHelper.addToScene(wallMesh);

        return wallMesh;
    }
}