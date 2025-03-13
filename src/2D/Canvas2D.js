// Importing the sharedData for accessing shared resources
import { sharedData } from "../Ahu3D/globals.js"

export default class Canvas2D {

  createLayer(ahuObject) {
    this.ahuObject = ahuObject;

    console.log("createLayer ahuObject:", ahuObject);

    const layer = new Konva.Layer();

    this.jointCenter = {
      x: 0,
      z: 0,
    };

    // Create the AHU shapes and add to the layer
    this.ahuToLayer(layer);

    return layer;
  }

  /**
   * Draws the AHU object to the canvas viewport using Konva.js.
   * @param {Object} ahuObject - The AHU object that contains resources and components to draw.
   * @param {string} domID - The ID of the DOM element to attach the canvas to.
   */
  drawToViewport(layer, domID) {
    console.log("drawToViewport ahuObject", domID);

    // Storing the AHU object for use in other functions
    
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
    stage.add(layer);    

    // Draw the frame around the objects in the viewport
    this.drawFrame(layer);

    // Fit the layer content to the frame with a 90% zoom-out factor
    this.fitLayerToFrame(layer, containerWidth, containerHeight, 0.90);

    // Set canvas events such as resize handling
    this.setCanvasEvents(layer, stage, container);

    // Redraw the layer after setup
    // layer.draw();

    return stage;
  }


  /**
   * Renders the AHU's ducts and components to the given layer.
   * @param {Konva.Layer} layer - The layer to render the AHU onto.
   */
  ahuToLayer(layer) {
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
          this.renderComponentSvg(layer, relativePosition, componentSvg, duct);
        }
      }
  
      // Handle ends (such as inserts or caps) attached to ducts
      if(this.ahuObject.associations.ducts[ductKey].ends) {
        for(const endKey in this.ahuObject.associations.ducts[ductKey].ends) {
          const endKey = this.ahuObject.associations.ducts[ductKey].ends[0];
          const end = this.ahuObject.resources.ends[endKey];
          console.log("ahuToLayer drawEnd starting:", this.ahuObject, endKey);
          this.drawEnd(layer, end, endKey, konvaOptions);
        }
      }
    }
  
    // Create 2D joints and add them to the layer
    for (const jointKey in this.ahuObject.resources.joints) {
      this.create2DJoint(layer, this.ahuObject.resources.joints[jointKey], jointKey);
    }
  
    // Draw controllers if they exist in the resources
    if (this.ahuObject.resources.controllers) {
      this.drawControllers(layer);
    }
  
    // Render additional helper elements (arrows, labels, etc.)
    this.renderHelpers(layer);
  }

  /**
   * Draws controllers to the given layer in the canvas.
   * This method handles rendering the controller boxes and their input/output ports.
   * @param {Konva.Layer} layer - The layer to which the controllers should be drawn.
   */
  drawControllers(layer) {
    // Iterate over all controllers in the AHU object and render them
    for (const controllerId in this.ahuObject.resources.controllers) {
      const controller = this.ahuObject.resources.controllers[controllerId];
      
      // Draw the main controller box
      this.drawControllerBox(layer, controller);
      
      // Draw the input/output ports (spheres)
      this.drawControllerPorts(layer, controller);
    }
  }

  /**
   * Draws the main controller box to the layer.
   * @param {Konva.Layer} layer - The layer to add the controller box to.
   * @param {Object} controller - The controller object containing position and dimension data.
   */
  drawControllerBox(layer, controller) {
    const { x, z } = controller.calculatedPosition;
    const { x: width, z: height } = controller.dimensions;
    
    // Create controller box as a rectangle
    const controllerBox = new Konva.Rect({
      x: x,
      y: z * -1, // Convert to canvas coordinate system (flip z)
      width: width,
      height: height,
      offsetX: width / 2, // Center the box at its position
      offsetY: height / 2,
      stroke: 'white',
      strokeWidth: 10,
      fill: '#333333', // Dark background for the controller
      cornerRadius: 15, // Slightly rounded corners
    });
    
    // Add elements to the layer
    layer.add(controllerBox);
  }

  /**
   * Draws the controller ports (input/output spheres) to the layer.
   * @param {Konva.Layer} layer - The layer to add the controller ports to.
   * @param {Object} controller - The controller object containing port position data.
   */
  drawControllerPorts(layer, controller) {
    const baseX = controller.calculatedPosition.x;
    const baseZ = controller.calculatedPosition.z;
    const portRadius = 40; // Size of the port circles
    
    // Draw input ports (spheres)
    if (controller.spherePositions.inputs) {
      controller.spherePositions.inputs.forEach((port, index) => {
        // Calculate absolute position
        const portX = baseX + port.position.x;
        const portY = (baseZ + port.position.z) * -1; // Convert to canvas coordinate system (flip z)
        
        // Create port circle
        const portCircle = new Konva.Circle({
          x: portX,
          y: portY,
          radius: portRadius,
          // fill: '#4CAF50', // Green for inputs
          stroke: 'white',
          strokeWidth: 10
        });
        
        // Add port elements to the layer
        layer.add(portCircle);
      });
    }
    
    // Draw output ports (spheres)
    if (controller.spherePositions.outputs) {
      controller.spherePositions.outputs.forEach((port, index) => {
        // Calculate absolute position
        const portX = baseX + port.position.x;
        const portY = (baseZ + port.position.z) * -1; // Convert to canvas coordinate system (flip z)
        
        // Create port circle
        const portCircle = new Konva.Circle({
          x: portX,
          y: portY,
          radius: portRadius,
          // fill: '#2196F3', // Blue for outputs
          stroke: 'white',
          strokeWidth: 10
        });
        
        // Add port elements to the layer
        layer.add(portCircle);
      });
    }
  }

  /**
   * Renders an SVG component directly onto the layer instead of using a group.
   * @param {Konva.Layer} layer - The Konva layer to add the component image to.
   * @param {Object} relativePosition - The relative position of the component inside the duct.
   * @param {string} componentSvg - The SVG content for the component.
   * @param {Object} duct - The duct to which the component belongs.
   */
  renderComponentSvg(layer, relativePosition, componentSvg, duct) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(componentSvg, "image/svg+xml");
    const paths = svgDoc.querySelectorAll("path");

    const width = 381;
    const height = duct.dimensions.z;

    let viewBox = svgDoc.documentElement.getAttribute("viewBox");
    let [vbX, vbY, vbWidth, vbHeight] = viewBox
        ? viewBox.split(" ").map(Number)
        : [0, 0, width, height]; // Fallback to default size if no viewBox

    // Calculate scaling factors
    const scaleX = width / vbWidth;
    const scaleY = height / vbHeight;

    const adjustedX = duct.position.x + relativePosition.x;
    const adjustedY = (duct.position.z + relativePosition.z) * -1;
    const rotation = duct.rotation.y;

    // If the duct is rotated 90 or 270 degrees, swap x and z coordinates
    let finalX = adjustedX;
    let finalY = adjustedY;
    if (rotation !== 0 && rotation !== 180) {
        finalX = duct.position.x + relativePosition.z;
        finalY = (duct.position.z + relativePosition.x) * -1;
    }

    paths.forEach((pathElement) => {
        const pathData = pathElement.getAttribute("d");
        if (!pathData) return;

        const konvaPath = new Konva.Path({
            data: pathData,
            x: finalX,
            y: finalY,
            stroke: "white",
            strokeWidth: 15 / Math.max(scaleX, scaleY), // Normalize stroke width
            fill: "transparent",
            scaleX: scaleX,
            scaleY: rotation === 180 ? -scaleY : scaleY, // Flip if rotated 180 degrees
            rotation: rotation,
            offsetX: width / (2 * scaleX),
            offsetY: height / (2 * scaleY),
        });

        layer.add(konvaPath);
    });

    layer.batchDraw(); // Ensure rendering update
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

        let arrowPath = this.convertArrowToPath(arrow);

        // Add the arrow to the layer
        layer.add(arrowPath);
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
    // layer.batchDraw(); 
  }

  convertArrowToPath(arrow) {
    const points = arrow.points(); // Extract the arrow points array
    const pointerLength = arrow.pointerLength() * 4;
    const pointerWidth = arrow.pointerWidth() * 4;
    const strokeWidth = arrow.strokeWidth();
    const strokeColor = arrow.stroke();

    // Extract start and end points
    const [x1, y1, x2, y2] = points;

    // Calculate the arrowhead points
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowHead1 = [
        x2 - pointerLength * Math.cos(angle) + (pointerWidth / 2) * Math.sin(angle),
        y2 - pointerLength * Math.sin(angle) - (pointerWidth / 2) * Math.cos(angle)
    ];
    const arrowHead2 = [
        x2 - pointerLength * Math.cos(angle) - (pointerWidth / 2) * Math.sin(angle),
        y2 - pointerLength * Math.sin(angle) + (pointerWidth / 2) * Math.cos(angle)
    ];

    // Construct SVG path data equivalent to the arrow shape
    const pathData = `
        M ${x1} ${y1}
        L ${x2} ${y2}
        M ${arrowHead1[0]} ${arrowHead1[1]}
        L ${x2} ${y2}
        L ${arrowHead2[0]} ${arrowHead2[1]}
    `;

    // Create a Konva.Path with the same style as the original arrow
    const path = new Konva.Path({
        data: pathData,
        stroke: strokeColor,
        strokeWidth: strokeWidth
    });

    // Apply the same position and rotation
    path.position(arrow.position());
    path.rotation(arrow.rotation());

    return path;
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
  calculatejointcenter(joint, jointKey) {
    console.log("calculatejointcenter joint:", joint, this.ahuObject);

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

    const offset = 250;

    if(this.jointKeys.length == 2) {
      if(joint.up && joint.left) {
        jointCenter.x += -offset;
        jointCenter.z += offset;
      }
      else if(joint.up && joint.right) {
        jointCenter.x += offset;
        jointCenter.z += offset;
      }
      else if(joint.down && joint.right) {
        jointCenter.x += offset;
        jointCenter.z += -offset;
      }
      else if(joint.down && joint.left) {
        jointCenter.x += -offset;
        jointCenter.z += -offset;
      }
    }    

    return jointCenter;  // Return the calculated joint center
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
   * Draws a small circle at the joint center position to visualize it.
   * @param {Konva.Layer} layer - The layer to add the circle to.
   * @param {Object} center - The center point with x and z coordinates.
   * @param {string} color - The color of the circle (default: "red").
   * @param {number} radius - The radius of the circle (default: 50).
   */
  drawJointCenter(layer, center, color = "red", radius = 50) {
    // Create a circle at the joint center
    const centerCircle = new Konva.Circle({
      x: center.x,
      y: center.z * -1, // Convert z to canvas y-coordinate (flipped)
      radius: radius,
      fill: color,
      stroke: 'white',
      strokeWidth: 5,
    });
    
    // Add the circle to the layer
    layer.add(centerCircle);
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

    this.jointCenter = this.calculatejointcenter(joint, jointKey);

    console.log("create2DJoint jointCenter:", this.jointCenter);

    // Draw a circle at the joint center for visualization
    // this.drawJointCenter(layer, this.jointCenter);

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
          this.createJointCorner(layer, point1, point2, midPoint, "outwards");
        }
        else if(joint.up && joint.left) {
          point1 = joint.left.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy2.position;
          point2 = joint.up.proxy2.position;
          midPoint = joint.left.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint, "outwards");
        }
        else if(joint.down && joint.right) {
          point1 = joint.right.proxy1.position;
          point2 = joint.down.proxy1.position;
          midPoint = joint.right.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint, "outwards");

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
          this.createJointCorner(layer, point1, point2, midPoint, "outwards");
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

          this.createJointCorner(layer, point1, point2, midPoint, "outwards");

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

          this.createJointCorner(layer, point1, point2, midPoint, "outwards");
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

          this.createJointCorner(layer, point1, point2, midPoint, "outwards");
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

          this.createJointCorner(layer, point1, point2, midPoint, "outwards");

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
 * Determines if two points have approximately equal x and z distances.
 * This can be used to identify diagonal movements that should have arcs.
 * 
 * @param {Object} point1 - First point with x and z properties.
 * @param {Object} point2 - Second point with x and z properties.
 * @param {number} threshold - Ratio threshold to consider distances approximately equal.
 * @returns {boolean} True if x and z distances are approximately equal, false otherwise.
 */
haveEqualXZDistances(point1, point2, threshold = 0.2) {
  // Calculate the absolute distances in x and z directions
  const xDistance = Math.abs(point1.x - point2.x);
  const zDistance = Math.abs(point1.z - point2.z);
  
  // Avoid division by zero
  if (xDistance === 0 || zDistance === 0) {
    return false; // One dimension has no movement, so they're not equal
  }
  
  // Calculate the ratio between the two distances
  const ratio = Math.max(xDistance, zDistance) / Math.min(xDistance, zDistance);
  
  // If the ratio is close to 1, the distances are approximately equal
  return Math.abs(ratio - 1) <= threshold;
}

/**
 * Modified version of arePointsColinear that considers both colinearity and equal distances.
 * @param {Object} point1 - First point with x and z properties.
 * @param {Object} point2 - Second point with x and z properties.
 * @param {number} colinearThreshold - Distance threshold to consider points aligned.
 * @param {number} equalDistanceThreshold - Ratio threshold for equal distances.
 * @returns {Object} An object with isColinear and hasEqualDistances properties.
 */
analyzePointRelationship(point1, point2, colinearThreshold = 30, equalDistanceThreshold = 0.2) {
  // Check for colinearity (aligned on X or Z axis)
  const alignedOnX = Math.abs(point1.x - point2.x) <= colinearThreshold;
  const alignedOnZ = Math.abs(point1.z - point2.z) <= colinearThreshold;
  const isColinear = alignedOnX || alignedOnZ;
  
  // Check for equal distances in X and Z
  const hasEqualDistances = this.haveEqualXZDistances(point1, point2, equalDistanceThreshold);
  
  return {
    isColinear,
    hasEqualDistances,
    alignedOnX,
    alignedOnZ
  };
}

/**
 * Creates a corner for the joint and adds it to the layer.
 * Now supports overriding the arc direction for specific corners.
 * 
 * @param {Konva.Layer} layer - The layer to add the joint corner to.
 * @param {Object} point1 - The first point of the joint corner.
 * @param {Object} point2 - The second point of the joint corner.
 * @param {Object} midPoint - The midpoint for the joint corner.
 * @param {string} [arcDirectionOverride] - Optional override for arc direction ("inwards", "outwards", or null to use default)
 */
createJointCorner(layer, point1, point2, midPoint, arcDirectionOverride = null) {
  // Store the original direction from sharedData
  const originalDirection = sharedData.jointDirection;
  
  // If an override is provided, temporarily set the direction
  if (arcDirectionOverride !== null) {
    sharedData.jointDirection = arcDirectionOverride;
  }
  
  // Analyze relationships between points
  const p1ToP2 = this.analyzePointRelationship(point1, point2);
  const p1ToMid = this.analyzePointRelationship(point1, midPoint);
  const p2ToMid = this.analyzePointRelationship(point2, midPoint);
  
  // Draw straight lines for colinear points
  if (p1ToP2.isColinear) {
    this.drawStraightLine(layer, point1, point2);
  }
  
  if (p1ToMid.isColinear) {
    this.drawStraightLine(layer, point1, midPoint);
  }
  
  if (p2ToMid.isColinear) {
    this.drawStraightLine(layer, point2, midPoint);
  }
  
  // Draw arcs for points with equal x-z distances (diagonal movement)
  if (p1ToP2.hasEqualDistances) {
    this.createJointArc(layer, point1, point2, midPoint);
  }
  
  if (p1ToMid.hasEqualDistances) {
    this.createJointArc(layer, point1, midPoint, point2);
  }
  
  if (p2ToMid.hasEqualDistances) {
    this.createJointArc(layer, midPoint, point2, point1);
  }
  
  // Restore the original direction if an override was applied
  if (arcDirectionOverride !== null) {
    sharedData.jointDirection = originalDirection;
  }
}

/**
 * Helper method to draw a straight line between two points.
 * 
 * @param {Konva.Layer} layer - The layer to add the line to.
 * @param {Object} point1 - The first point with x and z properties.
 * @param {Object} point2 - The second point with x and z properties.
 */
drawStraightLine(layer, point1, point2) {
  const points = [
    point1.x, point1.z * -1,
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

/**
 * Creates an arc for the joint and adds it to the layer.
 * This improved version creates a smooth curve between the two non-colinear points,
 * with direction based on sharedData.jointDirection and jointCenter.
 * 
 * @param {Konva.Layer} layer - The layer to add the joint arc to.
 * @param {Object} startPoint - The starting point of the joint arc.
 * @param {Object} endPoint - The ending point of the joint arc.
 * @param {Object} controlPoint - A control point to help determine the curve.
 */
createJointArc(layer, startPoint, endPoint, controlPoint) {
  // Convert points to canvas coordinates
  const x1 = startPoint.x;
  const y1 = startPoint.z * -1;
  const x2 = endPoint.x;
  const y2 = endPoint.z * -1;
  
  // Calculate the midpoint between the two points
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Calculate the distance between the two points
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  
  // Calculate the normalized perpendicular vector
  let perpX = -(y2 - y1);
  let perpY = x2 - x1;
  const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
  perpX = perpX / perpLength;
  perpY = perpY / perpLength;

  // Get the direction preference from sharedData
  const curveDirection = sharedData.jointDirection || "outwards"; // Default to "outwards" if not specified
  
  // Calculate vector from midpoint to jointCenter (if available)
  let vecToJointCenterX = 0;
  let vecToJointCenterY = 0;
  
  if (this.jointCenter) {
    vecToJointCenterX = this.jointCenter.x - midX;
    vecToJointCenterY = (this.jointCenter.z * -1) - midY;
  } else {
    // Fallback to using controlPoint if jointCenter isn't available
    vecToJointCenterX = controlPoint.x - midX;
    vecToJointCenterY = (controlPoint.z * -1) - midY;
  }
  
  // Normalize the vector to jointCenter
  const vecLength = Math.sqrt(vecToJointCenterX * vecToJointCenterX + vecToJointCenterY * vecToJointCenterY);
  if (vecLength > 0) {
    vecToJointCenterX /= vecLength;
    vecToJointCenterY /= vecLength;
  }
  
  // Dot product to determine if jointCenter and perpendicular vector are on same side
  const dotProduct = vecToJointCenterX * perpX + vecToJointCenterY * perpY;
  
  // Set curvature factor based on dotProduct and curveDirection
  let curveFactor;
  if (curveDirection === "inwards") {
    // For inwards direction, make the arc curve toward the joint center
    curveFactor = dotProduct > 0 ? 0.3 : -0.3;
  } else { // "outwards" or default
    // For outwards direction, make the arc curve away from the joint center
    curveFactor = dotProduct > 0 ? -0.3 : 0.3;
  }
  
  // Calculate the control point for the quadratic curve
  const cpX = midX + perpX * distance * curveFactor;
  const cpY = midY + perpY * distance * curveFactor;
  
  // Use Konva.Path for a smooth curved line
  const pathData = `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`;
  
  const jointPath = new Konva.Path({
    data: pathData,
    stroke: 'white',
    strokeWidth: 30,
    lineCap: 'round',
  });
  
  layer.add(jointPath);
  
  // Debug visualization if needed
  if (sharedData.debug) {
    // Add a small circle at the control point for debugging
    const debugCircle = new Konva.Circle({
      x: cpX,
      y: cpY,
      radius: 10,
      fill: 'red',
    });
    layer.add(debugCircle);
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
        fill: "transparent",
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
        fill: "transparent",
        strokeWidth: 30,
        listening: false, // Disable event listening on the text frame
    });

    // Add the frame, text frame, and text to the layer
    layer.add(frame);
    layer.add(textFrame);
    layer.add(text);

    layer.frameWidth = frameWidth;
    layer.frameHeight = frameHeight;

    frame.moveToBottom();

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
    // layer.draw();
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
        // layer.draw();
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
        // stage.batchDraw();
    });
  }


}
