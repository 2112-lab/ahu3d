import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export default class Joints {
    constructor(sceneHelper) {
        this.sceneHelper = sceneHelper;
        this.innerDim = {
            small: 500,
            medium: 1000,
            large: 1500
        }
    }
    
    createOrthogonalCrossJoint(intersection, xzJointDirection, largestGlobalSize) {
        const geometries = [];
        if(xzJointDirection == "outwards") {
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.right.segment.duct.userData.proxy2Vertices, 
                    intersection.down.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.down.segment.duct.userData.proxy2Vertices,
                    intersection.down.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.down.segment.duct.userData.proxy1Vertices,
                    intersection.left.segment.duct.userData.proxyMedianVertices
                )  
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.left.segment.duct.userData.proxy2Vertices, 
                    intersection.left.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.up.segment.duct.userData.proxyMedianVertices, 
                    intersection.left.segment.duct.userData.proxy1Vertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.up.segment.duct.userData.proxyMedianVertices, 
                    intersection.up.segment.duct.userData.proxy1Vertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.up.segment.duct.userData.proxy2Vertices, 
                    intersection.right.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.right.segment.duct.userData.proxyMedianVertices, 
                    intersection.right.segment.duct.userData.proxy1Vertices
                )
            );
        }
        else {
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.right.segment.duct.userData.proxy2Vertices, 
                    intersection.down.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.down.segment.duct.userData.proxy2Vertices,
                    intersection.down.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.down.segment.duct.userData.proxy1Vertices,
                    intersection.left.segment.duct.userData.proxyMedianVertices
                ) 
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.left.segment.duct.userData.proxy2Vertices, 
                    intersection.left.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.up.segment.duct.userData.proxyMedianVertices, 
                    intersection.left.segment.duct.userData.proxy1Vertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.up.segment.duct.userData.proxyMedianVertices, 
                    intersection.up.segment.duct.userData.proxy1Vertices
                )
            );
            geometries.push(
                ...this.connectProxiesVertically(
                    intersection.up.segment.duct.userData.proxy2Vertices, 
                    intersection.right.segment.duct.userData.proxyMedianVertices
                )
            );
            geometries.push(
                ...this.connectProxiesHorizontally(
                    intersection.right.segment.duct.userData.proxyMedianVertices, 
                    intersection.right.segment.duct.userData.proxy1Vertices
                )
            );
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

        geometries.push(
            ...this.createJointClosure(intersection.up.segment.duct, "horizontal")
        );
        geometries.push(
            ...this.createJointClosure(intersection.right.segment.duct, "vertical")
        );
        geometries.push(
            ...this.createJointClosure(intersection.down.segment.duct, "horizontal")
        );
        geometries.push(
            ...this.createJointClosure(intersection.left.segment.duct, "vertical")
        );
        
        this.createJointBackwall(backwall, largestGlobalSize);

        this.mergeAndAddToScene(geometries);

    }

    createOrthogonalTJoint(intersection, xzJointDirection, largestGlobalSize) {
        const geometries = [];
        if(xzJointDirection == "outwards") {
            if(intersection.right == null) {
                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.down.segment.duct.userData.proxy2Vertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.down.segment.duct.userData.proxy2Vertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )   
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    ) 
                );         
            }
            else if(intersection.left == null) {
                if(intersection.up.segment.duct.userData.proxyMedianVertices[0].z == intersection.up.segment.duct.userData.proxy1Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.down.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.down.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.up == null) {
                if(intersection.right.segment.duct.userData.proxyMedianVertices[0].z == intersection.right.segment.duct.userData.proxy1Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        ) 
                    );
                }
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    ) 
                );       
            }
        }
        else if(xzJointDirection == "inwards") {
            if(intersection.right == null) {
                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.down.segment.duct.userData.proxy2Vertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.down.segment.duct.userData.proxy2Vertices, 
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.up.segment.duct.userData.proxy2Vertices,
                            intersection.down.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy1Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )  
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.up.segment.duct.userData.proxy1Vertices
                    )
                );
            }
            else if(intersection.left == null) {
                if(intersection.up.segment.duct.userData.proxyMedianVertices[0].z == intersection.up.segment.duct.userData.proxy1Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.down.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.up.segment.duct.userData.proxyMedianVertices, 
                            intersection.up.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.down.segment.duct.userData.proxy1Vertices,
                            intersection.up.segment.duct.userData.proxyMedianVertices
                        )
                    );
                }
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )   
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.down == null) {

                if(intersection.left.segment.duct.userData.proxyMedianVertices[0].z == intersection.right.segment.duct.userData.proxy2Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.left.segment.duct.userData.proxy2Vertices,
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.left.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.left.segment.duct.userData.proxy2Vertices,
                            intersection.left.segment.duct.userData.proxyMedianVertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.left.segment.duct.userData.proxyMedianVertices, 
                            intersection.right.segment.duct.userData.proxy2Vertices
                        )
                    );
                }

                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }
            else if(intersection.up == null) {

                if(intersection.right.segment.duct.userData.proxyMedianVertices[0].z == intersection.right.segment.duct.userData.proxy1Vertices[0].z) {
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        ) 
                    );
                }
                else {
                    geometries.push(
                        ...this.connectProxiesHorizontally(
                            intersection.right.segment.duct.userData.proxyMedianVertices, 
                            intersection.left.segment.duct.userData.proxy1Vertices
                        )
                    );
                    geometries.push(
                        ...this.connectProxiesVertically(
                            intersection.right.segment.duct.userData.proxy1Vertices,
                            intersection.right.segment.duct.userData.proxyMedianVertices
                        )  
                    );
                }

                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxyMedianVertices, 
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices, 
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxy2Vertices,
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    ) 
                );   
            }
        }

        let backwall = [];
        if(intersection.up != null) {
            backwall.push(intersection.up.segment.duct.userData.proxyMedianVertices[4]);
            backwall.push(intersection.up.segment.duct.userData.proxy1Vertices[4]);
            backwall.push(intersection.up.segment.duct.userData.proxy2Vertices[7]);
            geometries.push(
                ...this.createJointClosure(intersection.up.segment.duct, "horizontal")
            );
        }
        if(intersection.right != null) {
            backwall.push(intersection.right.segment.duct.userData.proxyMedianVertices[7]);
            backwall.push(intersection.right.segment.duct.userData.proxy1Vertices[7]);
            backwall.push(intersection.right.segment.duct.userData.proxy2Vertices[6]);
            geometries.push(
                ...this.createJointClosure(intersection.right.segment.duct, "vertical")
            );
        }
        if(intersection.down != null) {
            backwall.push(intersection.down.segment.duct.userData.proxyMedianVertices[6]);
            backwall.push(intersection.down.segment.duct.userData.proxy2Vertices[6]);
            backwall.push(intersection.down.segment.duct.userData.proxy1Vertices[5]);
            geometries.push(
                ...this.createJointClosure(intersection.down.segment.duct, "horizontal")
            );
        }
        if(intersection.left != null) {
            backwall.push(intersection.left.segment.duct.userData.proxyMedianVertices[5]);
            backwall.push(intersection.left.segment.duct.userData.proxy2Vertices[5]);
            backwall.push(intersection.left.segment.duct.userData.proxy1Vertices[4]);
            geometries.push(
                ...this.createJointClosure(intersection.left.segment.duct, "vertical")
            );
        }   
        
        this.createJointBackwall(backwall, largestGlobalSize);

        this.mergeAndAddToScene(geometries);
    }

    createOrthogonalLJoint(intersection, xzJointDirection, largestGlobalSize) {
        const geometries = [];

        if(xzJointDirection == "outwards") {
            if(intersection.right != null && intersection.up != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );                
            }
            else if(intersection.right != null && intersection.down != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
            } 
            else if(intersection.left != null && intersection.up != null) {
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }
            else if(intersection.left != null && intersection.down != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );     
            }  
        }
        else if(xzJointDirection == "inwards") {
            if(intersection.right != null && intersection.up != null) {
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices,
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                ); 
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy1Vertices, 
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                ); 
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy2Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                ); 
            }
            else if(intersection.right != null && intersection.down != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.right.segment.duct.userData.proxyMedianVertices, 
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxyMedianVertices, 
                        intersection.right.segment.duct.userData.proxy2Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.right.segment.duct.userData.proxy1Vertices,
                        intersection.right.segment.duct.userData.proxyMedianVertices
                    )
                );
            }
            else if(intersection.left != null && intersection.up != null) {
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.up.segment.duct.userData.proxy1Vertices,
                        intersection.up.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.up.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        intersection.up.segment.duct.userData.proxy2Vertices
                    )
                );
            }  
            else if(intersection.left != null && intersection.down != null) {
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.left.segment.duct.userData.proxy2Vertices, 
                        intersection.left.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.left.segment.duct.userData.proxyMedianVertices,
                        intersection.down.segment.duct.userData.proxy1Vertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesVertically(
                        intersection.down.segment.duct.userData.proxy2Vertices,
                        intersection.down.segment.duct.userData.proxyMedianVertices
                    )
                );
                geometries.push(
                    ...this.connectProxiesHorizontally(
                        intersection.down.segment.duct.userData.proxyMedianVertices, 
                        intersection.left.segment.duct.userData.proxy1Vertices
                    ) 
                );        
            }  
        }

        let backwall = [];
        if(intersection.up != null) {
            backwall.push(...[
                intersection.up.segment.duct.userData.proxyMedianVertices[4],
                intersection.up.segment.duct.userData.proxy1Vertices[4],
                intersection.up.segment.duct.userData.proxy2Vertices[7]
            ]);
            geometries.push(
                ...this.createJointClosure(intersection.up.segment.duct, "horizontal")
            ); 
        }
        if(intersection.right != null) {
            backwall.push(intersection.right.segment.duct.userData.proxyMedianVertices[7]);
            backwall.push(intersection.right.segment.duct.userData.proxy1Vertices[7]);
            backwall.push(intersection.right.segment.duct.userData.proxy2Vertices[6]);
            geometries.push(
                ...this.createJointClosure(intersection.right.segment.duct, "vertical")
            ); 
        }
        if(intersection.down != null) {
            backwall.push(intersection.down.segment.duct.userData.proxyMedianVertices[6]);
            backwall.push(intersection.down.segment.duct.userData.proxy2Vertices[6]);
            backwall.push(intersection.down.segment.duct.userData.proxy1Vertices[5]);
            geometries.push(
                ...this.createJointClosure(intersection.down.segment.duct, "horizontal")
            ); 
        }
        if(intersection.left != null) {
            backwall.push(intersection.left.segment.duct.userData.proxyMedianVertices[5]);
            backwall.push(intersection.left.segment.duct.userData.proxy2Vertices[5]);
            backwall.push(intersection.left.segment.duct.userData.proxy1Vertices[4]);
            geometries.push(
                ...this.createJointClosure(intersection.left.segment.duct, "vertical")
            ); 
        }   
        
        this.createJointBackwall(backwall, largestGlobalSize);

        this.mergeAndAddToScene(geometries);
    }

    createJointClosure(duct, direction) {
        const geometries = [];

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
        const material = new THREE.MeshStandardMaterial({ color: 0xAEB9C2, side: THREE.DoubleSide, opacity: 1.0 });
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
                rightProxy[2],
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
                bottomProxy[1],
                bottomProxy[5],
                topProxy[5]
            )
        );
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
                topProxy[6],
                bottomProxy[7],
                bottomProxy[4],
                topProxy[5]
            )
        );

        return geometries;
    }

    createGeometryFromPoints(pointA, pointB, pointC, pointD) {
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
    
        // Compute normals if you need lighting effects
        geometry.computeVertexNormals();
    
        return geometry;
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
                color: 0xAEB9C2, 
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

    createJointProxies(intersection, pairDirection = null, xzJointDirection = "inwards") {
        console.log("createJointProxies started");
  
        const wallThickness = 30;
  
        let largestGlobalSize = this.innerDim["small"];
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                if(this.innerDim[duct.xetoDuct.graphicLocation.size] > largestGlobalSize) {
                    largestGlobalSize = this.innerDim[duct.xetoDuct.graphicLocation.size];
                }
            }
        }

        const areHelpersOn = false;

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

        let y_offset = -30;

        // if(pairDirection != null) {
        //     y_offset = 30;
        // }
  
        for(const key in intersection) {
            let duct = intersection[key];

            if(duct != null) {

                let largestAdjacentSize = this.innerDim["small"];
                if(key == "left") {
                    let adjacentDucts = [intersection.up, intersection.down, intersection.left];
                    for(const adjacentDuct of adjacentDucts) {
                        if(adjacentDuct != null) {
                            if(this.innerDim[adjacentDuct.xetoDuct.graphicLocation.size] > largestAdjacentSize) {
                                largestAdjacentSize = this.innerDim[adjacentDuct.xetoDuct.graphicLocation.size];
                            }
                        }
                    }
                }
                else if(key == "up") {
                    let adjacentDucts = [intersection.left, intersection.right, intersection.up];
                    for(const adjacentDuct of adjacentDucts) {
                        if(adjacentDuct != null) {
                            if(this.innerDim[adjacentDuct.xetoDuct.graphicLocation.size] > largestAdjacentSize) {
                                largestAdjacentSize = this.innerDim[adjacentDuct.xetoDuct.graphicLocation.size];
                            }
                        }
                    }
                }
                else if(key == "right") {
                    let adjacentDucts = [intersection.up, intersection.down, intersection.right];
                    for(const adjacentDuct of adjacentDucts) {
                        if(adjacentDuct != null) {
                            if(this.innerDim[adjacentDuct.xetoDuct.graphicLocation.size] > largestAdjacentSize) {
                                largestAdjacentSize = this.innerDim[adjacentDuct.xetoDuct.graphicLocation.size];
                            }
                        }
                    }
                }
                else if(key == "down") {
                    let adjacentDucts = [intersection.left, intersection.right, intersection.down];
                    for(const adjacentDuct of adjacentDucts) {
                        if(adjacentDuct != null) {
                            if(this.innerDim[adjacentDuct.xetoDuct.graphicLocation.size] > largestAdjacentSize) {
                                largestAdjacentSize = this.innerDim[adjacentDuct.xetoDuct.graphicLocation.size];
                            }
                        }
                    }
                }

                const innerDimensions = duct.segment.duct.userData.component.object.innerDimensions;
    
                const proxy1Geometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset, 
                    wallThickness
                );

                const ductDepth = this.innerDim[duct.xetoDuct.graphicLocation.size];

                
                this.moveProxyVertices(proxy1Geometry, ductDepth, largestGlobalSize, largestAdjacentSize);

                const proxyOriginal1Geometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset, 
                    wallThickness
                );
                const proxyOriginal1 = new THREE.Mesh(proxyOriginal1Geometry, material4); 

                const proxy1 = new THREE.Mesh(proxy1Geometry, material);
                proxy1.position.copy(duct.segment.duct.userData.component.object.position);
        
                const proxy2Geometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset, 
                    wallThickness
                );

                this.moveProxyVertices(proxy2Geometry, ductDepth, largestGlobalSize, largestAdjacentSize);
                const proxy2 = new THREE.Mesh(proxy2Geometry, material2);

                const proxyOriginal2Geometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset, 
                    wallThickness
                );
                const proxyOriginal2 = new THREE.Mesh(proxyOriginal2Geometry, material5);                
        
                const proxyMedianGeometry = new THREE.BoxGeometry(
                    wallThickness, 
                    this.innerDim[duct.xetoDuct.graphicLocation.size] + y_offset,
                    wallThickness
                );
                
                this.moveProxyVertices(proxyMedianGeometry, ductDepth, largestGlobalSize, largestAdjacentSize);
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

                // material.color.setHex("0xFF0000");
                // material2.color.setHex("0x0000FF");
                // material3.color.setHex("0x00FF00");
                // material4.color.setHex("0xFF0000");
                // material5.color.setHex("0x0000FF");
        
                proxy1.name = "jointHelperProxy";
                proxy2.name = "jointHelperProxy";
                proxyOriginal1.name = "jointHelperProxy";
                proxyOriginal2.name = "jointHelperProxy";
                proxyMedian.name = "jointHelperProxy";

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

        if(xzJointDirection == "inwards") {
            this.alignProxyMediansInwards(intersection); 
            
        }
        else if(xzJointDirection == "outwards") {
            this.alignProxyMediansOutwards(intersection); 
        }                  
  
        for(const key in intersection) {
            let duct = intersection[key];
            if(duct != null) {
                const proxyMedianVertices = this.mapProxyVertices(duct.segment.duct.userData.proxies.proxyMedian);
                duct.segment.duct.userData.proxyMedianVertices = proxyMedianVertices;
                duct.segment.duct.userData.proxyMedianVertices = proxyMedianVertices;
                this.renderProxyVertices(proxyMedianVertices, areHelpersOn);
            }
        }

        return largestGlobalSize;
  
    }

    alignProxyMediansOutwards(intersection) {        
        let definedIntersectionCount = 0;
        for(const key in intersection) {
            if(intersection[key] != null)  {
                definedIntersectionCount++;
            }
        }

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;
                intersection.right.segment.duct.userData.proxies.proxyMedian.position.z = intersection.up.segment.duct.userData.proxies.proxy2.position.z;
            }
            else if(intersection.down != null && intersection.right != null) {
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.right.segment.duct.userData.proxies.proxy2.position.x;
                intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
            }
            else if(intersection.up != null && intersection.left != null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.x = intersection.left.segment.duct.userData.proxies.proxy2.position.x;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;
            }
            else if(intersection.down != null && intersection.left != null) {
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxy1.position.z;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy2.position.x;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;
                
            }
        }
        else if(definedIntersectionCount == 3) {
            
            if(intersection.right == null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.x = intersection.left.segment.duct.userData.proxies.proxyMedian.position.x;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxyMedian.position.z;

                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
                }
                else {
                    intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy2.position.x;
                    intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.up.segment.duct.userData.proxies.proxy2.position.z;
                }
            }
            else if(intersection.left == null) {
                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxy2.position.z;
                }
                else {
                    intersection.up.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
                }
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxy2.position.z;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.right.segment.duct.userData.proxies.proxy2.position.x;

                intersection.right.segment.duct.userData.proxies.proxyMedian.position.z = intersection.up.segment.duct.userData.proxies.proxy2.position.z;                
            }
            else if(intersection.down == null) {
                if(this.innerDim[intersection.left.xetoDuct.graphicLocation.size] > this.innerDim[intersection.right.xetoDuct.graphicLocation.size]) {
                    intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.right.segment.duct.userData.proxies.proxy2.position.x;
                    intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;
                }
                else {
                    intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;
                } 

                intersection.up.segment.duct.userData.proxies.proxyMedian.position.x = intersection.left.segment.duct.userData.proxies.proxy1.position.x;

                intersection.right.segment.duct.userData.proxies.proxyMedian.position.z = intersection.up.segment.duct.userData.proxies.proxy2.position.z;
                
            }
            else if(intersection.up == null) {
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxy1.position.z;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.left.segment.duct.userData.proxies.proxy2.position.x;

                intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxy2.position.z;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.right.segment.duct.userData.proxies.proxy2.position.x;

                if(this.innerDim[intersection.left.xetoDuct.graphicLocation.size] > this.innerDim[intersection.right.xetoDuct.graphicLocation.size]) {
                    intersection.right.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;
                }
                else {
                    intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.left.segment.duct.userData.proxies.proxy1.position.x;
                }                
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

        if(definedIntersectionCount == 2) {
            if(intersection.up != null && intersection.right != null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;
                intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
            }
            else if(intersection.down != null && intersection.right != null) {
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy2.position.x;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;

                intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
            }
            else if(intersection.up != null && intersection.left != null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;
            }
            else if(intersection.down != null && intersection.left != null) {
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy2.position.x;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;
                
            }
        }
        else if(definedIntersectionCount == 3) {
            if(intersection.right == null) {
                intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;

                intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;

                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
                }
                else {
                    intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy2.position.x;
                    intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.up.segment.duct.userData.proxies.proxy2.position.z;
                }

            }
            else if(intersection.left == null) {
                if(this.innerDim[intersection.up.xetoDuct.graphicLocation.size] > this.innerDim[intersection.down.xetoDuct.graphicLocation.size]) {
                    intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.down.segment.duct.userData.proxies.proxy2.position.z;
                }
                else {
                    intersection.up.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
                }
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy2.position.x;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;

                intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;                
            }
            else if(intersection.down == null) {
                if(this.innerDim[intersection.left.xetoDuct.graphicLocation.size] > this.innerDim[intersection.right.xetoDuct.graphicLocation.size]) {
                    intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.right.segment.duct.userData.proxies.proxy2.position.x;
                    intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;
                }
                else {
                    intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;
                } 

                intersection.up.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;

                intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.up.segment.duct.userData.proxies.proxy2.position.x;
                
            }
            else if(intersection.up == null) {
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy1.position.x;
                intersection.left.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy2.position.z;

                intersection.down.segment.duct.userData.proxies.proxyMedian.position.x = intersection.down.segment.duct.userData.proxies.proxy2.position.x;
                intersection.down.segment.duct.userData.proxies.proxyMedian.position.z = intersection.right.segment.duct.userData.proxies.proxy2.position.z;

                if(this.innerDim[intersection.left.xetoDuct.graphicLocation.size] > this.innerDim[intersection.right.xetoDuct.graphicLocation.size]) {
                    intersection.right.segment.duct.userData.proxies.proxyMedian.position.z = intersection.left.segment.duct.userData.proxies.proxy1.position.z;
                }
                else {
                    intersection.right.segment.duct.userData.proxies.proxyMedian.position.x = intersection.left.segment.duct.userData.proxies.proxy1.position.x;
                }                
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

    moveProxyVertices(proxyGeometry, ductDepth, largestGlobalSize, largestAdjacentSize) {

        const globalLength = ((largestGlobalSize - ductDepth) / 2);
        const adjacentLength = ((largestAdjacentSize - ductDepth) / 2);

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
}