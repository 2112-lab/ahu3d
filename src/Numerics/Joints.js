import * as THREE from 'three';
import { sharedData } from "../Ahu3D/globals.js";
import { moveOriginalProxyVertices, moveProxyVertices } from '../3D/Geometry/Helpers/Geometry_Proxies.js';

/**
 * Class for creating and managing joints between ducts in the 3D model of the AHU.
 * This class handles the calculation of joint proxies, alignment of proxy medians, 
 * and rendering of joint helpers for the ducts.
 */
export default class Joints {

    /**
     * Constructor for the Joints class.
     * Initializes the class with the provided AHU group, inner duct dimensions, and scene helper.
     * 
     * @param {Object} ahuGroup - The AHU group containing the block styles and other configuration.
     * @param {Object} innerDuctDimensions - The dimensions of the inner duct for size calculations.
     * @param {Object} sceneHelper - Helper for managing the scene.
     */
    constructor(ahuGroup, innerDuctDimensions, sceneHelper) {
        this.ahuGroup = ahuGroup;
        this.innerDuctDimensions = innerDuctDimensions;

        // Initialize shared data for joint block styles and configuration
        sharedData.jointBlockStyle = this.ahuGroup.blockStyle.joints;
        sharedData.jointStyle = sharedData.jointBlockStyle.style;
        sharedData.jointDirection = sharedData.jointBlockStyle.direction;
        sharedData.jointContext = sharedData.jointBlockStyle.context;
        sharedData.jointPadding = sharedData.jointBlockStyle.padding;
        sharedData.jointYStyle = sharedData.jointBlockStyle.yStyle;
        sharedData.jointYDirection = sharedData.jointBlockStyle.yDirection;
    }

    /**
     * Creates joint proxies for duct intersections at the specified grid key. 
     * The function calculates the size of the ducts, creates necessary proxy geometries (e.g., proxy1, proxy2, and proxyMedian),
     * and stores the resulting proxies in the `ahuObject.resources.joints` object.
     * 
     * @param {Object} intersection - The intersection data for the ducts, containing ducts at each key (up, down, left, right).
     * @param {Object} ahuObject - The AHU object containing the resources for the ducts and joints.
     * @param {string} gridKey - The key representing the grid for which to create the joint proxies.
     */
    createJointProxies(intersection, ahuObject, gridKey) {
        console.log("createJointProxies started:", intersection, ahuObject);

        // Set the current AHU object for further reference
        this.ahuObject = ahuObject;

        // Define the wall thickness used for the proxy geometries
        const wallThickness = sharedData.moduleConfigs.parametricOptions.wallThickness;

        // Find the largest duct size at the intersection to adjust proxy sizes accordingly
        let largestGlobalSize = sharedData.innerDuctDimensions["small"];
        for (const key in intersection) {
            let duct = intersection[key];
            if (duct != null) {
                const size = this.ahuObject.resources.ducts[duct.id].dimensions.z;
                if (size > largestGlobalSize) {
                    largestGlobalSize = size; // Update largest duct size
                }
            }
        }

        // Calculate the y_offset based on wall thickness (negative value for adjustment)
        let y_offset = wallThickness * -1;

        // Count the number of defined ducts at the intersection (used for determining further logic)
        let definedIntersectionCount = 0;
        for (const key in intersection) {
            if (intersection[key] != null) {
                definedIntersectionCount++; // Increment count for each defined duct
            }
        }

        console.log("createJointProxies step 1");

        // Calculate the adjacent context for the intersection (e.g., sizing and offsets)
        this.calculateAdjacentContext(intersection, largestGlobalSize, definedIntersectionCount);

        console.log("createJointProxies step 2:", intersection);

        // Loop through the ducts at the intersection to create proxies for each one
        for (const key in intersection) {
            let duct = intersection[key];

            // Skip if the duct is not defined
            if (duct != null) {

                console.log("createJointProxies step 3 key:", key);

                // Get the duct's inner dimensions from the resources
                const innerDuctDimensions = this.ahuObject.resources.ducts[duct.id].dimensions;

                console.log("createJointProxies step 4");

                // Get the depth (z-dimension) of the duct
                const ductDepth = innerDuctDimensions.z;

                console.log("createJointProxies step 5");

                // Calculate proxy depth, adjusting it based on the y_offset
                const proxyDepth = ductDepth + y_offset;

                console.log("createJointProxies step 6");

                // Create the geometries for the joint proxies
                const proxy1Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxy2Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyOriginal1Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyOriginal2Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyMedianGeometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);

                // Initialize proxy objects with default positions
                let proxy1 = { position: { x: 0, z: 0 } };
                let proxy2 = { position: { x: 0, z: 0 } };
                let proxyOriginal1 = { position: { x: 0, z: 0 } };
                let proxyOriginal2 = { position: { x: 0, z: 0 } };
                let proxyMedian = { position: { x: 0, z: 0 } };

                console.log("createJointProxies step 7:", duct);

                // Move the proxy vertices based on the duct's dimensions
                moveProxyVertices(proxy1Geometry, ductDepth, duct.proxyLengths.proxy1, largestGlobalSize);
                moveProxyVertices(proxy2Geometry, ductDepth, duct.proxyLengths.proxy2, largestGlobalSize);
                moveProxyVertices(proxyMedianGeometry, ductDepth, duct.proxyLengths.proxyMedian, largestGlobalSize);
                moveOriginalProxyVertices(proxyOriginal1Geometry);
                moveOriginalProxyVertices(proxyOriginal2Geometry);

                console.log("createJointProxies step 8");

                // Position proxies based on the intersection direction (up, down, left, right)
                if (key == "up") {
                    proxy1.position.x += (innerDuctDimensions.z / -2);
                    proxy1.position.z += (innerDuctDimensions.x) / -2;

                    proxy2 = JSON.parse(JSON.stringify(proxy1));
                    proxy2.position.x += (innerDuctDimensions.z);
                } else if (key == "down") {
                    proxy1.position.x += (innerDuctDimensions.z / -2);
                    proxy1.position.z += (innerDuctDimensions.x) / 2;

                    proxy2 = JSON.parse(JSON.stringify(proxy1));
                    proxy2.position.x += (innerDuctDimensions.z);
                } else if (key == "left") {
                    proxy1.position.x += (innerDuctDimensions.x / 2);
                    proxy1.position.z += (innerDuctDimensions.z) / 2;

                    proxy2 = JSON.parse(JSON.stringify(proxy1));
                    proxy2.position.z += (innerDuctDimensions.z * -1);
                } else if (key == "right") {
                    proxy1.position.x += (innerDuctDimensions.x / -2);
                    proxy1.position.z += (innerDuctDimensions.z) / 2;

                    proxy2 = JSON.parse(JSON.stringify(proxy1));
                    proxy2.position.z += (innerDuctDimensions.z * -1);
                }

                // Apply the overall position of the duct to the proxies
                proxy1.position.x += this.ahuObject.resources.ducts[duct.id].position.x;
                proxy1.position.z += this.ahuObject.resources.ducts[duct.id].position.z;

                proxy2.position.x += this.ahuObject.resources.ducts[duct.id].position.x;
                proxy2.position.z += this.ahuObject.resources.ducts[duct.id].position.z;

                // Clone proxy positions for original proxies and median proxies
                proxyOriginal1 = JSON.parse(JSON.stringify(proxy1));
                proxyOriginal2 = JSON.parse(JSON.stringify(proxy2));
                proxyMedian = JSON.parse(JSON.stringify(proxy1));

                // Translate the proxy geometries to their correct positions
                proxy1Geometry.translate(proxy1.position.x, 0, proxy1.position.z);
                proxy2Geometry.translate(proxy2.position.x, 0, proxy2.position.z);
                proxyOriginal1Geometry.translate(proxyOriginal1.position.x, 0, proxyOriginal1.position.z);
                proxyOriginal2Geometry.translate(proxyOriginal2.position.x, 0, proxyOriginal2.position.z);

                console.log("createJointProxies step 10");

                // Store the created proxies in the AHU object's resources
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key] = {};

                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxy1 = JSON.parse(JSON.stringify(proxy1));
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxy2 = JSON.parse(JSON.stringify(proxy2));
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyOriginal1 = JSON.parse(JSON.stringify(proxyOriginal1));
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyOriginal2 = JSON.parse(JSON.stringify(proxyOriginal2));
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian = JSON.parse(JSON.stringify(proxyMedian));

                console.log("createJointProxies step 11");

                // Map the proxy geometries to their respective vertices and store the coordinates
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxy1.coordinates = this.mapProxyVertices(proxy1Geometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxy2.coordinates = this.mapProxyVertices(proxy2Geometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyOriginal1.coordinates = this.mapProxyVertices(proxyOriginal1Geometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyOriginal2.coordinates = this.mapProxyVertices(proxyOriginal2Geometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.geometry = proxyMedianGeometry;

                console.log("createJointProxies step 12:", this.ahuObject);
            }
        }

        // Align the proxy medians based on the joint direction (inwards or outwards)
        if (sharedData.jointDirection == "inwards") {
            this.alignProxyMediansInwards(intersection, gridKey);
        } else if (sharedData.jointDirection == "outwards") {
            this.alignProxyMediansOutwards(intersection, gridKey);
        }

        console.log("createJointProxies step 15");

        // Finalize the proxy median geometry and map the coordinates
        for (const key in intersection) {
            let duct = intersection[key];
            if (duct != null) {
                let proxyMedianGeometry = this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.geometry;

                // Retrieve the duct position for proper translation
                const ductPos = this.ahuObject.resources.ducts[duct.id].position;

                // Apply the calculated translation to the proxy median geometry
                proxyMedianGeometry.translate(
                    this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.position.x,
                    0,
                    this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.position.z
                );

                // Map the vertices of the proxy median geometry
                let mappedCoordinates = this.mapProxyVertices(proxyMedianGeometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.coordinates = mappedCoordinates;

                // Remove the geometry after mapping coordinates
                delete this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.geometry;

                console.log("createJointProxies step 15:", this.ahuObject);
            }
        }

        console.log("createJointProxies step 16:", this.ahuObject.resources.joints[`Joint-${gridKey}`]);
    }

    /**
     * calculateAdjacentContext
     * 
     * Calculates the context for the adjacent proxies at the intersection based on the duct sizes.
     * It also adjusts the proxy lengths depending on the context (e.g., inwards, outwards, diagonal, orthogonal).
     * This function is crucial for determining how the proxies are positioned relative to each other based on their sizes and orientations.
     * 
     * @param {Object} intersection - The intersection data for the ducts.
     * @param {number} largestGlobalSize - The largest size of the ducts at the intersection.
     * @param {number} definedIntersectionCount - The number of defined intersections at the current grid key.
     */
    calculateAdjacentContext(intersection, largestGlobalSize, definedIntersectionCount) {
        console.log("calculateAdjacentContext started");

        let ductSize1 = 0;
        let ductSize2 = 0;
        const selectedSize = sharedData.jointYDirection; // Select the joint Y direction based on the shared data
        let sizes = {
            inwards: null,
            outwards: null
        };

        // Helper function to compare two duct sizes and assign inwards/outwards values
        function compareSizes(sizes, ductSize1, ductSize2) {
            if (ductSize2 < ductSize1) {
                sizes.inwards = ductSize2;
                sizes.outwards = ductSize1;
            } else {
                sizes.outwards = ductSize2;
                sizes.inwards = ductSize1;
            }
        }

        // Initialize proxy lengths for each intersection as the largest global size
        for (const key in intersection) {
            if (intersection[key] != null) {
                intersection[key].proxyLengths = {
                    proxy1: largestGlobalSize,
                    proxy2: largestGlobalSize,
                    proxyMedian: largestGlobalSize
                };
            }
        }

        // Skip further calculations if the joint context is set to "global"
        if (sharedData.jointContext === "global") {
            return;
        }

        // Handle cases for diagonal joint style where proxies are calculated for diagonal directions
        if (sharedData.jointYStyle === "diagonal") {
            for (const key in intersection) {
                if (intersection[key] != null) {
                    const currentSize = this.innerDuctDimensions[intersection[key].graphicLocation.size];
                    intersection[key].proxyLengths.proxy1 = currentSize;
                    intersection[key].proxyLengths.proxy2 = currentSize;
                }
            }

            // Compare sizes and set proxy median values for diagonal intersections
            if (intersection.up != null && intersection.left != null) {
                ductSize1 = this.getSize(intersection.up);
                ductSize2 = this.getSize(intersection.left);
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if (intersection.left != null && intersection.down != null) {
                ductSize1 = this.getSize(intersection.left);
                ductSize2 = this.getSize(intersection.down);
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if (intersection.down != null && intersection.right != null) {
                ductSize1 = this.getSize(intersection.down);
                ductSize2 = this.getSize(intersection.right);
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if (intersection.right != null && intersection.up != null) {
                ductSize1 = this.getSize(intersection.right);
                ductSize2 = this.getSize(intersection.up);
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
            }
        } else if (sharedData.jointYStyle === "orthogonal") {
            // Handle orthogonal style where proxies are calculated in a grid-like fashion
            if (definedIntersectionCount === 4) {
                // For four defined intersections (up, down, left, right), calculate proxy lengths
                ductSize1 = this.getSize(intersection.up);
                ductSize2 = this.getSize(intersection.left);
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.left.proxyLengths.proxy1 = sizes[selectedSize];

                ductSize1 = this.getSize(intersection.left);
                ductSize2 = this.getSize(intersection.down);
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.down.proxyLengths.proxy1 = sizes[selectedSize];

                ductSize1 = this.getSize(intersection.down);
                ductSize2 = this.getSize(intersection.right);
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.right.proxyLengths.proxy2 = sizes[selectedSize];

                ductSize1 = this.getSize(intersection.right);
                ductSize2 = this.getSize(intersection.up);
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
            } else if (definedIntersectionCount === 3) {
                // Handle three defined intersections (e.g., up-left-right, down-left-right, etc.)
                if (intersection.up != null && intersection.left != null) {
                    ductSize1 = this.getSize(intersection.up);
                    ductSize2 = this.getSize(intersection.left);
                    compareSizes(sizes, ductSize1, ductSize2);
                    intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
                }

                if (intersection.left != null && intersection.down != null) {
                    ductSize1 = this.getSize(intersection.left);
                    ductSize2 = this.getSize(intersection.down);
                    compareSizes(sizes, ductSize1, ductSize2);
                    intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.down.proxyLengths.proxy1 = sizes[selectedSize];
                }

                if (intersection.down != null && intersection.right != null) {
                    ductSize1 = this.getSize(intersection.down);
                    ductSize2 = this.getSize(intersection.right);
                    compareSizes(sizes, ductSize1, ductSize2);
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
                }

                if (intersection.right != null && intersection.up != null) {
                    ductSize1 = this.getSize(intersection.right);
                    ductSize2 = this.getSize(intersection.up);
                    compareSizes(sizes, ductSize1, ductSize2);
                    intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                }
            } else if (definedIntersectionCount === 2) {
                // Handle two defined intersections (e.g., up-left, left-right, etc.)
                if (intersection.up != null && intersection.left != null) {
                    ductSize1 = this.getSize(intersection.up);
                    ductSize2 = this.getSize(intersection.left);
                    compareSizes(sizes, ductSize1, ductSize2);
                    intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
                }

                if (intersection.left != null && intersection.down != null) {
                    ductSize1 = this.getSize(intersection.left);
                    ductSize2 = this.getSize(intersection.down);
                    compareSizes(sizes, ductSize1, ductSize2);
                    intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.down.proxyLengths.proxy1 = sizes[selectedSize];
                }

                if (intersection.down != null && intersection.right != null) {
                    ductSize1 = this.getSize(intersection.down);
                    ductSize2 = this.getSize(intersection.right);
                    compareSizes(sizes, ductSize1, ductSize2);
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
                }

                if (intersection.right != null && intersection.up != null) {
                    ductSize1 = this.getSize(intersection.right);
                    ductSize2 = this.getSize(intersection.up);
                    compareSizes(sizes, ductSize1, ductSize2);
                    intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                }
            }
        }
    }

    /**
     * getSize
     * 
     * Retrieves the size of a duct based on its dimensions.
     * 
     * @param {Object} duct - The duct object containing the dimensions.
     * @returns {number} The size of the duct.
     */
    getSize(duct) {
        const size = this.ahuObject.resources.ducts[duct.id].dimensions.z;
        return size;
    }

    /**
     * Aligns the proxy medians inwards based on the defined intersection and joint direction. 
     * This function adjusts the position of the proxy median geometries based on the joint style and duct dimensions.
     * 
     * @param {Object} intersection - The intersection data containing ducts in each direction (up, down, left, right).
     * @param {string} gridKey - The grid key used to reference the joint in the resources.
     */
    alignProxyMediansInwards(intersection, gridKey) {
        console.log("alignProxyMediansInwards started:", intersection, gridKey, this.ahuObject);
        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        const jointObject = this.ahuObject.resources.joints[`Joint-${gridKey}`];

        console.log("alignProxyMediansInwards step 1");

        let upProxies, rightProxies, leftProxies, downProxies = null;

        // this.ahuObject.resources.ducts[duct.id].dimensions

        if(intersection.up) {
            upProxies = jointObject.up;
            upProxies.ductDimensions = this.ahuObject.resources.ducts[intersection.up.id].dimensions;
        }
        if(intersection.right) {
            rightProxies = jointObject.right;
            rightProxies.ductDimensions = this.ahuObject.resources.ducts[intersection.right.id].dimensions;
        }
        if(intersection.left) {
            leftProxies = jointObject.left;
            leftProxies.ductDimensions = this.ahuObject.resources.ducts[intersection.left.id].dimensions;
        }
        if(intersection.down) {
            downProxies = jointObject.down;
            downProxies.ductDimensions = this.ahuObject.resources.ducts[intersection.down.id].dimensions;
        }

        console.log("alignProxyMediansInwards step 2:", this.ahuObject);

        if(definedIntersectionCount == 2) {
            console.log("alignProxyMediansInwards step 3");
            if(intersection.up != null && intersection.right != null) {
                console.log("alignProxyMediansInwards step 4 upProxies:", upProxies);

                upProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;

                console.log("alignProxyMediansInwards step 5");

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {

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

                    console.log("alignProxyMediansInwards step 6");

                    let medianOffset = Math.min(
                        rightProxies.ductDimensions.y,
                        upProxies.ductDimensions.y
                    );

                    medianOffset += sharedData.jointPadding + 15;

                    if(rightProxies.ductDimensions.y < upProxies.ductDimensions.y) {
                        upProxies.proxyMedian.position.x += medianOffset;
                    }
                    else {
                        upProxies.proxyMedian.position.z += medianOffset;
                    }
                }

                console.log("alignProxyMediansInwards step 10:", this.ahuObject);
            }
            else if(intersection.down != null && intersection.right != null) {
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                rightProxies.proxyMedian.position.x = downProxies.proxy1.position.x;

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                        rightProxies.ductDimensions.y,
                        downProxies.ductDimensions.y
                    );

                    medianOffset += sharedData.jointPadding + 15;

                    if(rightProxies.ductDimensions.y < downProxies.ductDimensions.y) {
                        rightProxies.proxyMedian.position.x += medianOffset;
                    }
                    else {
                        rightProxies.proxyMedian.position.z -= medianOffset;
                    }
                }
            }
            else if(intersection.up != null && intersection.left != null) {
                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                leftProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                        leftProxies.ductDimensions.y,
                        upProxies.ductDimensions.y
                    );

                    medianOffset += sharedData.jointPadding + 15;

                    if(leftProxies.ductDimensions.y > upProxies.ductDimensions.y) {
                        leftProxies.proxyMedian.position.z += medianOffset;
                    }
                    else {
                        leftProxies.proxyMedian.position.x -= medianOffset;
                    }
                }
            }
            else if(intersection.down != null && intersection.left != null) {
                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                        leftProxies.ductDimensions.y,
                        downProxies.ductDimensions.y
                    );

                    medianOffset += sharedData.jointPadding + 15;

                    if(leftProxies.ductDimensions.y > downProxies.ductDimensions.y) {
                        downProxies.proxyMedian.position.z -= medianOffset;
                    }
                    else {
                        downProxies.proxyMedian.position.x -= medianOffset;
                    }

                }
            }

        }
        else if(definedIntersectionCount == 3) {
            console.log("alignProxyMediansInwards step 3");
            if(intersection.right == null) {
                console.log("alignProxyMediansInwards step 4");
                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                console.log("alignProxyMediansInwards step 5");

                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(upProxies.ductDimensions.y > downProxies.ductDimensions.y) {
                    downProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                }
                else {
                    downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                    downProxies.proxyMedian.position.z = upProxies.proxy2.position.z;
                }

                console.log("alignProxyMediansInwards step 6");

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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

                console.log("alignProxyMediansInwards step 7");

            }
            else if(intersection.left == null) {
                if(upProxies.ductDimensions.y > downProxies.ductDimensions.y) {
                    upProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                }
                else {
                    upProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                }
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;  
                
                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                if( leftProxies.ductDimensions.y > rightProxies.ductDimensions.y) {
                    leftProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                    leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                }
                else {
                    leftProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                } 

                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                rightProxies.proxyMedian.position.x = upProxies.proxy2.position.x;

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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

                // this.innerDuctDimensions[intersection.

                if(leftProxies.ductDimensions.y > rightProxies.ductDimensions.y) {
                    rightProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                }
                else {
                    rightProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;
                }

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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

            if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                    // downProxies.proxyMedian.userData.isDiagonal = true;
                    // downProxies.proxyMedian.userData.diagonalWidth = distances.down.z;
                    // downProxies.proxyMedian.userData.arcOrigin = {
                    //     x: downProxies.proxyMedian.position.x,
                    //     z: downProxies.proxy2.position.z
                    // }
                    
                }
                else if(distances.down.x <= distances.down.z) {
                    downProxies.proxyMedian.position.z -= distances.down.x;
                    // downProxies.proxyMedian.userData.isDiagonal = true;
                    // downProxies.proxyMedian.userData.diagonalWidth = distances.down.x;
                    // downProxies.proxyMedian.userData.arcOrigin = {
                    //     x: downProxies.proxy2.position.x,
                    //     z: downProxies.proxyMedian.position.z
                    // }
                }

                if(distances.right.x > distances.right.z) {
                    rightProxies.proxyMedian.position.x += distances.right.z;
                    // rightProxies.proxyMedian.userData.isDiagonal = true;
                    // rightProxies.proxyMedian.userData.diagonalWidth = distances.right.z;
                    // rightProxies.proxyMedian.userData.arcOrigin = {
                    //     x: rightProxies.proxy2.position.x,
                    //     z: rightProxies.proxyMedian.position.z
                    // }
                }
                else if(distances.right.x <= distances.right.z) {
                    rightProxies.proxyMedian.position.z += distances.right.x;
                    // rightProxies.proxyMedian.userData.isDiagonal = true;
                    // rightProxies.proxyMedian.userData.diagonalWidth = distances.right.x;
                    // rightProxies.proxyMedian.userData.arcOrigin = {
                    //     x: rightProxies.proxy2.position.x,
                    //     z: rightProxies.proxyMedian.position.z
                    // }
                }

                if(distances.up.x > distances.up.z) {
                    upProxies.proxyMedian.position.x -= distances.up.z;
                    // upProxies.proxyMedian.userData.isDiagonal = true;
                    // upProxies.proxyMedian.userData.diagonalWidth = distances.up.z;
                    // upProxies.proxyMedian.userData.arcOrigin = {
                    //     x: leftProxies.proxy2.position.x,
                    //     z: upProxies.proxyMedian.position.z
                    // }
                }
                else if(distances.up.x <= distances.up.z) {
                    upProxies.proxyMedian.position.z += distances.up.x;
                    // upProxies.proxyMedian.userData.isDiagonal = true;
                    // upProxies.proxyMedian.userData.diagonalWidth = distances.up.x;
                    // upProxies.proxyMedian.userData.arcOrigin = {
                    //     x: leftProxies.proxy2.position.x,
                    //     z: upProxies.proxyMedian.position.z
                    // }
                }

                if(distances.left.x > distances.left.z) {
                    leftProxies.proxyMedian.position.x -= distances.left.z;
                    // leftProxies.proxyMedian.userData.isDiagonal = true;
                    // leftProxies.proxyMedian.userData.diagonalWidth = distances.left.z;
                    // leftProxies.proxyMedian.userData.arcOrigin = {
                    //     x: leftProxies.proxy2.position.x,
                    //     z: leftProxies.proxyMedian.position.z
                    // }
                }
                else if(distances.left.x <= distances.left.z) {
                    leftProxies.proxyMedian.position.z -= distances.left.x;
                    // leftProxies.proxyMedian.userData.isDiagonal = true;
                    // leftProxies.proxyMedian.userData.diagonalWidth = distances.left.x;
                    // leftProxies.proxyMedian.userData.arcOrigin = {
                    //     x: leftProxies.proxy2.position.x,
                    //     z: leftProxies.proxyMedian.position.z
                    // }
                }
            }
        }
    }

    /**
     * Aligns the proxy medians outwards based on the defined intersection and joint direction. 
     * This function adjusts the position of the proxy median geometries based on the joint style and duct dimensions.
     * 
     * @param {Object} intersection - The intersection data containing ducts in each direction (up, down, left, right).
     * @param {string} gridKey - The grid key used to reference the joint in the resources.
     */
    alignProxyMediansOutwards(intersection, gridKey) {        
        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        const jointObject = this.ahuObject.resources.joints[`Joint-${gridKey}`];

        console.log("alignProxyMediansOutwards step 1");

        let upProxies, rightProxies, leftProxies, downProxies = null;

        if(intersection.up) {
            upProxies = jointObject.up;
            upProxies.ductDimensions = this.ahuObject.resources.ducts[intersection.up.id].dimensions;
        }
        if(intersection.right) {
            rightProxies = jointObject.right;
            rightProxies.ductDimensions = this.ahuObject.resources.ducts[intersection.right.id].dimensions;
        }
        if(intersection.left) {
            leftProxies = jointObject.left;
            leftProxies.ductDimensions = this.ahuObject.resources.ducts[intersection.left.id].dimensions;
        }
        if(intersection.down) {
            downProxies = jointObject.down;
            downProxies.ductDimensions = this.ahuObject.resources.ducts[intersection.down.id].dimensions;
        }

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {

                console.log("alignProxyMediansOutwards step 2");
                upProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                        rightProxies.ductDimensions.y,
                        upProxies.ductDimensions.y
                    );

                    medianOffset += sharedData.jointPadding + 15;

                    if(rightProxies.ductDimensions.y < upProxies.ductDimensions.y) {
                        upProxies.proxyMedian.position.x += medianOffset;
                    }
                    else {
                        upProxies.proxyMedian.position.z += medianOffset;
                    }

                }
            }
            else if(intersection.down != null && intersection.right != null) {
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                rightProxies.proxyMedian.position.x = downProxies.proxy1.position.x;

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                        rightProxies.ductDimensions.y,
                        downProxies.ductDimensions.y
                    );

                    medianOffset += sharedData.jointPadding + 15;

                    if(rightProxies.ductDimensions.y < downProxies.ductDimensions.y) {
                        rightProxies.proxyMedian.position.x += medianOffset;
                    }
                    else {
                        rightProxies.proxyMedian.position.z -= medianOffset;
                    }
                }
            }
            else if(intersection.up != null && intersection.left != null) {
                upProxies.proxyMedian.position.x = leftProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                        leftProxies.ductDimensions.y,
                        upProxies.ductDimensions.y
                    );

                    medianOffset += sharedData.jointPadding + 15;

                    if(leftProxies.ductDimensions.y < upProxies.ductDimensions.y) {
                        leftProxies.proxyMedian.position.x -= medianOffset;
                    }
                    else {
                        leftProxies.proxyMedian.position.z += medianOffset;
                    }
                }
            }
            else if(intersection.down != null && intersection.left != null) {
                leftProxies.proxyMedian.position.z = downProxies.proxy1.position.z;
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                
                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                        leftProxies.ductDimensions.y,
                        downProxies.ductDimensions.y
                    );

                    medianOffset += sharedData.jointPadding + 15;

                    if(leftProxies.ductDimensions.y > downProxies.ductDimensions.y) {
                        downProxies.proxyMedian.position.z -= medianOffset;
                    }
                    else {
                        downProxies.proxyMedian.position.x -= medianOffset;
                    }
                }
            }
        }
        else if(definedIntersectionCount == 3) {
            
            if(intersection.right == null) {
                upProxies.proxyMedian.position.x = leftProxies.proxyMedian.position.x;
                leftProxies.proxyMedian.position.z = downProxies.proxyMedian.position.z;

                // leftProxies.ductDimensions.y

                if(upProxies.ductDimensions.y > downProxies.ductDimensions.y) {
                    downProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                }
                else {
                    downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                    downProxies.proxyMedian.position.z = upProxies.proxy2.position.z;
                }

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                if(upProxies.ductDimensions.y > downProxies.ductDimensions.y) {
                    upProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                }
                else {
                    upProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                }
                downProxies.proxyMedian.position.z = downProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;

                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;   
                
                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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
                if(leftProxies.ductDimensions.y > rightProxies.ductDimensions.y) {
                    leftProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                    leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                }
                else {
                    leftProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;
                } 

                upProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;

                rightProxies.proxyMedian.position.z = upProxies.proxy2.position.z;

                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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

                if(leftProxies.ductDimensions.y > rightProxies.ductDimensions.y) {
                    rightProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                }
                else {
                    rightProxies.proxyMedian.position.x = leftProxies.proxy1.position.x;
                } 
                
                if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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

            if(sharedData.jointStyle == "diagonal" || sharedData.jointStyle == "arc") {
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

    /**
     * Maps the vertices of the proxy geometry and returns the coordinates of the corners.
     * The function creates a `THREE.Box3` to calculate the bounding box of the proxy geometry 
     * and then extracts the corners of the box.
     * 
     * @param {THREE.BufferGeometry} proxyGeometry - The geometry of the proxy object to map.
     * @returns {Array} An array of `THREE.Vector3` objects representing the coordinates of the proxy's corners.
     */
    mapProxyVertices(proxyGeometry) {
        // Create a new bounding box from the provided proxy geometry
        // `THREE.Box3` helps to get the minimum and maximum bounds of the geometry
        const proxyBB = new THREE.Box3().setFromBufferAttribute(proxyGeometry.attributes.position);

        // Get the minimum and maximum points of the bounding box
        const proxyMin = proxyBB.min;
        const proxyMax = proxyBB.max;

        // Define the 8 corners of the bounding box
        const proxyCorners = [
            // Bottom and top corners (x, y, z)
            new THREE.Vector3(proxyMin.x, proxyMin.y, proxyMax.z), // corner 1
            new THREE.Vector3(proxyMin.x, proxyMin.y, proxyMin.z), // corner 2
            new THREE.Vector3(proxyMax.x, proxyMin.y, proxyMin.z), // corner 3
            new THREE.Vector3(proxyMax.x, proxyMin.y, proxyMax.z), // corner 4

            new THREE.Vector3(proxyMin.x, proxyMax.y, proxyMax.z), // corner 5
            new THREE.Vector3(proxyMin.x, proxyMax.y, proxyMin.z), // corner 6
            new THREE.Vector3(proxyMax.x, proxyMax.y, proxyMin.z), // corner 7
            new THREE.Vector3(proxyMax.x, proxyMax.y, proxyMax.z), // corner 8
        ];

        // Return the array of the 8 corners of the bounding box as a list of Vector3 objects
        return proxyCorners;
    }


}