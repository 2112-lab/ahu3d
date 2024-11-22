import * as THREE from 'three';

export default class Joints {
    constructor(sceneHelper) {
        this.sceneHelper = sceneHelper;
        this.innerDim = {
            small: 500,
            medium: 1000,
            large: 1500
        }
    }
    createOrthogonalCrossJoint(intersection, jointStyle) {
        if(jointStyle == "outwards") {
            this.connectProxiesVertically(
                intersection.right.segment.duct.userData.proxy2Vertices, 
                intersection.down.segment.duct.userData.proxyMedianVertices
            );
            this.connectProxiesHorizontally(
                intersection.down.segment.duct.userData.proxy2Vertices,
                intersection.down.segment.duct.userData.proxyMedianVertices
            );
    
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.down.segment.duct.userData.proxy1Vertices[7],
                intersection.down.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesHorizontally(
                intersection.down.segment.duct.userData.proxy1Vertices,
                intersection.left.segment.duct.userData.proxyMedianVertices
            );        
            this.connectProxiesVertically(
                intersection.left.segment.duct.userData.proxy2Vertices, 
                intersection.left.segment.duct.userData.proxyMedianVertices
            );
    
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.left.segment.duct.userData.proxy1Vertices[7],
                intersection.left.segment.duct.userData.proxy2Vertices[7],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[7]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[5]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[7],
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.left.segment.duct.userData.proxy1Vertices
            );
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.up.segment.duct.userData.proxy1Vertices
            );
    
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[7],
                intersection.up.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.up.segment.duct.userData.proxy1Vertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxy2Vertices, 
                intersection.right.segment.duct.userData.proxyMedianVertices
            );
            this.connectProxiesVertically(
                intersection.right.segment.duct.userData.proxyMedianVertices, 
                intersection.right.segment.duct.userData.proxy1Vertices
            );
    
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.right.segment.duct.userData.proxy1Vertices[7],
                intersection.right.segment.duct.userData.proxy2Vertices[7],
                intersection.right.segment.duct.userData.proxyOriginal2Vertices[7]
            );
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.right.segment.duct.userData.proxy1Vertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[5],
                intersection.right.segment.duct.userData.proxyOriginal2Vertices[5]
            );
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.right.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.right.segment.duct.userData.proxyOriginal2Vertices[7],
                intersection.right.segment.duct.userData.proxyOriginal1Vertices[6]
            );
            
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyMedianVertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.up.segment.duct.userData.proxyMedianVertices[4]
            );
        }
        else {
            this.connectProxiesHorizontally(
                intersection.right.segment.duct.userData.proxy2Vertices, 
                intersection.down.segment.duct.userData.proxyMedianVertices
            );
            this.connectProxiesVertically(
                intersection.down.segment.duct.userData.proxy2Vertices,
                intersection.down.segment.duct.userData.proxyMedianVertices
            );
    
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.down.segment.duct.userData.proxy1Vertices[7],
                intersection.down.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesVertically(
                intersection.down.segment.duct.userData.proxy1Vertices,
                intersection.left.segment.duct.userData.proxyMedianVertices
            );        
            this.connectProxiesHorizontally(
                intersection.left.segment.duct.userData.proxy2Vertices, 
                intersection.left.segment.duct.userData.proxyMedianVertices
            );
    
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.left.segment.duct.userData.proxy1Vertices[7],
                intersection.left.segment.duct.userData.proxy2Vertices[7],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[7]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[5]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[7],
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.left.segment.duct.userData.proxy1Vertices
            );
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.up.segment.duct.userData.proxy1Vertices
            );
    
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[7],
                intersection.up.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.up.segment.duct.userData.proxy1Vertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxy2Vertices, 
                intersection.right.segment.duct.userData.proxyMedianVertices
            );
            this.connectProxiesHorizontally(
                intersection.right.segment.duct.userData.proxyMedianVertices, 
                intersection.right.segment.duct.userData.proxy1Vertices
            );
    
            // this.connectPoints(
            //     intersection.right.segment.duct.userData.proxyOriginal1Vertices[7],
            //     intersection.right.segment.duct.userData.proxy1Vertices[7],
            //     intersection.right.segment.duct.userData.proxy2Vertices[7],
            //     intersection.right.segment.duct.userData.proxyOriginal2Vertices[7]
            // );
            // this.connectPoints(
            //     intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
            //     intersection.right.segment.duct.userData.proxy1Vertices[5],
            //     intersection.right.segment.duct.userData.proxy2Vertices[5],
            //     intersection.right.segment.duct.userData.proxyOriginal2Vertices[5]
            // );
            // this.connectPoints(
            //     intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
            //     intersection.right.segment.duct.userData.proxyOriginal2Vertices[4],
            //     intersection.right.segment.duct.userData.proxyOriginal2Vertices[7],
            //     intersection.right.segment.duct.userData.proxyOriginal1Vertices[6]
            // );

            this.connectPoints(
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxyMedianVertices[5],
                intersection.right.segment.duct.userData.proxyMedianVertices[6]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy1Vertices[4],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices[6],
                intersection.up.segment.duct.userData.proxyMedianVertices[7]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[6],
                intersection.down.segment.duct.userData.proxyMedianVertices[7],
                intersection.left.segment.duct.userData.proxyMedianVertices[4]
            );
            this.connectPoints(
                intersection.right.segment.duct.userData.proxy1Vertices[7],
                intersection.right.segment.duct.userData.proxyMedianVertices[4],
                intersection.down.segment.duct.userData.proxyMedianVertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[6]
            );
            
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyMedianVertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.up.segment.duct.userData.proxyMedianVertices[4]
            );
        }
    }

    createOrthogonalTJoint(intersection, jointStyle) {
        if(jointStyle == "outwards") {
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxy2Vertices, 
                intersection.down.segment.duct.userData.proxyMedianVertices
            );
    
            this.connectProxiesVertically(
                intersection.down.segment.duct.userData.proxy2Vertices,
                intersection.down.segment.duct.userData.proxyMedianVertices
            );
            
    
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.down.segment.duct.userData.proxy1Vertices[7],
                intersection.down.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesVertically(
                intersection.down.segment.duct.userData.proxy1Vertices,
                intersection.left.segment.duct.userData.proxyMedianVertices
            );        
            this.connectProxiesHorizontally(
                intersection.left.segment.duct.userData.proxy2Vertices, 
                intersection.left.segment.duct.userData.proxyMedianVertices
            );
            
    
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.left.segment.duct.userData.proxy1Vertices[7],
                intersection.left.segment.duct.userData.proxy2Vertices[7],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[7]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[5]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[7],
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.left.segment.duct.userData.proxy1Vertices
            );
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.up.segment.duct.userData.proxy1Vertices
            );
            
    
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[7],
                intersection.up.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.up.segment.duct.userData.proxy1Vertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[6]
            );
            
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.up.segment.duct.userData.proxyMedianVertices[4]
            );
        }
        else {
            this.connectProxiesHorizontally(
                intersection.down.segment.duct.userData.proxy2Vertices, 
                intersection.down.segment.duct.userData.proxyMedianVertices
            );
    
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxy2Vertices,
                intersection.down.segment.duct.userData.proxyMedianVertices
            );
            
    
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.down.segment.duct.userData.proxy1Vertices[7],
                intersection.down.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.down.segment.duct.userData.proxy1Vertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesVertically(
                intersection.down.segment.duct.userData.proxy1Vertices,
                intersection.left.segment.duct.userData.proxyMedianVertices
            );        
            this.connectProxiesHorizontally(
                intersection.left.segment.duct.userData.proxy2Vertices, 
                intersection.left.segment.duct.userData.proxyMedianVertices
            );
            
    
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.left.segment.duct.userData.proxy1Vertices[7],
                intersection.left.segment.duct.userData.proxy2Vertices[7],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[7]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[5]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.left.segment.duct.userData.proxyOriginal2Vertices[7],
                intersection.left.segment.duct.userData.proxyOriginal1Vertices[6]
            );
    
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.left.segment.duct.userData.proxy1Vertices
            );
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxyMedianVertices, 
                intersection.up.segment.duct.userData.proxy1Vertices
            );
            
    
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[7],
                intersection.up.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.up.segment.duct.userData.proxy1Vertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[6]
            );
            
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.left.segment.duct.userData.proxyMedianVertices[5],
                intersection.up.segment.duct.userData.proxyMedianVertices[4]
            );

            this.connectPoints(
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxyMedianVertices[5],
                intersection.up.segment.duct.userData.proxy2Vertices[6]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxyMedianVertices[7],
                intersection.left.segment.duct.userData.proxy1Vertices[4],
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxyMedianVertices[6]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxyMedianVertices[7],
                intersection.down.segment.duct.userData.proxyMedianVertices[6],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.down.segment.duct.userData.proxy1Vertices[6]
            );
        }
    }

    createOrthogonalLJoint(intersection, jointStyle) {
        if(jointStyle == "outwards") {
            this.connectProxiesVertically(
                intersection.right.segment.duct.userData.proxyMedianVertices, 
                intersection.right.segment.duct.userData.proxy1Vertices
            );
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxyMedianVertices,
                intersection.right.segment.duct.userData.proxy2Vertices
            );
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxy1Vertices, 
                intersection.up.segment.duct.userData.proxyMedianVertices
            );
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxy2Vertices,
                intersection.right.segment.duct.userData.proxyMedianVertices
            );
    
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyMedianVertices[7],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.up.segment.duct.userData.proxyMedianVertices[5],
                intersection.up.segment.duct.userData.proxy1Vertices[4]
            );
        }
        else {
            this.connectProxiesHorizontally(
                intersection.right.segment.duct.userData.proxyMedianVertices, 
                intersection.right.segment.duct.userData.proxy1Vertices
            );
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxyMedianVertices,
                intersection.right.segment.duct.userData.proxy2Vertices
            );
            this.connectProxiesHorizontally(
                intersection.up.segment.duct.userData.proxy1Vertices, 
                intersection.up.segment.duct.userData.proxyMedianVertices
            );
            this.connectProxiesVertically(
                intersection.up.segment.duct.userData.proxy2Vertices,
                intersection.right.segment.duct.userData.proxyMedianVertices
            );
            
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxyMedianVertices[5],
                intersection.right.segment.duct.userData.proxyMedianVertices[6],
                intersection.up.segment.duct.userData.proxy2Vertices[7]
            );
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxyMedianVertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[7]
            );
        }
    }

    createDiagonalCrossJoint(intersection) {
        // top-left
        this.connectProxiesDiagonalUphill(
            intersection.left.segment.duct.userData.proxy1Vertices,
            intersection.up.segment.duct.userData.proxy1Vertices
        );
        // bottom-right
        this.connectProxiesDiagonalUphill(
            intersection.down.segment.duct.userData.proxy2Vertices,
            intersection.right.segment.duct.userData.proxy2Vertices
        );
        // bottom-left
        this.connectProxiesDiagonalDownhill(
            intersection.left.segment.duct.userData.proxy2Vertices,
            intersection.down.segment.duct.userData.proxy1Vertices
        );
        // top-right
        this.connectProxiesDiagonalDownhill(
            intersection.up.segment.duct.userData.proxy2Vertices,
            intersection.right.segment.duct.userData.proxy1Vertices
        );

        this.connectPoints(
            intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.down.segment.duct.userData.proxy1Vertices[7],
            intersection.down.segment.duct.userData.proxy2Vertices[4]
        );
        this.connectPoints(
            intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
            intersection.down.segment.duct.userData.proxyOriginal1Vertices[6],
            intersection.down.segment.duct.userData.proxy1Vertices[6],
            intersection.down.segment.duct.userData.proxy2Vertices[5]
        );
        this.connectPoints(
            intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
            intersection.down.segment.duct.userData.proxyOriginal1Vertices[6]
        );

        this.connectPoints(
            intersection.left.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.left.segment.duct.userData.proxy1Vertices[7],
            intersection.left.segment.duct.userData.proxy2Vertices[7],
            intersection.left.segment.duct.userData.proxyOriginal2Vertices[7]
        );
        this.connectPoints(
            intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
            intersection.left.segment.duct.userData.proxy1Vertices[5],
            intersection.left.segment.duct.userData.proxy2Vertices[5],
            intersection.left.segment.duct.userData.proxyOriginal2Vertices[5]
        );
        this.connectPoints(
            intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
            intersection.left.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.left.segment.duct.userData.proxyOriginal2Vertices[7],
            intersection.left.segment.duct.userData.proxyOriginal1Vertices[6]
        );

        this.connectPoints(
            intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.up.segment.duct.userData.proxy1Vertices[7],
            intersection.up.segment.duct.userData.proxy2Vertices[4]
        );
        this.connectPoints(
            intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
            intersection.up.segment.duct.userData.proxyOriginal1Vertices[6],
            intersection.up.segment.duct.userData.proxy1Vertices[6],
            intersection.up.segment.duct.userData.proxy2Vertices[5]
        );
        this.connectPoints(
            intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
            intersection.up.segment.duct.userData.proxyOriginal1Vertices[6]
        );

        this.connectPoints(
            intersection.right.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.right.segment.duct.userData.proxy1Vertices[7],
            intersection.right.segment.duct.userData.proxy2Vertices[7],
            intersection.right.segment.duct.userData.proxyOriginal2Vertices[7]
        );
        this.connectPoints(
            intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
            intersection.right.segment.duct.userData.proxy1Vertices[5],
            intersection.right.segment.duct.userData.proxy2Vertices[5],
            intersection.right.segment.duct.userData.proxyOriginal2Vertices[5]
        );
        this.connectPoints(
            intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
            intersection.right.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.right.segment.duct.userData.proxyOriginal2Vertices[7],
            intersection.right.segment.duct.userData.proxyOriginal1Vertices[6]
        );

        this.connectPoints(
            intersection.up.segment.duct.userData.proxy2Vertices[5],
            intersection.up.segment.duct.userData.proxy2Vertices[4],
            intersection.up.segment.duct.userData.proxy1Vertices[7],
            intersection.up.segment.duct.userData.proxy1Vertices[6]
        );
        this.connectPoints(
            intersection.left.segment.duct.userData.proxy2Vertices[7],
            intersection.left.segment.duct.userData.proxy2Vertices[4],
            intersection.left.segment.duct.userData.proxy1Vertices[5],
            intersection.left.segment.duct.userData.proxy1Vertices[6]
        );
        this.connectPoints(
            intersection.down.segment.duct.userData.proxy2Vertices[5],
            intersection.down.segment.duct.userData.proxy2Vertices[4],
            intersection.down.segment.duct.userData.proxy1Vertices[7],
            intersection.down.segment.duct.userData.proxy1Vertices[6]
        );

        this.connectPoints(
            intersection.right.segment.duct.userData.proxy1Vertices[5],
            intersection.up.segment.duct.userData.proxy2Vertices[5],
            intersection.up.segment.duct.userData.proxy1Vertices[6],
            intersection.left.segment.duct.userData.proxy1Vertices[6]
        );
        this.connectPoints(
            intersection.right.segment.duct.userData.proxy1Vertices[5],
            intersection.left.segment.duct.userData.proxy1Vertices[6],
            intersection.left.segment.duct.userData.proxy2Vertices[6],
            intersection.right.segment.duct.userData.proxy2Vertices[4]
        );
        this.connectPoints(
            intersection.right.segment.duct.userData.proxy2Vertices[4],
            intersection.down.segment.duct.userData.proxy2Vertices[4],
            intersection.down.segment.duct.userData.proxy1Vertices[7],
            intersection.left.segment.duct.userData.proxy2Vertices[7]
        );
    }

    createDiagonalTJoint(intersection) {
        // top-left
        this.connectProxiesDiagonalUphill(
            intersection.left.segment.duct.userData.proxy1Vertices,
            intersection.up.segment.duct.userData.proxy1Vertices
        );
        // bottom-left
        this.connectProxiesDiagonalDownhill(
            intersection.left.segment.duct.userData.proxy2Vertices,
            intersection.down.segment.duct.userData.proxy1Vertices
        );

        this.connectPoints(
            intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.down.segment.duct.userData.proxy1Vertices[7],
            intersection.down.segment.duct.userData.proxy2Vertices[4]
        );
        this.connectPoints(
            intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
            intersection.down.segment.duct.userData.proxyOriginal1Vertices[6],
            intersection.down.segment.duct.userData.proxy1Vertices[6],
            intersection.down.segment.duct.userData.proxy2Vertices[5]
        );
        this.connectPoints(
            intersection.down.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
            intersection.down.segment.duct.userData.proxyOriginal1Vertices[6]
        );

        this.connectPoints(
            intersection.left.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.left.segment.duct.userData.proxy1Vertices[7],
            intersection.left.segment.duct.userData.proxy2Vertices[7],
            intersection.left.segment.duct.userData.proxyOriginal2Vertices[7]
        );
        this.connectPoints(
            intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
            intersection.left.segment.duct.userData.proxy1Vertices[5],
            intersection.left.segment.duct.userData.proxy2Vertices[5],
            intersection.left.segment.duct.userData.proxyOriginal2Vertices[5]
        );
        this.connectPoints(
            intersection.left.segment.duct.userData.proxyOriginal1Vertices[5],
            intersection.left.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.left.segment.duct.userData.proxyOriginal2Vertices[7],
            intersection.left.segment.duct.userData.proxyOriginal1Vertices[6]
        );

        this.connectPoints(
            intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.up.segment.duct.userData.proxy1Vertices[7],
            intersection.up.segment.duct.userData.proxy2Vertices[4]
        );
        this.connectPoints(
            intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
            intersection.up.segment.duct.userData.proxyOriginal1Vertices[6],
            intersection.up.segment.duct.userData.proxy1Vertices[6],
            intersection.up.segment.duct.userData.proxy2Vertices[5]
        );
        this.connectPoints(
            intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
            intersection.up.segment.duct.userData.proxyOriginal2Vertices[4],
            intersection.up.segment.duct.userData.proxyOriginal2Vertices[5],
            intersection.up.segment.duct.userData.proxyOriginal1Vertices[6]
        );

        this.connectPoints(
            intersection.up.segment.duct.userData.proxy2Vertices[5],
            intersection.up.segment.duct.userData.proxy2Vertices[4],
            intersection.up.segment.duct.userData.proxy1Vertices[7],
            intersection.up.segment.duct.userData.proxy1Vertices[6]
        );
        this.connectPoints(
            intersection.left.segment.duct.userData.proxy2Vertices[7],
            intersection.left.segment.duct.userData.proxy2Vertices[4],
            intersection.left.segment.duct.userData.proxy1Vertices[5],
            intersection.left.segment.duct.userData.proxy1Vertices[6]
        );
        this.connectPoints(
            intersection.down.segment.duct.userData.proxy2Vertices[5],
            intersection.down.segment.duct.userData.proxy2Vertices[4],
            intersection.down.segment.duct.userData.proxy1Vertices[7],
            intersection.down.segment.duct.userData.proxy1Vertices[6]
        );

        this.connectProxiesVertically(
            intersection.up.segment.duct.userData.proxy2Vertices,
            intersection.down.segment.duct.userData.proxy2Vertices
        );

        this.connectPoints(
            intersection.up.segment.duct.userData.proxy2Vertices[5],
            intersection.up.segment.duct.userData.proxy1Vertices[6],
            intersection.down.segment.duct.userData.proxy1Vertices[7],
            intersection.down.segment.duct.userData.proxy2Vertices[4]
        );
        this.connectPoints(
            intersection.up.segment.duct.userData.proxy1Vertices[6],
            intersection.left.segment.duct.userData.proxy1Vertices[6],
            intersection.left.segment.duct.userData.proxy2Vertices[7],
            intersection.down.segment.duct.userData.proxy1Vertices[7]
        );
    }

    createDiagonalLJoint(intersection) {
        let proxy3Vertices = JSON.parse(JSON.stringify(intersection.up.segment.duct.userData.proxy1Vertices));
        proxy3Vertices[0].z = intersection.right.segment.duct.userData.proxy2Vertices[0].z;
        proxy3Vertices[1].z = intersection.right.segment.duct.userData.proxy2Vertices[1].z;
        proxy3Vertices[2].z = intersection.right.segment.duct.userData.proxy2Vertices[2].z;
        proxy3Vertices[3].z = intersection.right.segment.duct.userData.proxy2Vertices[3].z;
        proxy3Vertices[4].z = intersection.right.segment.duct.userData.proxy2Vertices[4].z;
        proxy3Vertices[5].z = intersection.right.segment.duct.userData.proxy2Vertices[5].z;
        proxy3Vertices[6].z = intersection.right.segment.duct.userData.proxy2Vertices[6].z;
        proxy3Vertices[7].z = intersection.right.segment.duct.userData.proxy2Vertices[7].z;
        this.renderProxyVertices(proxy3Vertices);

        this.connectProxiesVertically(
            intersection.up.segment.duct.userData.proxy1Vertices, 
            proxy3Vertices
        );
        this.connectProxiesHorizontally(
            proxy3Vertices,
            intersection.right.segment.duct.userData.proxy2Vertices, 
        );
        this.connectProxiesDiagonalDownhill(
            intersection.up.segment.duct.userData.proxy2Vertices,
            intersection.right.segment.duct.userData.proxy1Vertices
        );

        this.connectPoints(
            intersection.up.segment.duct.userData.proxy2Vertices[7],
            intersection.up.segment.duct.userData.proxy1Vertices[4],
            intersection.right.segment.duct.userData.proxy1Vertices[6],
            intersection.right.segment.duct.userData.proxy1Vertices[7]
        );
        this.connectPoints(
            intersection.up.segment.duct.userData.proxy1Vertices[7],
            proxy3Vertices[7],
            intersection.right.segment.duct.userData.proxy2Vertices[7],
            intersection.right.segment.duct.userData.proxy1Vertices[7]
        );
    }

    connectProxiesDiagonalDownhill(leftProxy, rightProxy) {
        //front strip
        this.connectPoints(
            leftProxy[1],
            rightProxy[1],
            rightProxy[3],
            leftProxy[3]
        );
        // back strip
        this.connectPoints(
            leftProxy[5],
            rightProxy[5],
            rightProxy[7],
            leftProxy[7]
        );
        // front panel
        this.connectPoints(
            leftProxy[1],
            leftProxy[5],
            rightProxy[5],
            rightProxy[1]
        );
        // back panel
        this.connectPoints(
            leftProxy[3],
            leftProxy[7],
            rightProxy[7],
            rightProxy[3]
        );
    }

    connectProxiesDiagonalUphill(leftProxy, rightProxy) {
        //front strip
        this.connectPoints(
            leftProxy[0],
            rightProxy[0],
            rightProxy[2],
            leftProxy[2]
        );
        // back strip
        this.connectPoints(
            leftProxy[4],
            rightProxy[4],
            rightProxy[6],
            leftProxy[6]
        );
        // front panel
        this.connectPoints(
            leftProxy[0],
            leftProxy[4],
            rightProxy[4],
            rightProxy[0]
        );
        // back panel
        this.connectPoints(
            leftProxy[2],
            leftProxy[6],
            rightProxy[6],
            rightProxy[2]
        );
    }

    connectProxiesHorizontally(leftProxy, rightProxy) {
        this.connectPoints(
            leftProxy[2],
            rightProxy[2],
            rightProxy[6],
            leftProxy[6]
        );
        this.connectPoints(
            leftProxy[0],
            rightProxy[0],
            rightProxy[4],
            leftProxy[4]
        );
        this.connectPoints(
            leftProxy[3],
            rightProxy[0],
            rightProxy[1],
            leftProxy[2]
        );
        this.connectPoints(
            leftProxy[4],
            rightProxy[7],
            rightProxy[6],
            leftProxy[5]
        );
    }

    connectProxiesVertically(topProxy, bottomProxy) {
        this.connectPoints(
            topProxy[2],
            bottomProxy[3],
            bottomProxy[7],
            topProxy[6]
        );
        this.connectPoints(
            topProxy[1],
            bottomProxy[1],
            bottomProxy[5],
            topProxy[5]
        );
        this.connectPoints(
            topProxy[1],
            bottomProxy[0],
            bottomProxy[3],
            topProxy[2]
        );
        this.connectPoints(
            topProxy[6],
            bottomProxy[7],
            bottomProxy[4],
            topProxy[5]
        );
    }

    connectPoints(pointA, pointB, pointC, pointD, opacity = 1.0) {
        // Create an array of vertices
        const vertices = new Float32Array([
            pointA.x, pointA.y, pointA.z, // Vertex 0
            pointB.x, pointB.y, pointB.z, // Vertex 1
            pointC.x, pointC.y, pointC.z, // Vertex 2
            pointD.x, pointD.y, pointD.z  // Vertex 3
        ]);
  
        // Define the indices for the two triangles (clockwise winding order)
        const indices = [
            0, 1, 2, // First triangle (A -> B -> C)
            0, 2, 3  // Second triangle (A -> C -> D)
        ];
  
        // Create the BufferGeometry
        const geometry = new THREE.BufferGeometry();
  
        // Set the vertices as a BufferAttribute
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  
        // Set the indices
        geometry.setIndex(indices);
  
        // Optionally compute normals if you need lighting effects
        geometry.computeVertexNormals();
  
        // Create a material
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xAEB9C2, 
            side: THREE.DoubleSide
        });
        if(opacity < 1) {
            material.transparent = true;
            material.depthWrite = false;
        }
        else {
            material.transparent = false;
            material.depthWrite = true;
        }
        material.opacity = opacity;
  
        // Create the mesh
        const plane = new THREE.Mesh(geometry, material);
  
        // Add to the scene
        plane.name = "joint";
        plane.renderOrder = 2;
        this.sceneHelper.addToScene(plane);
    } 

    createParallelJoint(intersection, pairDirection) {
        if(pairDirection == "vertical") {
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy1Vertices[1],
                intersection.down.segment.duct.userData.proxy1Vertices[1],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.up.segment.duct.userData.proxy1Vertices[5]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy1Vertices[0],
                intersection.down.segment.duct.userData.proxy1Vertices[0],
                intersection.down.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy1Vertices[0],
                intersection.down.segment.duct.userData.proxy1Vertices[3],
                intersection.down.segment.duct.userData.proxy1Vertices[2],
                intersection.up.segment.duct.userData.proxy1Vertices[1]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.down.segment.duct.userData.proxy1Vertices[4],
                intersection.down.segment.duct.userData.proxy1Vertices[5],
                intersection.up.segment.duct.userData.proxy1Vertices[5]
            );

            this.connectPoints(
                intersection.up.segment.duct.userData.proxyOriginal1Vertices[7],
                intersection.up.segment.duct.userData.proxyOriginal2Vertices[7],
                intersection.up.segment.duct.userData.proxy2Vertices[7],
                intersection.up.segment.duct.userData.proxy1Vertices[7]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.down.segment.duct.userData.proxy1Vertices[5]
            );
            this.connectPoints(
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[4],
                intersection.down.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.down.segment.duct.userData.proxyOriginal1Vertices[5]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.down.segment.duct.userData.proxy2Vertices[4],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.up.segment.duct.userData.proxy1Vertices[5]
            );

            this.connectPoints(
                intersection.up.segment.duct.userData.proxy2Vertices[1],
                intersection.down.segment.duct.userData.proxy2Vertices[1],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.up.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy2Vertices[0],
                intersection.down.segment.duct.userData.proxy2Vertices[0],
                intersection.down.segment.duct.userData.proxy2Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[4]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy2Vertices[0],
                intersection.down.segment.duct.userData.proxy2Vertices[3],
                intersection.down.segment.duct.userData.proxy2Vertices[2],
                intersection.up.segment.duct.userData.proxy2Vertices[1]
            );
            this.connectPoints(
                intersection.up.segment.duct.userData.proxy2Vertices[4],
                intersection.down.segment.duct.userData.proxy2Vertices[4],
                intersection.down.segment.duct.userData.proxy2Vertices[5],
                intersection.up.segment.duct.userData.proxy2Vertices[5]
            );
        }
        if(pairDirection == "horizontal") {
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy1Vertices[2],
                intersection.right.segment.duct.userData.proxy1Vertices[2],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.left.segment.duct.userData.proxy1Vertices[6]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy1Vertices[1],
                intersection.right.segment.duct.userData.proxy1Vertices[1],
                intersection.right.segment.duct.userData.proxy1Vertices[5],
                intersection.left.segment.duct.userData.proxy1Vertices[5]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy1Vertices[1],
                intersection.right.segment.duct.userData.proxy1Vertices[0],
                intersection.right.segment.duct.userData.proxy1Vertices[3],
                intersection.left.segment.duct.userData.proxy1Vertices[2]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy1Vertices[5],
                intersection.right.segment.duct.userData.proxy1Vertices[5],
                intersection.right.segment.duct.userData.proxy1Vertices[6],
                intersection.left.segment.duct.userData.proxy1Vertices[6]
            );

            this.connectPoints(
                intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.right.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[5],
                intersection.right.segment.duct.userData.proxy1Vertices[5]
            );
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyOriginal1Vertices[6],
                intersection.right.segment.duct.userData.proxyOriginal2Vertices[6],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.right.segment.duct.userData.proxy1Vertices[6]
            );
            this.connectPoints(
                intersection.right.segment.duct.userData.proxyOriginal1Vertices[5],
                intersection.right.segment.duct.userData.proxyOriginal2Vertices[5],
                intersection.right.segment.duct.userData.proxyOriginal2Vertices[6],
                intersection.right.segment.duct.userData.proxyOriginal1Vertices[6]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy1Vertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.left.segment.duct.userData.proxy1Vertices[6]
            );

            this.connectPoints(
                intersection.left.segment.duct.userData.proxy2Vertices[2],
                intersection.right.segment.duct.userData.proxy2Vertices[2],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.left.segment.duct.userData.proxy2Vertices[6]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy2Vertices[1],
                intersection.right.segment.duct.userData.proxy2Vertices[1],
                intersection.right.segment.duct.userData.proxy2Vertices[5],
                intersection.left.segment.duct.userData.proxy2Vertices[5]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy2Vertices[1],
                intersection.right.segment.duct.userData.proxy2Vertices[0],
                intersection.right.segment.duct.userData.proxy2Vertices[3],
                intersection.left.segment.duct.userData.proxy2Vertices[2]
            );
            this.connectPoints(
                intersection.left.segment.duct.userData.proxy2Vertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[5],
                intersection.right.segment.duct.userData.proxy2Vertices[6],
                intersection.left.segment.duct.userData.proxy2Vertices[6]
            );
        }
    }

    createJointProxies(intersection, pairDirection = null, jointStyle = "inwards") {
        console.log("createJointProxies started:", intersection);
  
        const wallThickness = 30;
  
        let largestSize = this.innerDim["small"];
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                if(this.innerDim[duct.xetoDuct.graphicLocation.size] > largestSize) {
                    largestSize = this.innerDim[duct.xetoDuct.graphicLocation.size];
                }
            }
        }

        const areHelpersOn = true;

        let material = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        let material2 = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        let material3 = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        let material4 = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        let material5 = new THREE.MeshStandardMaterial({ color: 0xAEB9C2 });
        
        if(areHelpersOn) {
            material.color.setHex("0xFF0000");
            material2.color.setHex("0x0000FF");
            material3.color.setHex("0x00FF00");
            material4.color.setHex("0xFF0000");
            material5.color.setHex("0x0000FF");
        }          

        const y_offset = -30;
  
        for(const key in intersection) {
            let duct = intersection[key];

            if(duct != null) {
                const innerDimensions = duct.segment.duct.userData.component.object.innerDimensions;
    
                const proxy1Geometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset, 
                    wallThickness
                );
                const proxyOriginal1Geometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset, 
                    wallThickness
                );
                const proxyOriginal1 = new THREE.Mesh(proxyOriginal1Geometry, material4); 

                const ductDepth = this.innerDim[duct.xetoDuct.graphicLocation.size];
                this.moveProxyVertices(proxy1Geometry, (largestSize - ductDepth) / 2);

                const proxy1 = new THREE.Mesh(proxy1Geometry, material);
                proxy1.position.copy(duct.segment.duct.userData.component.object.position);
        
                const proxy2Geometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset, 
                    wallThickness
                );
                const proxyOriginal2Geometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset, 
                    wallThickness
                );
                const proxyOriginal2 = new THREE.Mesh(proxyOriginal2Geometry, material5);

                this.moveProxyVertices(proxy2Geometry, (largestSize - ductDepth) / 2);
                const proxy2 = new THREE.Mesh(proxy2Geometry, material2);
        
                const proxyMedianGeometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset,
                    wallThickness
                );
                this.moveProxyVertices(proxyMedianGeometry, (largestSize - ductDepth) / 2);
                const proxyMedian = new THREE.Mesh(proxyMedianGeometry, material3);

                if(key == "up") {
                    proxy1.position.x += (innerDimensions.x / -2);
                    proxy1.position.z += (innerDimensions.z) / -2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.x += (innerDimensions.x);
        
                    proxyMedian.position.copy(proxy1.position);
                }
                else if(key == "down") {
                    proxy1.position.x += (innerDimensions.x / -2);
                    proxy1.position.z += (innerDimensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.x += (innerDimensions.x);
        
                    proxyMedian.position.copy(proxy1.position);
                }
                else if(key == "left") {
                    proxy1.position.x += (innerDimensions.x / 2);
                    proxy1.position.z += (innerDimensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.z += (innerDimensions.z * -1);
        
                    proxyMedian.position.copy(proxy1.position);
                }
                else if(key == "right") {
                    proxy1.position.x += (innerDimensions.x / -2);
                    proxy1.position.z += (innerDimensions.z) / 2;
        
                    proxy2.position.copy(proxy1.position);
                    proxy2.position.z += (innerDimensions.z * -1);
        
                    proxyMedian.position.copy(proxy1.position);
                }   

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

                material.color.setHex("0xFF0000");
                material2.color.setHex("0x0000FF");
                material3.color.setHex("0x00FF00");
                material4.color.setHex("0xFF0000");
                material5.color.setHex("0x0000FF");
        
                proxy1.name = "jointHelper";
                proxy2.name = "jointHelper";
                proxyOriginal1.name = "jointHelper";
                proxyOriginal2.name = "jointHelper";
                proxyMedian.name = "jointHelper";

                proxy1.userData = {
                    helperColor: "0xFF0000",
                    productionColor: "0xAEB9C2"
                };
                proxy2.userData = {
                    helperColor: "0x0000FF",
                    productionColor: "0xAEB9C2"
                };
                proxyOriginal1.userData = {
                    helperColor: "0xFF0000",
                    productionColor: "0xAEB9C2"
                };
                proxyOriginal2.userData = {
                    helperColor: "0x0000FF",
                    productionColor: "0xAEB9C2"
                };
                proxyMedian.userData = {
                    helperColor: "0x00FF00",
                    productionColor: "0xAEB9C2"
                };

                this.sceneHelper.addToScene(proxy1);
                this.sceneHelper.addToScene(proxy2);
                this.sceneHelper.addToScene(proxyOriginal1);
                this.sceneHelper.addToScene(proxyOriginal2);
                if(pairDirection === null && jointStyle !== "diagonal") {
                    this.sceneHelper.addToScene(proxyMedian);
                }

                duct.segment.duct.userData.proxies = {
                    proxy1: proxy1, 
                    proxy2: proxy2,
                    proxyOriginal1: proxyOriginal1, 
                    proxyOriginal2: proxyOriginal2, 
                    proxyMedian: proxyMedian, 
                };

                if(areHelpersOn) {
                    this.renderProxyVertices(proxy1Vertices, areHelpersOn);
                    this.renderProxyVertices(proxy2Vertices, areHelpersOn);
                    this.renderProxyVertices(proxyOriginal1Vertices, areHelpersOn);
                    this.renderProxyVertices(proxyOriginal2Vertices, areHelpersOn);
                }
            }
  
        }

        if(jointStyle == "inwards") {
            this.alignProxyMediansInwards(intersection); 
            
        }
        else if(jointStyle == "outwards") {
            this.alignProxyMediansOutwards(intersection); 
        } 
        else {
            return;
        }                   
  
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                const proxyMedianVertices = this.mapProxyVertices(duct.segment.duct.userData.proxies.proxyMedian);
                duct.segment.duct.userData.proxyMedianVertices = proxyMedianVertices;
                duct.segment.duct.userData.proxyMedianVertices = proxyMedianVertices;
                if(areHelpersOn) {
                    this.renderProxyVertices(proxyMedianVertices);
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
        console.log("definedIntersectionCount:", definedIntersectionCount);

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;
                intersection.right.segment.duct.userData.proxies.proxyMedian.position.z = intersection.up.segment.duct.userData.proxies.proxy2.position.z;
            }
        }
        else if(definedIntersectionCount == 3) {
            if(intersection.up != null && intersection.left != null) {
                // top-left median
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.x = intersection.left.segment.duct.userData.proxies.proxyMedian.position.x;
            }
            if(intersection.down != null) {
                // bottom-right median
                if(intersection.right != null) {
                    intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.right.segment.duct.userData.proxies.proxyMedian.position.x;
                }
                else {
                    intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
                }
                
            }
            if(intersection.left != null && intersection.down != null) {
                // bottom-right median
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxyMedian.position.z;
            }
            if(intersection.right != null && intersection.up != null) {
                // bottom-right median
                intersection.right.segment.duct.userData.proxies.proxyMedian.position.z = intersection.up.segment.duct.userData.proxies.proxyMedian.position.z;
            }
        }
        else if(definedIntersectionCount == 4) {
            // top-left median
            intersection.up.segment.duct.userData.proxies.proxyMedian.position.x = intersection.left.segment.duct.userData.proxies.proxyMedian.position.x;
            // bottom-right median
            intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.right.segment.duct.userData.proxies.proxyMedian.position.x;
            // bottom-right median
            intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxyMedian.position.z;
            // bottom-right median
            intersection.right.segment.duct.userData.proxies.proxyMedian.position.z = intersection.up.segment.duct.userData.proxies.proxyMedian.position.z;
        }
    }

    alignProxyMediansInwards(intersection) {        
        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }
        console.log("definedIntersectionCount:", definedIntersectionCount);

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;
                intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
            }
        }
        else if(definedIntersectionCount == 3) {
            if(intersection.right == null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;

                intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;
                
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
            }
        }
        else if(definedIntersectionCount == 4) {
            // top-left median
            intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;
            // bottom-right median
            intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy2.position.x;
            intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;
            // bottom-left median
            intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
            intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;
            // top-right median
            intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
        }
    }

    moveProxyVertices(proxyGeometry, length) {
        // Access the position attribute
        const positionAttribute = proxyGeometry.attributes.position;

        // Modify specific vertices (example: adjust the top vertices of the box)
        for (let i = 0; i < positionAttribute.count; i++) {
            const y = positionAttribute.getY(i);

            // Example: Move vertices with y > 0.5 upwards by 500 units
            if (y > 0.5) {
                positionAttribute.setY(i, y + length);
            }
            else if (y < 0.5) {
                positionAttribute.setY(i, y - length - 30);
            }
        }

        // Mark the position attribute as needing an update
        positionAttribute.needsUpdate = true;
    }

    mapProxyVertices(proxy) {
        console.log("mapProxyVertices started:", proxy);

        const detachedProxy = proxy.clone();
        // detachedProxy.applyMatrix4(proxy.parent.matrixWorld);
        const proxyBB = new THREE.Box3().setFromObject(detachedProxy);
        const proxyMin = proxyBB.min;
        const proxyMax = proxyBB.max;

        console.log("mapProxyVertices proxyBB:", JSON.stringify(proxyBB));
  
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

        console.log("mapProxyVertices proxyCorners:", proxyCorners);
  
        return proxyCorners;
    }

    renderProxyVertices(proxyCorners) {

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

            const material = new THREE.MeshBasicMaterial({
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
            this.sceneHelper.addToScene(vertexIndicator);
        });
        
    }
}