

/*
 * Utils3D.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module contains a set of methods for generic utility functions that don't categorize into any other class.
 * 
 */

export default class Utils3D {
  constructor(sceneHelper) {
    
    this.sceneHelper = sceneHelper;
    this.library = null;
  }

  /**
   * getOrientation
   * 
   * Determines the orientation of a segment based on the start and end graphic locations.
   * 
   * Functions Invoked:
   * - getRow
   * 
   * @param {String} start - The start location of the segment.
   * @param {String} end - The end location of the segment.
   * @returns {String} The orientation of the segment (e.g., "north", "south", "east", "west").
   */
  getOrientation(start, end) {
    let orientation = "east";
    if(this.getRow(end) > this.getRow(start)) {
        orientation = "south";
    }
    else if(this.getRow(end) < this.getRow(start)) {
        orientation = "north";
    }
    else if(end[0] > start[0]) {
        orientation = "east";
    }
    else if(end[0] < start[0]) {
        orientation = "west";
    }
    return orientation;
  }

  getRow(location) {
    return parseInt(location.slice(1, location.length));
  }

  setDuctOpacity(opacity) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name === 'duct') {
          object3d.traverse(child => {
            if (child.isMesh && child.material) {
              if(opacity < 1) {
                child.material.transparent = true;
                child.material.depthWrite = false;
              }
              else {
                child.material.transparent = false;
                child.material.depthWrite = true;
              }
              child.material.opacity = opacity;
            }
          });

        }
      }
    });
  }

  setJointOpacity(opacity) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name.includes('joint')) {
          if(opacity < 1) {
            object3d.material.transparent = true;
            object3d.material.depthWrite = false;
          }
          else {
            object3d.material.transparent = false;
            object3d.material.depthWrite = true;
          }
          object3d.material.opacity = opacity;

          if(opacity <= 0.2) {
            for(const child of object3d.children) {
              if(child.type == "LineSegments") {
                child.visible = true;
              }
            }
          }
          else if(opacity >= 0.8) {
            for(const child of object3d.children) {
              if(child.type == "LineSegments") {
                child.visible = false;
              }
            }
          }
        }
      }
    });
  }

  setEndsOpacity(opacity) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name.includes('ductEnd')) {
          if(opacity < 1) {
            object3d.material.transparent = true;
            object3d.material.depthWrite = false;
          }
          else {
            object3d.material.transparent = false;
            object3d.material.depthWrite = true;
          }
          object3d.material.opacity = opacity;
        }
      }
    });
  }

  setJointWireframe(value) {
    this.sceneHelper.scene.traverse((object3d) => {
      if(object3d.isObject3D) {
        if(object3d.name === 'joint' || object3d.name === 'jointHelper') {
          console.log("object3d:", object3d);
          for(const child of object3d.children) {
            if(child.type == "LineSegments") {
              child.visible = value;
            }
          }
        }
      }
    });
  }

  setVertexHelperOpacity(opacity) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name.includes('jointVertexHelpers')) {
          if(opacity > 0) {
            object3d.visible = true;
          }
          else {
            object3d.visible = false;
          }
          if(opacity < 1) {
            object3d.material.transparent = true;
            object3d.material.depthWrite = false;
          }
          else {
            object3d.material.transparent = false;
            object3d.material.depthWrite = true;
          }
          object3d.material.opacity = opacity;
        }
      }
    });
  }

  setProxyOpacity(opacity) {
    const opacityMultiplier = 0.3;
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name.includes('jointProxy')) {
          if(opacity < 1) {
            object3d.material.transparent = true;
            object3d.material.depthWrite = false;
          }
          else {
            object3d.material.transparent = false;
            object3d.material.depthWrite = true;
          }
          object3d.material.opacity = opacity * opacityMultiplier;
        }
      }
    });
  }

  setComponentOpacity(opacity) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name === 'hvac') {
          object3d.traverse(child => {
            if (child.isMesh && child.material) {
              if(opacity < 1) {
                child.material.transparent = true;
                // child.material.depthWrite = false;
              }
              else {
                child.material.transparent = false;
                // child.material.depthWrite = true;
              }
              child.material.opacity = opacity;
            }
          });

        }
      }
    });
  }

  setShowComponents(value) {
    this.sceneHelper.scene.traverse((object3d) => {
      if (object3d.isObject3D) {
        if(object3d.name === 'hvac') {
          object3d.traverse(child => {
            if (child.isMesh) {
              child.visible = value;
            }
          });

        }
      }
    });
  }

}