import * as THREE from 'three';
import { sharedData } from "../Ahu3D/globals.js";
import { moveOriginalProxyVertices, moveProxyVertices } from '../3D/Geometry/Helpers/Geometry_Proxies.js';

export default class Joints {
    constructor(ahuGroup, innerDuctDimensions, sceneHelper) {
        this.ahuGroup = ahuGroup;
        this.innerDuctDimensions = innerDuctDimensions;
        

        console.log("Joints constructor this.ahuGroup:", this.ahuGroup);

        sharedData.jointBlockStyle = this.ahuGroup.blockStyle.joints;
        sharedData.xzJointStyle = sharedData.jointBlockStyle.XZ.style;
        sharedData.xzJointDirection = sharedData.jointBlockStyle.XZ.direction;
        sharedData.xzJointContext = sharedData.jointBlockStyle.XZ.context;
        sharedData.xzJointPadding = sharedData.jointBlockStyle.XZ.padding;
        sharedData.xzJointYStyle = sharedData.jointBlockStyle.XZ.yStyle;
        sharedData.xzJointYDirection = sharedData.jointBlockStyle.XZ.yDirection; 
        
        console.log("Joints constructor step 2:", this.ahuGroup);
    }


    createJointProxies(intersection, ahuObject, gridKey, largestGlobalSize) {
        console.log("createJointProxies started:", intersection, ahuObject);

        this.ahuObject = ahuObject;
          
        const wallThickness = sharedData.moduleConfigs.parametricOptions.wallThickness;
  
        largestGlobalSize = sharedData.innerDuctDimensions["small"];
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                const size =  this.ahuObject.resources.ducts[duct.id].dimensions.z;
                if(size > largestGlobalSize) {
                    largestGlobalSize = size;
                }
            }
        }

        console.log("createJointProxies largestGlobalSize:", largestGlobalSize);         

        let y_offset = wallThickness * -1;

        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        console.log("createJointProxies step 1");

        this.calculateAdjacentContext(intersection, largestGlobalSize, definedIntersectionCount);

        console.log("createJointProxies step 2:", intersection);
  
        for(const key in intersection) {
            let duct = intersection[key];

            if(duct != null) {

                console.log("createJointProxies step 3 key:", key);
                const innerDuctDimensions = this.ahuObject.resources.ducts[duct.id].dimensions;

                console.log("createJointProxies step 4");

                const ductDepth = innerDuctDimensions.z;

                console.log("createJointProxies step 5");

                const proxyDepth = ductDepth + y_offset;

                console.log("createJointProxies step 6");

                const proxy1Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxy2Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyOriginal1Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);
                const proxyOriginal2Geometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);    
                const proxyMedianGeometry = new THREE.BoxGeometry(wallThickness, proxyDepth, wallThickness);

                let proxy1 = { position: { x: 0, z: 0 } }
                let proxy2 = { position: { x: 0, z: 0 } }
                let proxyOriginal1 = { position: { x: 0, z: 0 } }
                let proxyOriginal2 = { position: { x: 0, z: 0 } }
                let proxyMedian = { position: { x: 0, z: 0 } }

                console.log("createJointProxies step 7:", duct);

                moveProxyVertices(proxy1Geometry, ductDepth, duct.proxyLengths.proxy1, largestGlobalSize);
                moveProxyVertices(proxy2Geometry, ductDepth, duct.proxyLengths.proxy2, largestGlobalSize);
                moveProxyVertices(proxyMedianGeometry, ductDepth, duct.proxyLengths.proxyMedian, largestGlobalSize);
                moveOriginalProxyVertices(proxyOriginal1Geometry);
                moveOriginalProxyVertices(proxyOriginal2Geometry);

                console.log("createJointProxies step 8");

                if(key == "up") {
                    proxy1.position.x += (innerDuctDimensions.z / -2);
                    proxy1.position.z += (innerDuctDimensions.x) / -2;
        
                    proxy2 = JSON.parse(JSON.stringify(proxy1));
                    proxy2.position.x += (innerDuctDimensions.z);
                }
                else if(key == "down") {
                    proxy1.position.x += (innerDuctDimensions.z / -2);
                    proxy1.position.z += (innerDuctDimensions.x) / 2;
        
                    proxy2 = JSON.parse(JSON.stringify(proxy1));
                    proxy2.position.x += (innerDuctDimensions.z);
                }
                else if(key == "left") {
                    proxy1.position.x += (innerDuctDimensions.x / 2);
                    proxy1.position.z += (innerDuctDimensions.z) / 2;
        
                    proxy2 = JSON.parse(JSON.stringify(proxy1));
                    proxy2.position.z += (innerDuctDimensions.z * -1);
                }
                else if(key == "right") {
                    proxy1.position.x += (innerDuctDimensions.x / -2);
                    proxy1.position.z += (innerDuctDimensions.z) / 2;
        
                    proxy2 = JSON.parse(JSON.stringify(proxy1));
                    proxy2.position.z += (innerDuctDimensions.z * -1);
                }  

                proxy1.position.x += this.ahuObject.resources.ducts[duct.id].position.x;
                proxy1.position.z += this.ahuObject.resources.ducts[duct.id].position.z;

                proxy2.position.x += this.ahuObject.resources.ducts[duct.id].position.x;
                proxy2.position.z += this.ahuObject.resources.ducts[duct.id].position.z;

                proxyOriginal1 = JSON.parse(JSON.stringify(proxy1));
                proxyOriginal2 = JSON.parse(JSON.stringify(proxy2));
                proxyMedian = JSON.parse(JSON.stringify(proxy1));

                proxy1Geometry.translate( proxy1.position.x, 0, proxy1.position.z );
                proxy2Geometry.translate( proxy2.position.x, 0, proxy2.position.z );
                proxyOriginal1Geometry.translate( proxyOriginal1.position.x, 0, proxyOriginal1.position.z );
                proxyOriginal2Geometry.translate( proxyOriginal2.position.x, 0, proxyOriginal2.position.z );
                // proxyMedianGeometry.translate( proxyMedian.position.x, 0, proxyMedian.position.z );

                console.log("createJointProxies step 10");

                this.ahuObject.resources.joints[`Joint-${gridKey}`][key] = {};

                this.ahuObject.resources.joints[`Joint-${gridKey}`][key] = {};

                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxy1 = JSON.parse(JSON.stringify(proxy1));
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxy2 = JSON.parse(JSON.stringify(proxy2));
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyOriginal1 = JSON.parse(JSON.stringify(proxyOriginal1));
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyOriginal2 = JSON.parse(JSON.stringify(proxyOriginal2));
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian = JSON.parse(JSON.stringify(proxyMedian));

                console.log("createJointProxies step 11");

                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxy1.coordinates = this.mapProxyVertices(proxy1Geometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxy2.coordinates = this.mapProxyVertices(proxy2Geometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyOriginal1.coordinates = this.mapProxyVertices(proxyOriginal1Geometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyOriginal2.coordinates = this.mapProxyVertices(proxyOriginal2Geometry);
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.geometry = proxyMedianGeometry;

                console.log("createJointProxies step 12:", this.ahuObject);
            }
  
        }

        if(sharedData.xzJointDirection == "inwards") {
            this.alignProxyMediansInwards(intersection, gridKey); 
        }
        else if(sharedData.xzJointDirection == "outwards") {
            this.alignProxyMediansOutwards(intersection, gridKey); 
        }

        console.log("createJointProxies step 15");
  
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                let proxyMedianGeometry = this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.geometry;

                const ductPos = this.ahuObject.resources.ducts[duct.id].position;

                proxyMedianGeometry.translate(
                    this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.position.x, 
                    0, 
                    this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.position.z,
                );
                let mappedCoordinates = this.mapProxyVertices(proxyMedianGeometry); 
                this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.coordinates = mappedCoordinates;

                delete this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian.geometry;

                console.log("createJointProxies step 15:", this.ahuObject);

                if(this.ahuObject.resources.joints[`Joint-${gridKey}`][key].proxyMedian2 != undefined) {
                    console.log("createJointProxies step 16:", this.ahuObject);
                    const tempProxy = this.ahuObject.resources.joints[`Joint-${gridKey}`][key];
                    tempProxy.proxyMedian2.position = JSON.parse(JSON.stringify(tempProxy.proxyMedian.position));
                    tempProxy.proxyMedian2.coordinates = JSON.parse(JSON.stringify(tempProxy.proxyMedian.coordinates));
                    for(const i in tempProxy.proxyMedian2.coordinates) {
                        console.log("createJointProxies step 17:", tempProxy.proxyMedian2.coordinates[i]);
                        console.log("createJointProxies step 18:", tempProxy.proxyMedian2.medianOffset);
                        tempProxy.proxyMedian2.coordinates[i].x += tempProxy.proxyMedian2.medianOffset.x;
                        tempProxy.proxyMedian2.coordinates[i].z += tempProxy.proxyMedian2.medianOffset.z;
                    }
                }
                
            }
        }

        console.log("createJointProxies step 16:", this.ahuObject.resources.joints[`Joint-${gridKey}`]);
    }

    calculateAdjacentContext(intersection, largestGlobalSize, definedIntersectionCount) {

        console.log("calculateAdjacentContext started");

        let ductSize1 = 0;
        let ductSize2 = 0;
        const selectedSize = sharedData.xzJointYDirection;
        let sizes = {
            inwards: null,
            outwards: null
        }

        console.log("calculateAdjacentContext step 1");

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

        console.log("calculateAdjacentContext step 2");

        for(const key in intersection) {
            if(intersection[key] != null) {
                intersection[key].proxyLengths = {
                    proxy1: largestGlobalSize,
                    proxy2: largestGlobalSize,
                    proxyMedian: largestGlobalSize
                };
            }
        }

        console.log("calculateAdjacentContext step 3");

        if(sharedData.xzJointContext == "global") {
            return;
        }

        console.log("calculateAdjacentContext step 4");

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.down != null) {
                return
            }
            if(intersection.left != null && intersection.right != null) {
                return
            }
        }

        console.log("calculateAdjacentContext step 5");

        if(sharedData.xzJointYStyle == "diagonal") {
            for(const key in intersection) {

                console.log("calculateAdjacentContext step 60:", intersection[key]);
                
                if(intersection[key] != null) {
                    const currentSize = this.innerDuctDimensions[intersection[key].xetoDuct.graphicLocation.size];
                    intersection[key].proxyLengths.proxy1 = currentSize;
                    intersection[key].proxyLengths.proxy2 = currentSize;
                }
            }

            if(intersection.up != null && intersection.left != null) {
                ductSize1 = this.getSize(intersection.up);
                ductSize2 = this.getSize(intersection.left);
    
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if(intersection.left != null && intersection.down != null) {
                ductSize1 = this.getSize(intersection.left);
                ductSize2 = this.getSize(intersection.down);
    
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if(intersection.down != null && intersection.right != null) {
                ductSize1 = this.getSize(intersection.down);
                ductSize2 = this.getSize(intersection.right);
    
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            if(intersection.right != null && intersection.up != null) {
                ductSize1 = this.getSize(intersection.right);
                ductSize2 = this.getSize(intersection.up);
    
                compareSizes(sizes, ductSize1, ductSize2);
                intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
            }

            
        }
        else if(sharedData.xzJointYStyle == "orthogonal") {
            
            if(definedIntersectionCount == 4) {

                //////////////////
                // up-left proxies
                //////////////////

                console.log("calculateAdjacentContext step 6");
    
                ductSize1 = this.getSize(intersection.up);
                console.log("calculateAdjacentContext step 7");
                ductSize2 = this.getSize( intersection.left );
    
                compareSizes(sizes, ductSize1, ductSize2);
    
                intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
    
                //////////////////
                // down-left proxies
                //////////////////
                
                ductSize1 = this.getSize( intersection.left );
                ductSize2 = this.getSize( intersection.down );
    
                compareSizes(sizes, ductSize1, ductSize2)
    
                intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.down.proxyLengths.proxy1 = sizes[selectedSize];
    
                //////////////////
                // down-right proxies
                //////////////////
                
                ductSize1 = this.getSize( intersection.down );
                ductSize2 = this.getSize( intersection.right );
    
                compareSizes(sizes, ductSize1, ductSize2);
    
                intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
    
                //////////////////
                // up-right proxies
                //////////////////
                
                ductSize1 = this.getSize( intersection.right );
                ductSize2 = this.getSize( intersection.up);
    
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
                    ductSize1 = this.getSize( intersection.up);
                    ductSize2 = this.getSize( intersection.left );
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
                }
    
                //////////////////
                // down-left proxies
                //////////////////
    
                if(intersection.left != null && intersection.down != null) {
                    ductSize1 = this.getSize( intersection.left );
                    ductSize2 = this.getSize( intersection.down );
    
                    compareSizes(sizes, ductSize1, ductSize2)
    
                    intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.down.proxyLengths.proxy1 = sizes[selectedSize];
                }
    
                //////////////////
                // down-right proxies
                //////////////////
    
                if(intersection.down != null && intersection.right != null) {
                    ductSize1 = this.getSize( intersection.down );
                    ductSize2 = this.getSize( intersection.right );
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
                }
    
                //////////////////
                // up-right proxies
                //////////////////
    
                if(intersection.right != null && intersection.up != null) {
                    ductSize1 = this.getSize( intersection.right );
                    ductSize2 = this.getSize( intersection.up);
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                }
    
                //////////////////
                // up-down proxies
                //////////////////
    
                if(intersection.left == null) {
                    ductSize1 = this.getSize( intersection.up);
                    ductSize2 = this.getSize( intersection.down );
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                }
                if(intersection.right != null) {
                    ductSize1 = this.getSize( intersection.up);
                    ductSize2 = this.getSize( intersection.down );
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                }

                //////////////////
                // left-right proxies
                //////////////////
    
                if(intersection.down == null) {
                    ductSize1 = this.getSize( intersection.left );
                    ductSize2 = this.getSize( intersection.right );
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
                }
                else if(intersection.up == null) {
                    ductSize1 = this.getSize( intersection.left );
                    ductSize2 = this.getSize( intersection.right );
    
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

                console.log("calculateAdjacentContext step 6");
    
                if(intersection.up != null && intersection.left != null) {

                    ductSize1 = this.getSize( intersection.up);
                    ductSize2 = this.getSize( intersection.left );
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.up.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.up.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.left.proxyLengths.proxy1 = sizes[selectedSize];
                }
    
                //////////////////
                // down-left proxies
                //////////////////
    
                if(intersection.left != null && intersection.down != null) {
                    ductSize1 = this.getSize( intersection.left );
                    ductSize2 = this.getSize( intersection.down );
    
                    compareSizes(sizes, ductSize1, ductSize2)
    
                    intersection.left.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.left.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.down.proxyLengths.proxy1 = sizes[selectedSize];
                }
    
                //////////////////
                // down-right proxies
                //////////////////
    
                if(intersection.down != null && intersection.right != null) {
                    ductSize1 = this.getSize( intersection.down );
                    ductSize2 = this.getSize( intersection.right );
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.down.proxyLengths.proxy2 = sizes[selectedSize];
                    intersection.down.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.right.proxyLengths.proxy2 = sizes[selectedSize];
                }
    
                //////////////////
                // up-right proxies
                //////////////////
    
                if(intersection.right != null && intersection.up != null) {
                    console.log("calculateAdjacentContext step 6.5");

                    ductSize1 = this.getSize(intersection.right);
                    ductSize2 = this.getSize(intersection.up);

                    console.log("calculateAdjacentContext step 7");
    
                    compareSizes(sizes, ductSize1, ductSize2);
    
                    intersection.right.proxyLengths.proxy1 = sizes[selectedSize];
                    intersection.right.proxyLengths.proxyMedian = sizes[selectedSize];
                    intersection.up.proxyLengths.proxy2 = sizes[selectedSize];

                    console.log("calculateAdjacentContext step 8");
                }
                
            }
        }

    }

    getSize(duct) {
        const size = this.ahuObject.resources.ducts[duct.id].dimensions.z;
        return size;
    }

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

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {

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

                    medianOffset += sharedData.xzJointPadding;

                    medianOffset = {
                        x: medianOffset,
                        z: medianOffset * 0
                    }

                    upProxies.proxyMedian2 = {};
                    upProxies.proxyMedian2.medianOffset = medianOffset;
                }

                console.log("alignProxyMediansInwards step 10:", this.ahuObject);
            }
            else if(intersection.down != null && intersection.right != null) {
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = rightProxies.proxy2.position.z;

                rightProxies.proxyMedian.position.x = downProxies.proxy1.position.x;

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                    medianOffset += sharedData.xzJointPadding;

                    medianOffset = {
                        x: medianOffset * 0,
                        z: medianOffset * 0
                    }

                    rightProxies.proxyMedian2 = {};
                    rightProxies.proxyMedian2.medianOffset = medianOffset;
                }
            }
            else if(intersection.up != null && intersection.left != null) {
                upProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                leftProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                    medianOffset += sharedData.xzJointPadding;

                    medianOffset = {
                        x: medianOffset * 0,
                        z: medianOffset * 0
                    }

                    leftProxies.proxyMedian2 = {};
                    leftProxies.proxyMedian2.medianOffset = medianOffset;
                }
            }
            else if(intersection.down != null && intersection.left != null) {
                leftProxies.proxyMedian.position.x = downProxies.proxy1.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                    medianOffset += sharedData.xzJointPadding;

                    medianOffset = {
                        x: medianOffset * 0,
                        z: medianOffset * 0
                    }

                    downProxies.proxyMedian2 = {};
                    downProxies.proxyMedian2.medianOffset = medianOffset;
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

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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
                
                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

            if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                    medianOffset += sharedData.xzJointPadding;

                    medianOffset = {
                        x: medianOffset * 0,
                        z: medianOffset * 0
                    }

                    upProxies.proxyMedian2 = {};
                    upProxies.proxyMedian2.medianOffset = medianOffset;

                }
            }
            else if(intersection.down != null && intersection.right != null) {
                downProxies.proxyMedian.position.x = rightProxies.proxy2.position.x;
                rightProxies.proxyMedian.position.x = downProxies.proxy1.position.x;

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                    medianOffset += sharedData.xzJointPadding;

                    medianOffset = {
                        x: medianOffset * 0,
                        z: medianOffset * 0
                    }

                    rightProxies.proxyMedian2 = {};
                    rightProxies.proxyMedian2.medianOffset = medianOffset;
                }
            }
            else if(intersection.up != null && intersection.left != null) {
                upProxies.proxyMedian.position.x = leftProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.x = upProxies.proxy2.position.x;
                leftProxies.proxyMedian.position.z = leftProxies.proxy2.position.z;

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                    medianOffset += sharedData.xzJointPadding;

                    medianOffset = {
                        x: medianOffset * 0,
                        z: medianOffset * 0
                    }

                    leftProxies.proxyMedian2 = {};
                    leftProxies.proxyMedian2.medianOffset = medianOffset;
                }
            }
            else if(intersection.down != null && intersection.left != null) {
                leftProxies.proxyMedian.position.z = downProxies.proxy1.position.z;
                downProxies.proxyMedian.position.x = downProxies.proxy2.position.x;
                downProxies.proxyMedian.position.z = leftProxies.proxy1.position.z;
                
                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                    medianOffset += sharedData.xzJointPadding;

                    medianOffset = {
                        x: medianOffset * 0,
                        z: medianOffset * 0
                    }

                    downProxies.proxyMedian2 = {};
                    downProxies.proxyMedian2.medianOffset = medianOffset;
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

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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
                
                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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
                
                if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

            if(sharedData.xzJointStyle == "diagonal" || sharedData.xzJointStyle == "arc") {
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

    mapProxyVertices(proxyGeometry) {
        // const proxyBB = new THREE.Box3().setFromObject(detachedProxy);
        const proxyBB = new THREE.Box3().setFromBufferAttribute(proxyGeometry.attributes.position);
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

        let vertexIndicators = [];
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
            vertexIndicators.push(vertexIndicator);
        });

        return vertexIndicators;
        
    }

}