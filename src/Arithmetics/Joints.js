import * as THREE from 'three';
import { sharedData } from '../3D/Geometry/Joints/Geometry_3D_Joints_Utils.js';
import { moveOriginalProxyVertices, moveProxyVertices } from '../3D/Geometry/Helpers/Geometry_Proxies.js';

export default class Joints {
    constructor(ahuGroup, innerDuctDimensions, sceneHelper, primaryColor) {
        this.ahuGroup = ahuGroup;
        this.innerDuctDimensions = innerDuctDimensions;
        sharedData.sceneHelper = sceneHelper;
        sharedData.primaryColor = primaryColor;

        this.jointBlockStyle = this.ahuGroup.blockStyle.joints;
        sharedData.jointBlockStyle = this.ahuGroup.blockStyle.joints;
        sharedData.xzJointStyle = this.jointBlockStyle.XZ.style;
        sharedData.xzJointDirection = this.jointBlockStyle.XZ.direction;
        sharedData.xzJointContext = this.jointBlockStyle.XZ.context;
        sharedData.xzJointPadding = this.jointBlockStyle.XZ.padding;
        sharedData.xzJointYStyle = this.jointBlockStyle.XZ.yStyle;
        sharedData.xzJointYDirection = this.jointBlockStyle.XZ.yDirection;        
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

        let material = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });
        let material2 = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });
        let material3 = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });
        let material4 = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });
        let material5 = new THREE.MeshStandardMaterial({ color: sharedData.primaryColor });
        
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

                moveProxyVertices(proxy1Geometry, ductDepth, duct.proxyLengths.proxy1, largestGlobalSize);
                moveProxyVertices(proxy2Geometry, ductDepth, duct.proxyLengths.proxy2, largestGlobalSize);
                moveProxyVertices(proxyMedianGeometry, ductDepth, duct.proxyLengths.proxyMedian, largestGlobalSize);
                moveOriginalProxyVertices(proxyOriginal1Geometry);
                moveOriginalProxyVertices(proxyOriginal2Geometry);

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
                    productionColor: "sharedData.primaryColor"
                };
                proxy2.userData = {
                    helperColor: "0x0000FF",
                    productionColor: "sharedData.primaryColor"
                };
                proxyOriginal1.userData = {
                    helperColor: "0xFF0000",
                    productionColor: "sharedData.primaryColor"
                };
                proxyOriginal2.userData = {
                    helperColor: "0x0000FF",
                    productionColor: "sharedData.primaryColor"
                };
                proxyMedian.userData = {
                    helperColor: "0x00FF00",
                    productionColor: "sharedData.primaryColor"
                };

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

                duct.segment.duct.userData.proxies.proxy1.userData.vertexIndicators = this.renderProxyVertices(proxy1Vertices, areHelpersOn);
                duct.segment.duct.userData.proxies.proxy2.userData.vertexIndicators = this.renderProxyVertices(proxy2Vertices, areHelpersOn);
                duct.segment.duct.userData.proxies.proxyOriginal1.userData.vertexIndicators = this.renderProxyVertices(proxyOriginal1Vertices, areHelpersOn);
                duct.segment.duct.userData.proxies.proxyOriginal2.userData.vertexIndicators = this.renderProxyVertices(proxyOriginal2Vertices, areHelpersOn);
            }
  
        }

        if(sharedData.xzJointDirection == "inwards") {
            this.alignProxyMediansInwards(intersection); 
        }
        else if(sharedData.xzJointDirection == "outwards") {
            this.alignProxyMediansOutwards(intersection); 
        }
  
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                const proxyMedianVertices = this.mapProxyVertices(duct.segment.duct.userData.proxies.proxyMedian);
                duct.segment.duct.userData.proxyMedianVertices = proxyMedianVertices;
                duct.segment.duct.userData.proxies.proxyMedian.userData.vertexIndicators = this.renderProxyVertices(proxyMedianVertices, areHelpersOn);
            }
        }

        return largestGlobalSize;
    }

    calculateAdjacentContext(intersection, largestGlobalSize, definedIntersectionCount) {

        let ductSize1 = 0;
        let ductSize2 = 0;
        const selectedSize = sharedData.xzJointYDirection;
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

        if(sharedData.xzJointContext == "global") {
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

        if(sharedData.xzJointYStyle == "diagonal") {
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
        else if(sharedData.xzJointYStyle == "orthogonal") {
            
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

                    let medianOffset = Math.min(
                        this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += sharedData.xzJointPadding;
                    const medianClone = upProxies.proxyMedian.clone();
                    medianClone.position.x += medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.up.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    intersection.up.segment.duct.userData.proxies["medianClone"] = medianClone;
                    upProxies.proxyMedian.position.z += medianOffset;
                }
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
                        this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += sharedData.xzJointPadding;
                    const medianClone = rightProxies.proxyMedian.clone();
                    medianClone.position.x += medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.right.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    intersection.up.segment.duct.userData.proxies["medianClone"] = medianClone;
                    rightProxies.proxyMedian.position.z -= medianOffset;
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
                        this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += sharedData.xzJointPadding;
                    const medianClone = leftProxies.proxyMedian.clone();
                    medianClone.position.x -= medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.left.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    intersection.up.segment.duct.userData.proxies["medianClone"] = medianClone;
                    leftProxies.proxyMedian.position.z += medianOffset;
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
                        this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += sharedData.xzJointPadding;
                    const medianClone = downProxies.proxyMedian.clone();
                    medianClone.position.x -= medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.down.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    intersection.up.segment.duct.userData.proxies["medianClone"] = medianClone;
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
                if(this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size]) {
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

                if(this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size]) {
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
                        this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += sharedData.xzJointPadding;
                    const medianClone = upProxies.proxyMedian.clone();
                    medianClone.position.x += medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.up.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    intersection.up.segment.duct.userData.proxies["medianClone"] = medianClone;
                    upProxies.proxyMedian.position.z += medianOffset;

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
                        this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += sharedData.xzJointPadding;
                    const medianClone = rightProxies.proxyMedian.clone();
                    medianClone.position.x += medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.right.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    intersection.up.segment.duct.userData.proxies["medianClone"] = medianClone;
                    rightProxies.proxyMedian.position.z -= medianOffset;
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
                        this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += sharedData.xzJointPadding;
                    const medianClone = leftProxies.proxyMedian.clone();
                    medianClone.position.x -= medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.left.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    intersection.up.segment.duct.userData.proxies["medianClone"] = medianClone;
                    leftProxies.proxyMedian.position.z += medianOffset;
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
                        this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size],
                        this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]
                    );
                    medianOffset += sharedData.xzJointPadding;
                    const medianClone = downProxies.proxyMedian.clone();
                    medianClone.position.x -= medianOffset;
                    const proxyMedianVerticesClone = this.mapProxyVertices(medianClone);
                    intersection.down.segment.duct.userData.proxyMedianVertices2 = proxyMedianVerticesClone;
                    intersection.up.segment.duct.userData.proxies["medianClone"] = medianClone;
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
                if(this.innerDuctDimensions[intersection.up.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.down.xetoDuct.graphicLocation.size]) {
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
                if(this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size]) {
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

                if(this.innerDuctDimensions[intersection.left.xetoDuct.graphicLocation.size] > this.innerDuctDimensions[intersection.right.xetoDuct.graphicLocation.size]) {
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