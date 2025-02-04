import * as THREE from 'three';

export function createArrowInstance(sceneHelper) {
    console.log("createArrowInstance started");

    // Material
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        transparent: true, 
        opacity: 1,
        depthWrite: true,
    });

    // Cylinder (shaft of the arrow)
    const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 32);
    cylinderGeometry.rotateZ(THREE.MathUtils.degToRad(-90));
    cylinderGeometry.scale(500, 500, 500);
    cylinderGeometry.translate(-125 - 250, 0, 0); // Shift by -250 to center
    const cylinder = new THREE.Mesh(cylinderGeometry, material);
    cylinder.name = "cylinder";

    // Cone (tip of the arrow)
    const coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
    coneGeometry.rotateZ(THREE.MathUtils.degToRad(-90));
    coneGeometry.scale(500, 500, 500);
    coneGeometry.translate(375 - 250, 0, 0); // Shift by -250 to center
    const cone = new THREE.Mesh(coneGeometry, material);
    cone.name = "cone";

    // Group
    const arrowGroup = new THREE.Group();
    arrowGroup.add(cylinder);
    arrowGroup.add(cone);

    arrowGroup.name = "arrow";
    arrowGroup.position.set(0, 0, 0);

    arrowGroup.visible = false;

    console.log("Arrow geometry centered at (0,0,0)");

    // Add to scene
    sceneHelper.addToScene(arrowGroup);

    return arrowGroup;
}