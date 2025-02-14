import * as THREE from 'three';

/**
 * createArrowInstance
 * 
 * This function creates a 3D arrow consisting of a cylinder (shaft) and a cone (tip) in a Three.js scene.
 * The arrow is positioned at the origin (0, 0, 0) and added to the provided scene via the sceneHelper.
 * 
 * @param {Object} sceneHelper - An object that provides methods to interact with the 3D scene.
 * @returns {THREE.Group} The arrow group, which contains the cylinder and cone mesh.
 */
export function createArrowInstance(sceneHelper) {
    console.log("createArrowInstance started");

    // Material for the arrow with specific settings: green color, transparent, full opacity, and depth write enabled.
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, // Green color for the arrow
        transparent: true, 
        opacity: 1,
        depthWrite: true,
    });

    const offset = 0;

    // Cylinder geometry representing the shaft of the arrow
    // It is a cylinder with a radius of 0.1, height of 1.5, and 32 radial segments.
    const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 32);
    // Rotate the cylinder by -90 degrees along the Z-axis to align it horizontally
    cylinderGeometry.rotateZ(THREE.MathUtils.degToRad(-90));
    // Scale the geometry to a larger size (500x in the X, Y, Z directions)
    cylinderGeometry.scale(500, 500, 500);
    // Translate the cylinder to adjust its position, shifting by -125 along the X-axis to center it
    cylinderGeometry.translate(-125 + offset, 0, 0);
    // Create the mesh using the cylinder geometry and material
    const cylinder = new THREE.Mesh(cylinderGeometry, material);
    cylinder.name = "cylinder"; // Name the cylinder for easier identification

    // Cone geometry representing the tip of the arrow
    // It is a cone with a base radius of 0.2, height of 0.5, and 32 radial segments.
    const coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
    // Rotate the cone by -90 degrees along the Z-axis to align it horizontally
    coneGeometry.rotateZ(THREE.MathUtils.degToRad(-90));
    // Scale the cone geometry to match the size of the cylinder
    coneGeometry.scale(500, 500, 500);
    // Translate the cone to adjust its position, shifting by 375 along the X-axis to center it
    coneGeometry.translate(375 + offset, 0, 0);
    // Create the mesh using the cone geometry and material
    const cone = new THREE.Mesh(coneGeometry, material);
    cone.name = "cone"; // Name the cone for easier identification

    // Create a group to combine the cylinder and cone
    const arrowGroup = new THREE.Group();
    // Add the cylinder and cone to the group
    arrowGroup.add(cylinder);
    arrowGroup.add(cone);

    // Name the group for easier identification in the scene
    arrowGroup.name = "arrow";
    // Set the position of the group at the origin (0, 0, 0)
    arrowGroup.position.set(0, 0, 0);

    // Initially hide the arrow by setting the visibility to false
    arrowGroup.visible = false;

    console.log("Arrow geometry centered at (0,0,0)");

    // Add the arrow group to the scene using the sceneHelper
    sceneHelper.addToScene(arrowGroup);

    // Return the arrow group to allow further manipulation or access outside the function
    return arrowGroup;
}
