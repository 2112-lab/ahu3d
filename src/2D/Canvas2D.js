// Importing the sharedData for accessing shared resources
import { sharedData } from "../Ahu3D/globals.js"

export default class Canvas2D {
  /**
   * Draws the AHU object to the canvas viewport using Konva.js.
   * @param {Object} ahuObject - The AHU object that contains resources and components to draw.
   * @param {string} domID - The ID of the DOM element to attach the canvas to.
   */
  drawToViewport(ahuObject, domID) {
    console.log("drawToViewport ahuObject", domID, ahuObject);

    // Storing the AHU object for use in other functions
    this.ahuObject = ahuObject;
    const container = document.getElementById(domID);

    // Get the container's width and height for setting canvas size
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Create a Konva Stage with the container
    const stage = new Konva.Stage({
        container: domID,
        width: containerWidth,
        height: containerHeight,
        draggable: true,
        pixelRatio: 1
    });

    // Create a Konva Layer to add shapes to the stage
    const layer = new Konva.Layer();
    stage.add(layer);

    // Render the AHU to the layer (includes ducts and components)
    this.renderAhuToLayer(layer);

    // Draw the frame around the objects in the viewport
    this.drawFrame(layer);

    // Fit the layer content to the frame with a 90% zoom-out factor
    this.fitLayerToFrame(layer, containerWidth, containerHeight, 0.90);

    // Set canvas events such as resize handling
    this.setCanvasEvents(layer, stage, container);

    // Redraw the layer after setup
    layer.draw();
  }

  /**
   * Renders the AHU's ducts and components to the given layer.
   * @param {Konva.Layer} layer - The layer to render the AHU onto.
   */
  renderAhuToLayer(layer) {
    // Iterate over all ducts in the AHU object and render them
    for (const ductKey in this.ahuObject.resources.ducts) {
      const duct = this.ahuObject.resources.ducts[ductKey];
  
      // Calculate width and height of the duct
      let width = duct.dimensions.x + 5;
      let height = duct.dimensions.z;
      let activeWalls = { top: true, bottom: true, left: false, right: false };
  
      // Adjust width and height if the duct is rotated
      if (duct.rotation.y !== 0 && duct.rotation.y !== 180) {
        [width, height] = [height, width]; // Swap width and height
        activeWalls = { top: false, bottom: false, left: true, right: true };
      }
  
      // Konva options for drawing the duct
      const konvaOptions = {
        stroke: 'white',
        strokeWidth: 30,
        perfectDrawEnabled: true,
        opacity: 0.95,
      };
  
      // Create the duct lines and add them to the layer
      const lines = this.createDuct(duct.position.x, duct.position.z * -1, width, height, konvaOptions, activeWalls);
      lines.forEach(line => layer.add(line));
  
      // Create a group for the components inside the duct
      const componentGroup = new Konva.Group({
        x: duct.position.x,
        y: duct.position.z * -1,
        rotation: duct.rotation.y, // Rotate only the components, not the duct
        offsetX: 0, // No offset applied here
        offsetY: 0,
      });
  
      // Render components if they are associated with the duct
      if (this.ahuObject.associations.ducts[ductKey].components) {
        for (const i in this.ahuObject.associations.ducts[ductKey].components) {
          const componentId = this.ahuObject.associations.ducts[ductKey].components[i];
          const componentKey = this.ahuObject.xetoDictionary.components[componentId].componentId.split("r:novo.graphics::")[1];
          const componentSvg = sharedData.componentLibrary[componentKey].svg;
          const componentResource = this.ahuObject.resources.components[componentId];
  
          // Convert component position to relative to the duct
          const relativePosition = {
            x: componentResource.position.x - duct.position.x,
            z: (componentResource.position.z - duct.position.z) * -1, // Adjust for flipping on the z-axis
          };
  
          // Render the SVG of the component to the layer
          this.renderComponentSvg(componentGroup, relativePosition, componentSvg, duct);
        }
      }

      // Handle ends (such as inserts or caps) attached to ducts
      if(this.ahuObject.associations.ducts[ductKey].ends) {
        for(const endKey in this.ahuObject.associations.ducts[ductKey].ends) {
          const endKey = this.ahuObject.associations.ducts[ductKey].ends[0];
          const end = this.ahuObject.resources.ends[endKey];
          console.log("renderAhuToLayer drawEnd starting:", this.ahuObject, endKey);
          this.drawEnd(layer, end, endKey, konvaOptions);
        }
      }  

      // Add the component group to the layer for independent rotation
      layer.add(componentGroup);
    }
  
    // Create 2D joints and add them to the layer
    for (const jointKey in this.ahuObject.resources.joints) {
      this.create2DJoint(layer, this.ahuObject.resources.joints[jointKey], jointKey);
    }

    // Render additional helper elements (arrows, labels, etc.)
    this.renderHelpers(layer);
  }

  /**
   * Renders arrows and labels as part of the AHU helpers.
   * @param {Konva.Layer} layer - The layer where the helpers are drawn.
   */
  renderHelpers(layer) {
    const ahuObject = this.ahuObject;
    console.log("renderHelpers started:", ahuObject);

    // Process Arrows (helpers for visual direction indication)
    for (const arrowId in ahuObject.auxiliary["3d"].arrows) {
        const arrowResource = ahuObject.auxiliary["3d"].arrows[arrowId];

        const ductKey = ahuObject.associations.arrows[arrowId];
        const duct = ahuObject.resources.ducts[ductKey];

        const blockStyle = ahuObject.xetoDictionary.edges[ductKey].blockStyle;

        console.log("renderHelpers arrowResource:", arrowResource, arrowId);

        let x = arrowResource.position.x;
        let y = -arrowResource.position.z; // Convert to 2D canvas space
        const rotation = arrowResource.rotation.y; // Keep the same Y rotation

        const arrowLength = 900; // Total length of arrow                

        // Create a Konva arrow
        let arrow = new Konva.Arrow({
            points: [-arrowLength / 2, 0, arrowLength / 2, 0], // Center the arrow on (x, y)
            pointerLength: 30,
            pointerWidth: 30,
            stroke: "white", // blockStyle.helpers.arrow.material.color
            strokeWidth: 100,
            x: x, // Position the arrow at its center
            y: y,
            rotation: rotation, // Apply rotation in degrees
        });

        // Add the arrow to the layer
        layer.add(arrow);
    }

    // Process Labels (Text helpers for descriptions or identifiers)
    for (const labelId in ahuObject.auxiliary["3d"].labels) {
        const labelResource = ahuObject.auxiliary["3d"].labels[labelId];

        const ductKey = ahuObject.associations.labels[labelId];
        const duct = ahuObject.resources.ducts[ductKey];

        const blockStyle = ahuObject.xetoDictionary.edges[ductKey].blockStyle;

        const x = labelResource.position.x;
        const y = -labelResource.position.z; // Convert to 2D canvas space

        let label = new Konva.Text({
            x: x,
            y: y - 150,
            text: blockStyle.helpers.text.value || "Label",
            fontSize: 140,
            fontFamily: "Arial",
            fill: "white",
        });

        // Add the text label to the layer
        layer.add(label);
    }

    // Redraw the layer after adding elements
    layer.batchDraw(); 
  }

  /**
   * Draws an end (either an insert or a cap) to the given layer in the canvas.
   * This method handles different types of ends based on the `endKey`, such as inserts and caps.
   * 
   * @param {Konva.Layer} layer - The layer to which the end should be drawn.
   * @param {Object} end - The end object containing information about the end.
   * @param {string} endKey - The key that identifies the specific end type.
   * @param {Object} konvaOptions - Options for styling the shapes (e.g., stroke, strokeWidth).
   */
  drawEnd(layer, end, endKey, konvaOptions) {
    console.log("drawEnd end:", end);

    let width = end.dimensions.z;  // Get the width of the end from its dimensions
    let height = 200;  // Default height for the end shape

    // Check if the end is an "Insert" type and create the corresponding shape
    if (endKey.includes("Insert")) {
      const shape = this.createInsert(end, width, height);
      layer.add(shape);  // Add the insert shape to the layer
    }

    // Check if the end is a "Cap" type and create the corresponding shape
    if (endKey.includes("Cap")) {
      const shape = this.createCap(end, width, height);
      layer.add(shape);  // Add the cap shape to the layer
    }
  }

  /**
   * Creates an "Insert" shape using Konva and adds it to the canvas.
   * The insert shape is drawn as a custom polygon with defined path instructions.
   * 
   * @param {Object} end - The end object that contains the position and rotation of the insert.
   * @param {number} width - The width of the insert.
   * @param {number} height - The height of the insert.
   * @returns {Konva.Shape} - The created insert shape.
   */
  createInsert(end, width, height) {
    let offset = 14;  // An offset to adjust the position of the insert for visual alignment.

    // Create the insert shape using Konva's Shape class and define its path
    const insert = new Konva.Shape({
      x: end.position.x,  // Position of the insert along the x-axis
      y: end.position.z * -1,  // Position of the insert along the z-axis (flipped for canvas space)
      rotation: end.rotation.y,  // Apply the rotation of the insert if any
      sceneFunc: (context, shape) => {
        context.beginPath();  // Start drawing the path
        context.lineCap = 'round';  // Set the line cap style

        // Define the path for the insert, starting from the bottom-left corner
        context.moveTo((-width / 2), 0 + offset);  // Bottom-left corner
        context.lineTo(((-width / 2) - 120), (height * -1) + offset);  // Left side (slanted)

        // Connect to the top right tip of the insert
        context.lineTo(((width / 2) + 120), (height * -1) + offset);  // Right side (slanted)

        // Close the path by drawing a line back to the other side
        context.lineTo(((width / 2)), 0 + offset);  // Top-right corner

        // Fill and/or stroke the shape (render it)
        context.fillStrokeShape(shape);
      },
      stroke: 'white',  // Set the stroke color for the shape
      strokeWidth: 30,  // Set the stroke width
    });

    return insert;  // Return the created insert shape
  }

  /**
   * Creates a "Cap" shape using Konva and adds it to the canvas.
   * The cap shape is drawn as a simple straight line from the left to the right.
   * 
   * @param {Object} end - The end object that contains the position and rotation of the cap.
   * @param {number} width - The width of the cap.
   * @param {number} height - The height of the cap.
   * @returns {Konva.Shape} - The created cap shape.
   */
  createCap(end, width, height) {
    let offset = 14;  // An offset to adjust the position of the cap for visual alignment.

    // Create the cap shape using Konva's Shape class and define its path
    const cap = new Konva.Shape({
      x: end.position.x,  // Position of the cap along the x-axis
      y: end.position.z * -1,  // Position of the cap along the z-axis (flipped for canvas space)
      rotation: end.rotation.y,  // Apply the rotation of the cap if any
      sceneFunc: (context, shape) => {
        context.beginPath();  // Start drawing the path

        context.lineCap = 'round';  // Set the line cap style for the cap

        // Define the path for the cap (a simple horizontal line)
        context.moveTo((-width / 2), 0 + offset);  // Starting point at the left side
        context.lineTo((width / 2), 0 + offset);  // Ending point at the right side

        // Fill and/or stroke the shape (render it)
        context.fillStrokeShape(shape);
      },
      stroke: 'white',  // Set the stroke color for the shape
      strokeWidth: 30,  // Set the stroke width
    });

    return cap;  // Return the created cap shape
  }

  /**
   * Calculates the 2D center of the joint based on the associated ducts in the AHU.
   * The center is determined based on the positions of the ducts in the X and Z axes.
   * 
   * @param {Object} joint - The joint object which contains references to the ducts.
   * @param {string} jointKey - The key identifying the joint in the AHU structure.
   * @returns {Object} - The calculated center of the joint, with x and z coordinates.
   */
  calculate2DJointCenter(joint, jointKey) {
    console.log("calculate2DJointCenter joint:", joint, this.ahuObject);

    let jointCenter = {
        x: 0,
        z: 0,
    };

    // Iterate through the ducts associated with the joint
    for (const ductKey of this.ahuObject.associations.joints[jointKey].ducts) {
        const duct = this.ahuObject.resources.ducts[ductKey];  // Get the duct from resources

        // Check the orientation of the duct and assign its position to the joint center
        if (this.ahuObject.xetoDictionary.edges[ductKey].isVertical) {
            jointCenter.x = duct.position.x;  // Vertical ducts affect the X coordinate
        } else {
            jointCenter.z = duct.position.z;  // Non-vertical ducts affect the Z coordinate
        }
    }

    // Optionally, you could visualize the joint center as a point (e.g., using a circle or marker)
    // Example: this.renderPoint(layer, jointCenter);

    return jointCenter;  // Return the calculated joint center
  }

  /**
   * Renders an SVG component to the Konva group.
   * @param {Konva.Group} componentGroup - The group to add the component image to.
   * @param {Object} relativePosition - The relative position of the component inside the duct.
   * @param {string} componentSvg - The SVG content for the component.
   * @param {Object} duct - The duct to which the component belongs.
   */
  renderComponentSvg(componentGroup, relativePosition, componentSvg, duct) {
    const width = 381;
    const height = duct.dimensions.z; // Set height dynamically if needed
  
    // Convert SVG to a URL to be used as an image
    const svgBlob = new Blob([componentSvg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
  
    const img = new Image();
    img.onload = function () {
      const konvaImage = new Konva.Image({
        image: img,
        x: relativePosition.x, // Now using relative positioning
        y: relativePosition.z, // Already flipped correctly
        width: width,
        height: height,
        offsetX: width / 2,
        offsetY: height / 2,
        scaleY: duct.rotation.y === 180 ? -1 : 1
      });
  
      componentGroup.add(konvaImage); // Add to the component group
    };
    img.src = svgUrl;
  }
  
  /**
   * Creates a duct shape using Konva.js lines.
   * @param {number} x - The x-position of the duct.
   * @param {number} y - The y-position of the duct.
   * @param {number} width - The width of the duct.
   * @param {number} height - The height of the duct.
   * @param {Object} konvaOptions - Options for styling the lines.
   * @param {Object} options - Additional options like which walls to draw.
   * @returns {Array} An array of Konva.Line objects that represent the duct.
   */
  createDuct(x, y, width, height, konvaOptions, options = {}) {
    const { top = true, right = true, bottom = true, left = true } = options;
  
    const lines = [];
  
    if (top) {
      lines.push(new Konva.Line({
        points: [
          x - width / 2, y - height / 2,   // Top-left
          x + width / 2, y - height / 2    // Top-right
        ],
        closed: false,
        ...konvaOptions
      }));
    }
  
    if (right) {
      lines.push(new Konva.Line({
        points: [
          x + width / 2, y - height / 2,   // Top-right
          x + width / 2, y + height / 2    // Bottom-right
        ],
        closed: false,
        ...konvaOptions
      }));
    }
  
    if (bottom) {
      lines.push(new Konva.Line({
        points: [
          x + width / 2, y + height / 2,   // Bottom-right
          x - width / 2, y + height / 2    // Bottom-left
        ],
        closed: false,
        ...konvaOptions
      }));
    }
  
    if (left) {
      lines.push(new Konva.Line({
        points: [
          x - width / 2, y + height / 2,   // Bottom-left
          x - width / 2, y - height / 2    // Top-left
        ],
        closed: false,
        ...konvaOptions
      }));
    }
  
    return lines;  // Return an array of separate line objects
  }

  /**
   * Creates a 2D representation of a joint and adds it to the layer.
   * @param {Konva.Layer} layer - The layer to add the joint representation to.
   * @param {Object} joint - The joint object to render.
   * @param {string} jointKey - The key identifying the joint.
   */
  create2DJoint(layer, joint, jointKey) {
    console.log("create2DJoint:", joint);

    let point1 = null;
    let point2 = null;
    let midPoint = null;

    this.jointKeys = Object.keys(joint);

    const jointCenter = this.calculate2DJointCenter(joint, jointKey);

    console.log("create2DJoint jointCenter:", jointCenter);

    // Determine how to draw the joint based on its configuration (up/down/left/right)
    if(this.jointKeys.length == 2) {
        if(joint.up && joint.right) {
          point1 = joint.up.proxy2.position;
          point2 = joint.right.proxy1.position;
          midPoint = joint.right.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.right.proxy2.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint, 90);
        }
        else if(joint.up && joint.left) {
          point1 = joint.left.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy2.position;
          point2 = joint.up.proxy2.position;
          midPoint = joint.left.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint, 360);
        }
        else if(joint.down && joint.right) {
          point1 = joint.right.proxy1.position;
          point2 = joint.down.proxy1.position;
          midPoint = joint.right.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint, 180);

          point1 = joint.right.proxy2.position;
          point2 = joint.down.proxy2.position;
          midPoint = joint.down.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);
        }
        else if(joint.down && joint.left) {
          point1 = joint.left.proxy2.position;
          point2 = joint.down.proxy1.position;
          midPoint = joint.left.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy1.position;
          point2 = joint.down.proxy2.position;
          midPoint = joint.down.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint, -90);
        }
        else if(joint.up && joint.down) {
          point1 = joint.up.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.down.proxy1.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.up.proxy2.position;
          point2 = joint.up.proxy2.position;
          midPoint = joint.down.proxy2.position;
          this.createJointCorner(layer, point1, point2, midPoint);
        }
        else if(joint.left && joint.right) {
          point1 = joint.left.proxy1.position;
          point2 = joint.right.proxy1.position;
          midPoint = joint.right.proxy1.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy2.position;
          point2 = joint.right.proxy2.position;
          midPoint = joint.right.proxy2.position;
          this.createJointCorner(layer, point1, point2, midPoint);
        }
    }
    // Handle the case for joints with 3 or 4 parts (more complex configurations)
    else if(this.jointKeys.length == 3) {
        if(!joint.right) {
          point1 = joint.up.proxy2.position;
          point2 = joint.down.proxy2.position;
          midPoint = joint.down.proxyMedian.position;
          if(point1.x == point2.x) {
            midPoint = point2;
          }

          const angle = joint.up.ductDimensions.y < joint.down.ductDimensions.y ? -90 : 360;

          this.createJointCorner(layer, point1, point2, midPoint, angle);

          point1 = joint.down.proxy1.position;
          point2 = joint.left.proxy2.position;
          midPoint = joint.left.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);
        }
        else if(!joint.left) {
          point1 = joint.up.proxy2.position;
          point2 = joint.right.proxy1.position;
          midPoint = joint.right.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.right.proxy2.position;
          point2 = joint.down.proxy2.position;
          midPoint = joint.down.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.down.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          if(point1.x == point2.x) {
            midPoint = point2;
          }

          const angle = joint.up.ductDimensions.y < joint.down.ductDimensions.y ? 180 : 180;

          this.createJointCorner(layer, point1, point2, midPoint, angle);
        }
        else if(!joint.up) {
          point1 = joint.right.proxy2.position;
          point2 = joint.down.proxy2.position;
          midPoint = joint.down.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.down.proxy1.position;
          point2 = joint.left.proxy2.position;
          midPoint = joint.left.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy1.position;
          point2 = joint.right.proxy1.position;
          midPoint = joint.right.proxyMedian.position;
          if(point1.z == point2.z) {
            midPoint = point2;
          }

          const angle = joint.left.ductDimensions.y < joint.right.ductDimensions.y ? 180 : 180;

          this.createJointCorner(layer, point1, point2, midPoint, angle);
        }
        else if(!joint.down) {
          point1 = joint.up.proxy2.position;
          point2 = joint.right.proxy1.position;
          midPoint = joint.right.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.right.proxy2.position;
          point2 = joint.left.proxy2.position;
          midPoint = joint.left.proxyMedian.position;
          if(point1.z == point2.z) {
            midPoint = point2;
          }

          const angle = joint.left.ductDimensions.y < joint.right.ductDimensions.y ? 90 : 90;

          this.createJointCorner(layer, point1, point2, midPoint, angle);

          point1 = joint.left.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);
        }
    }
    else if(this.jointKeys.length == 4) {
        point1 = joint.up.proxy2.position;
        point2 = joint.right.proxy1.position;
        midPoint = joint.right.proxyMedian.position;
        this.createJointCorner(layer, point1, point2, midPoint);

        point1 = joint.right.proxy2.position;
        point2 = joint.down.proxy2.position;
        midPoint = joint.down.proxyMedian.position;
        this.createJointCorner(layer, point1, point2, midPoint);

        point1 = joint.down.proxy1.position;
        point2 = joint.left.proxy2.position;
        midPoint = joint.left.proxyMedian.position;
        this.createJointCorner(layer, point1, point2, midPoint);

        point1 = joint.left.proxy1.position;
        point2 = joint.up.proxy1.position;
        midPoint = joint.up.proxyMedian.position;
        this.createJointCorner(layer, point1, point2, midPoint);
    }      
  }

  /**
   * Creates a corner for the joint and adds it to the layer.
   * @param {Konva.Layer} layer - The layer to add the joint corner to.
   * @param {Object} point1 - The first point of the joint corner.
   * @param {Object} point2 - The second point of the joint corner.
   * @param {Object} midPoint - The midpoint for the joint corner.
   * @param {number} rotationOverride - Optional rotation override for the corner.
   */
  createJointCorner(layer, point1, point2, midPoint, rotationOverride = null) {

    let isColinear = false;

    // Check if the x values of any of the points are within 30 units of each other
    if (Math.abs(point1.x - point2.x) <= 30 && Math.abs(point1.x - midPoint.x) <= 30 && Math.abs(point2.x - midPoint.x) <= 30) {
        console.log("x values of points are within 30 units of each other");
        isColinear = true;
    }

    // Check if the z values of any of the points are within 30 units of each other
    if (Math.abs(point1.z - point2.z) <= 30 && Math.abs(point1.z - midPoint.z) <= 30 && Math.abs(point2.z - midPoint.z) <= 30) {
        console.log("z values of points are within 30 units of each other");
        isColinear = true;
    }

    if(sharedData.jointStyle == "arc" && isColinear == false) {
      this.createJointArc(layer, point1, point2, midPoint, rotationOverride);
    }
    else {
      const points = [
        point1.x, point1.z * -1,
        midPoint.x, midPoint.z * -1,
        point2.x, point2.z * -1
      ];

      const jointLine = new Konva.Line({
          points: points,
          stroke: 'white',
          lineCap: 'round',
          lineJoin: 'round',
          strokeWidth: 30,
      });

      layer.add(jointLine);
    }
  }

  /**
   * Creates an arc for the joint and adds it to the layer.
   * @param {Konva.Layer} layer - The layer to add the joint arc to.
   * @param {Object} point1 - The first point of the joint arc.
   * @param {Object} point2 - The second point of the joint arc.
   * @param {Object} midPoint - The midpoint for the joint arc.
   * @param {number} rotationOverride - Optional rotation override for the arc.
   */
  createJointArc(layer, point1, point2, midPoint, rotationOverride = null) {
    console.log("createJointArc started");

    // Convert z to match Konva's coordinate system
    const p1 = { x: point1.x, y: point1.z };
    const p2 = { x: point2.x, y: point2.z };
    const mid = { x: midPoint.x, y: midPoint.z };

    const cornerDistance = Math.min( Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y) );

    const wt = 30;
    const halfWT = wt / 2;
    const radius = cornerDistance + halfWT; // Arc radius

    let rotation = 0;
    let cx = mid.x;
    let cy = mid.y;
    let isSet = false;

    let linePoints = [
      p1.x, p1.y * -1,
      mid.x, mid.y * -1,
    ];

    if(sharedData.jointDirection == "outwards") {
      if (p1.x < p2.x && p1.y > p2.y) {
        rotation = -90;
        cx = mid.x;
        cy = mid.y - radius;
        isSet = true;
        if(!(mid.x != p2.x && mid.y != p2.y)) {
          cx = mid.x - radius;
          cy = mid.y;
        }
      }
      else if (p1.x > p2.x && p1.y > p2.y) {
        rotation = 0;
        cx = mid.x - radius;
        cy = mid.y;
        isSet = true;
        if(!(mid.x != p2.x && mid.y != p2.y)) {
          cx = mid.x;
          cy = mid.y + radius;
        }
      }
      else if (p1.x > p2.x && p1.y < p2.y) {
        rotation = 90;
        cx = mid.x + radius;
        cy = mid.y;
        isSet = true;
        if(!(mid.x != p1.x && mid.y != p1.y)) {
          cx = mid.x;
          cy = mid.y + radius;
        }
      }
      else {
        rotation = 180;
        cx = mid.x;
        cy = mid.y - radius;
        isSet = true;
        if(!(mid.x != p1.x && mid.y != p1.y)) {
          cx = mid.x + radius;
          cy = mid.y;
        }
      }
    }
    else if(sharedData.jointDirection == "inwards") {
      if (p1.x < p2.x && p1.y > p2.y) {
        rotation = 90;
        cx = mid.x + radius;
        cy = mid.y + halfWT;
        isSet = true;
        if(!(mid.x != p2.x && mid.y != p2.y)) {
          cx = mid.x + halfWT;
          cy = mid.y + radius;
        }
      }
      else if (p1.x > p2.x && p1.y > p2.y) {
        rotation = 180;
        cx = mid.x + halfWT;
        cy = mid.y - radius;
        isSet = true;
        if(!(mid.x != p2.x && mid.y != p2.y)) {
          cx = mid.x + radius;
          cy = mid.y - halfWT;
        }
      }
      else if (p1.x > p2.x && p1.y < p2.y) {
        rotation = -90;
        cx = mid.x - halfWT;
        cy = mid.y - radius;
        isSet = true;
        if(!(mid.x != p1.x && mid.y != p1.y)) {
          cx = mid.x - radius;
          cy = mid.y - halfWT;
        }
      }
      else {
        rotation = 0;
        cx = mid.x - radius;
        cy = mid.y + halfWT;
        isSet = true;
        if(!(mid.x != p1.x && mid.y != p1.y)) {
          cx = mid.x - halfWT;
          cy = mid.y + radius;
        }
      }
    }

    if((mid.x != p1.x && mid.y != p1.y)) {
      linePoints = [
        mid.x, mid.y * -1,
        p2.x, p2.y * -1,
      ]
    }

    if(rotationOverride) {
      rotation = rotationOverride;
      if(rotationOverride == 90) {
        if(sharedData.jointDirection == "inwards") {
          cx += (radius + halfWT) * 1;
          cy += (radius + halfWT) * 1;
        }
      }
      else if(rotationOverride == -90) {
        if(sharedData.jointDirection == "inwards") {
          cx += (radius + halfWT) * -1;
          cy += (radius + halfWT) * -1;
        }
      }
      else if(rotationOverride == 0) {
        if(sharedData.jointDirection == "inwards") {
          cx += (radius + halfWT) * 1;
          cy += (radius + halfWT) * -1;
        }
      }
      else if(rotationOverride == 180) {
        if(sharedData.jointDirection == "outwards") {
          // cx += (radius + halfWT) * 1;
          // cy += (radius + halfWT) * -1;
        }
        else if(sharedData.jointDirection == "inwards") {
          cx += (radius + halfWT) * 1;
          cy += (radius + halfWT) * -1;
        }
      }
      else if(rotationOverride == 360) {
        if(sharedData.jointDirection == "outwards") {
          cx += (radius) * 0;
          cy += (radius + halfWT) * 0;
        }
        else if(sharedData.jointDirection == "inwards") {
          cx += (radius + halfWT) * -1;
          cy += (radius + halfWT) * 1;
        }
      }
    }

    if(isSet){
      const jointArc = new Konva.Arc({
        x: cx,
        y: cy * -1,  // Flip y to match Konva's coordinate system
        innerRadius: radius,
        outerRadius: radius,
        angle: 90,
        rotation: rotation,
        stroke: 'white',
        strokeWidth: 30,
      });
      layer.add(jointArc);

      const jointLine = new Konva.Line({
        points: linePoints,
        stroke: 'white',
        lineCap: 'round',
        lineJoin: 'round',
        strokeWidth: 30,
      });

      layer.add(jointLine);
    }
  }

  /**
   * Draws a frame around all shapes in the layer, considering the size of the content and adding padding.
   * It includes a label at the bottom of the frame with the text "AHU-1 Blueprint".
   * 
   * @param {Konva.Layer} layer - The Konva layer that contains the shapes to be enclosed within the frame.
   */
  drawFrame(layer) {
    const paddingX = 500; // Horizontal padding
    const paddingY = 500; // Vertical padding
    const textFrameHeight = 320; // Height for the text frame

    // Get all shapes (including groups) in the layer
    const shapes = layer.getChildren();

    // Initialize bounding box values
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Iterate through all shapes and compute the bounding box
    shapes.forEach(shape => {
        const rect = shape.getClientRect(); // Get the absolute bounding box
        minX = Math.min(minX, rect.x);       // Update minX based on the shape's position
        minY = Math.min(minY, rect.y);       // Update minY based on the shape's position
        maxX = Math.max(maxX, rect.x + rect.width);  // Update maxX based on the shape's width
        maxY = Math.max(maxY, rect.y + rect.height); // Update maxY based on the shape's height
    });

    // Add padding to the bounding box
    const frameX = minX - paddingX;
    const frameY = minY - paddingY;
    const frameWidth = (maxX - minX) + 2 * paddingX;
    const frameHeight = (maxY - minY) + 2 * paddingY + textFrameHeight; // Add text frame height

    // Create the frame as a rectangle
    const frame = new Konva.Rect({
        x: frameX,
        y: frameY,
        width: frameWidth,
        height: frameHeight,
        stroke: 'white',
        strokeWidth: 30,
        listening: false, // Disable event listening on the frame
    });

    // Position and create the text within the frame (centered)
    const textY = frameY + frameHeight - textFrameHeight + 70; // Adjusted text position
    const text = new Konva.Text({
        text: "AHU-1 Blueprint", // Title text for the frame
        fontSize: 200,
        fontFamily: "Arial",
        fill: "white",
        x: frameX + frameWidth / 2, // Position the text in the center horizontally
        y: textY, // Position the text at the bottom of the frame
        align: "center",
        verticalAlign: "bottom",
    });

    // Center the text properly within the frame
    text.offsetX(text.width() / 2);

    // Create the text frame (a background rectangle behind the text)
    const textFrame = new Konva.Rect({
        x: frameX,
        y: textY - 70, // Adjusted position to surround the text
        width: frameWidth,
        height: textFrameHeight,
        stroke: 'white',
        strokeWidth: 30,
        listening: false, // Disable event listening on the text frame
    });

    // Add the frame, text frame, and text to the layer
    layer.add(frame);
    layer.add(textFrame);
    layer.add(text);
  }

  /**
   * Fits the layer to the available container size while maintaining the aspect ratio.
   * It scales the layer to fit within the frame, ensuring proper padding and positioning.
   *
   * @param {Konva.Layer} layer - The Konva layer that contains all the shapes to be resized and repositioned.
   * @param {number} containerWidth - The width of the container to fit the layer to.
   * @param {number} containerHeight - The height of the container to fit the layer to.
   * @param {number} zoomOutFactor - A factor to control zoom level (default: 1). A value less than 1 will zoom out.
   */
  fitLayerToFrame(layer, containerWidth, containerHeight, zoomOutFactor = 1) {
    // Find the frame object in the layer
    const frame = layer.getChildren().find(shape => shape.getClassName() === "Rect" && shape.stroke() === "white");

    // Get the frame's bounding box
    const frameBox = frame.getClientRect();

    // Calculate scaling factors for both width and height
    const scaleX = containerWidth / frameBox.width;
    const scaleY = containerHeight / frameBox.height;

    // The final scale is the smaller of the two scale factors, multiplied by the zoomOutFactor
    let scale = Math.min(scaleX, scaleY) * zoomOutFactor;

    // Compute the offsets needed to center the layer in the container
    const offsetX = (containerWidth - frameBox.width * scale) / 2;
    const offsetY = ((containerHeight - frameBox.height * scale) / 2) - 10; // Adjusted to avoid small offsets

    // Apply scaling to the layer
    layer.scale({ x: scale, y: scale });

    // Adjust the position of the layer to center it within the container
    layer.position({
        x: -frameBox.x * scale + offsetX,
        y: -frameBox.y * scale + offsetY,
    });

    // Redraw the layer after applying the transformations
    layer.draw();
  }

  /**
   * Sets up mouse and resize events for the canvas to handle zooming and dynamic resizing.
   * 
   * This function attaches a zooming behavior to the Konva stage using the mouse wheel, 
   * allowing users to zoom in and out of the canvas. It also ensures that the canvas is 
   * resized dynamically whenever the container's size changes (via window resizing or
   * the ResizeObserver). The canvas content is adjusted accordingly, preserving the layout
   * while maintaining a smooth user experience.
   * 
   * @param {Konva.Layer} layer - The Konva layer to which the content is drawn.
   * @param {Konva.Stage} stage - The Konva stage that represents the entire canvas.
   * @param {HTMLElement} container - The DOM element containing the canvas, used to track resizing.
   */
  setCanvasEvents(layer, stage, container) {
    // Set up the wheel event for zooming
    this.setKonvaWheel(stage);

    // Function to resize the stage dynamically when the container size changes
    const resizeStage = () => {
        const newWidth = container.offsetWidth;
        const newHeight = container.offsetHeight;

        // Update the stage size to match the container's new dimensions
        stage.width(newWidth);
        stage.height(newHeight);

        // Reset layer scale and position before refitting
        layer.scale({ x: 1, y: 1 });
        layer.position({ x: 0, y: 0 });

        // Call the fitLayerToFrame function to adjust the content correctly
        this.fitLayerToFrame(layer, newWidth, newHeight, 0.90);

        // Redraw the layer after applying transformations
        layer.draw();
    };

    // Listen for window resize events to trigger resizing of the stage
    window.addEventListener('resize', resizeStage);

    // Alternatively, use ResizeObserver for more efficient handling of resize events
    const resizeObserver = new ResizeObserver(() => {
        resizeStage();
    });
    resizeObserver.observe(container);
  }

  /**
   * Sets up mouse wheel zooming functionality for the Konva stage.
   * 
   * This function enables zooming in and out of the Konva canvas using the mouse wheel. 
   * The zoom is centered around the position of the mouse pointer, allowing for intuitive 
   * zooming behavior. The zoom speed is controlled by the `scaleBy` factor, and the zoom 
   * effect adjusts the scale of the stage and repositions it to maintain the mouse's position.
   * 
   * @param {Konva.Stage} stage - The Konva stage that represents the canvas element.
   */
  setKonvaWheel(stage) {
    // Define the zooming speed (factor for each zoom level)
    const scaleBy = 1.15; // Zoom speed factor

    // Attach the wheel event listener to handle zoom
    stage.on('wheel', (e) => {
        // Prevent the default behavior of the wheel event
        e.evt.preventDefault();

        // Get the current scale of the stage
        const oldScale = stage.scaleX();

        // Get the mouse pointer's position relative to the stage
        const pointer = stage.getPointerPosition();

        // Calculate the new scale based on the wheel movement
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        // Calculate the new position for the stage to zoom towards the mouse pointer
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        // Apply the new scale to the stage
        stage.scale({ x: newScale, y: newScale });

        // Adjust the stage's position so that the mouse pointer stays in the same place
        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        // Update the stage's position and redraw it
        stage.position(newPos);
        stage.batchDraw();
    });
  }


}
