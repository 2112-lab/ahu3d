import { sharedData } from "../Ahu3D/globals.js"

export default class Canvas2D {
  drawToViewport(ahuObject, domID) {
    console.log("drawToViewport ahuObject", domID, ahuObject);
    this.ahuObject = ahuObject;
    const container = document.getElementById(domID);

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const stage = new Konva.Stage({
        container: domID,
        width: containerWidth,
        height: containerHeight,
        draggable: true,
        pixelRatio: 1
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    this.renderAhuToLayer(layer);

    this.drawFrame(layer);

    this.fitLayerToFrame(layer, containerWidth, containerHeight, 0.90);

    this.setCanvasEvents(layer, stage, container);

    layer.draw();
  }

  renderAhuToLayer(layer) {
    for (const ductKey in this.ahuObject.resources.ducts) {
      const duct = this.ahuObject.resources.ducts[ductKey];
  
      let width = duct.dimensions.x + 5;
      let height = duct.dimensions.z;
      let activeWalls = { top: true, bottom: true, left: false, right: false };
  
      if (duct.rotation.y !== 0 && duct.rotation.y !== 180) {
        [width, height] = [height, width]; // Swap width and height
        activeWalls = { top: false, bottom: false, left: true, right: true };
      }
  
      // Draw Duct Independently
      const konvaOptions = {
        stroke: 'white',
        strokeWidth: 30,
        perfectDrawEnabled: true,
        opacity: 0.95,
      };
  
      const lines = this.createDuct(duct.position.x, duct.position.z * -1, width, height, konvaOptions, activeWalls);
      lines.forEach(line => layer.add(line));
  
      // Create a Group for the Components Only
      const componentGroup = new Konva.Group({
        x: duct.position.x,
        y: duct.position.z * -1,
        rotation: duct.rotation.y, // Rotate only the components, not the duct
        offsetX: 0, // No offset applied here
        offsetY: 0,
      });
  
      // Add components inside the componentGroup
      if (this.ahuObject.associations.ducts[ductKey].components) {
        for (const i in this.ahuObject.associations.ducts[ductKey].components) {
          const componentId = this.ahuObject.associations.ducts[ductKey].components[i];
          const componentKey = this.ahuObject.xetoDictionary.components[componentId].componentId.split("r:novo.graphics::")[1];
          const componentSvg = sharedData.componentLibrary[componentKey].svg;
          const componentResource = this.ahuObject.resources.components[componentId];
  
          // Convert absolute component position to relative
          const relativePosition = {
            x: componentResource.position.x - duct.position.x,
            z: (componentResource.position.z - duct.position.z) * -1, // Adjust y-axis flipping
          };
  
          this.renderSvg(componentGroup, relativePosition, componentSvg, duct);
        }
      }

      if(this.ahuObject.associations.ducts[ductKey].ends) {
        for(const endKey in this.ahuObject.associations.ducts[ductKey].ends) {
          const endKey = this.ahuObject.associations.ducts[ductKey].ends[0];
          const end = this.ahuObject.resources.ends[endKey];
          console.log("renderAhuToLayer drawEnd starting:", this.ahuObject, endKey);
          this.drawEnd(layer, end, endKey, konvaOptions);
        }
        
      }  
  
      // Add only the component group to the layer (so it rotates independently)
      layer.add(componentGroup);
    }
    
  
    for (const jointKey in this.ahuObject.resources.joints) {
      this.create2DJoint(layer, this.ahuObject.resources.joints[jointKey], jointKey);
    }

    this.renderHelpers(layer);
  }

  renderHelpers(layer) {
    const ahuObject = this.ahuObject;
    console.log("renderHelpers started:", ahuObject);

    // Process Arrows
    for (const arrowId in ahuObject.auxiliary["3d"].arrows) {
        const arrowResource = ahuObject.auxiliary["3d"].arrows[arrowId];

        const ductKey = ahuObject.associations.arrows[arrowId];
        const duct = ahuObject.resources.ducts[ductKey];

        const blockStyle = ahuObject.xetoDictionary.edges[ductKey].blockStyle;

        console.log("renderHelpers arrowResource:", arrowResource, arrowId);

        let offset = 0;
        const endKey = ahuObject.associations.ducts[ductKey].ends[0];
        if(endKey) {
          if(endKey.includes("Insert")) {
            offset = 200;
          }
        }

        // Convert position and rotation from 3D (Three.js) to 2D (Konva)
        let x = arrowResource.position.x + offset;
        let y = -arrowResource.position.z; // Convert to 2D canvas space
        const rotation = duct.rotation.y; // Keep the same Y rotation

        if(rotation == 90) {
          x -= offset;
          y -= offset;
        }

        const arrowLength = 800; // Total length of arrow                

        // Create a Konva arrow
        let arrow = new Konva.Arrow({
            points: [-arrowLength / 2, 0, arrowLength / 2, 0], // Center the arrow on (x, y)
            pointerLength: 30,
            pointerWidth: 30,
            stroke: "white", // blockStyle.helpers.arrow.material.color
            strokeWidth: 64,
            x: x, // Position the arrow at its center
            y: y,
            rotation: rotation, // Apply rotation in degrees
        });

        layer.add(arrow); // Add to Konva layer
    }

    // Process Labels (Text)
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

        layer.add(label); // Add text label to Konva layer
    }

    layer.batchDraw(); // Redraw the layer after adding elements
}


  renderSvg(componentGroup, relativePosition, componentSvg, duct) {
    const width = 381;
    const height = duct.dimensions.z; // Set height dynamically if needed
  
    // Convert SVG to Data URL
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
      });
  
      componentGroup.add(konvaImage); // Add to the component group
    };
    img.src = svgUrl;
  }
  
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

  create2DJoint(layer, joint, jointKey) {
    console.log("create2DJoint:", joint);

    let point1 = null;
    let point2 = null;
    let midPoint = null;

    const jointKeys = Object.keys(joint);

    const jointCenter = this.calculate2DJointCenter(joint, jointKey);

    console.log("create2DJoint jointCenter:", jointCenter);

      if(jointKeys.length == 2) {
        if(joint.up && joint.right) {
          point1 = joint.up.proxy2.position;
          point2 = joint.right.proxy1.position;
          midPoint = joint.right.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.right.proxy2.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);
        }
        else if(joint.up && joint.left) {
          point1 = joint.left.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy2.position;
          point2 = joint.up.proxy2.position;
          midPoint = joint.left.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);
        }
        else if(joint.down && joint.right) {
          point1 = joint.right.proxy1.position;
          point2 = joint.down.proxy1.position;
          midPoint = joint.right.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);

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
          this.createJointCorner(layer, point1, point2, midPoint);
        }
        else if(joint.up && joint.down) {
          point1 = joint.up.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.down.proxy1.position;
          // midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.up.proxy2.position;
          point2 = joint.up.proxy2.position;
          midPoint = joint.down.proxy2.position;
          // midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
          this.createJointCorner(layer, point1, point2, midPoint);
        }
        else if(joint.left && joint.right) {
          point1 = joint.left.proxy1.position;
          point2 = joint.right.proxy1.position;
          midPoint = joint.right.proxy1.position;
          // midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy2.position;
          point2 = joint.right.proxy2.position;
          midPoint = joint.right.proxy2.position;
          // midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
          this.createJointCorner(layer, point1, point2, midPoint);
        }
      }
      else if(jointKeys.length == 3) {
        if(!joint.right) {
          point1 = joint.up.proxy2.position;
          point2 = joint.down.proxy2.position;
          midPoint = joint.down.proxyMedian.position;
          if(point1.x == point2.x) {
            midPoint = point2;
          }

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

          this.createJointCorner(layer, point1, point2, midPoint);
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

          this.createJointCorner(layer, point1, point2, midPoint);
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

          this.createJointCorner(layer, point1, point2, midPoint);

          point1 = joint.left.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = joint.up.proxyMedian.position;
          this.createJointCorner(layer, point1, point2, midPoint);
        }
      }
      else if(jointKeys.length == 4) {
        point1 = joint.up.proxy2.position;
        point2 = joint.right.proxy1.position;
        midPoint = joint.right.proxyMedian.position;
        // midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
        this.createJointCorner(layer, point1, point2, midPoint);

        point1 = joint.right.proxy2.position;
        point2 = joint.down.proxy2.position;
        midPoint = joint.down.proxyMedian.position;
        // midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
        this.createJointCorner(layer, point1, point2, midPoint);

        point1 = joint.down.proxy1.position;
        point2 = joint.left.proxy2.position;
        midPoint = joint.left.proxyMedian.position;
        // midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
        this.createJointCorner(layer, point1, point2, midPoint);

        point1 = joint.left.proxy1.position;
        point2 = joint.up.proxy1.position;
        midPoint = joint.up.proxyMedian.position;
        // midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
        this.createJointCorner(layer, point1, point2, midPoint);
      }      
    
  }

  createJointCorner(layer, point1, point2, midPoint) {

    if(sharedData.xzJointStyle == "arc") {
      this.createJointArc(layer, point1, point2, midPoint);
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

  createJointArc(layer, point1, point2, midPoint) {
    console.log("createJointArc started");

    // Convert z to match Konva's coordinate system
    const p1 = { x: point1.x, y: point1.z };
    const p2 = { x: point2.x, y: point2.z };
    const mid = { x: midPoint.x, y: midPoint.z };

    const cornerDistance = Math.min( Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y) );

    let flipArc = false;

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

    if(sharedData.xzJointDirection == "outwards") {
      if (p1.x < p2.x && p1.y > p2.y) {
        rotation = -90;
        cx = mid.x;
        cy = mid.y - radius;
        isSet = true;
        if(!(mid.x != p2.x && mid.y != p2.y)) {
          flipArc = true;
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
          flipArc = true;
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
          flipArc = true;
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
          flipArc = true;
          cx = mid.x + radius;
          cy = mid.y;
        }
      }
    }
    else if(sharedData.xzJointDirection == "inwards") {
      if (p1.x < p2.x && p1.y > p2.y) {
        rotation = 90;
        cx = mid.x + radius;
        cy = mid.y + halfWT;
        isSet = true;
        if(!(mid.x != p2.x && mid.y != p2.y)) {
          flipArc = true;
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
          flipArc = true;
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
          flipArc = true;
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
          flipArc = true;
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

    // if(flipArc) {
    //   this.renderPoint(layer, midPoint, "#ff0000");
    // }
    // else {
    //   this.renderPoint(layer, midPoint, "#00ff00");
    // }    
    
  }

  createMidPoint(point1, point2, jointCenter, isFlipped = false) {
    console.log("createMidPoint started");

    // Define the two possible corner points
    const corners = [
      { x: point1.x, z: point2.z }, // Corner 1
      { x: point2.x, z: point1.z }, // Corner 2
    ];

    // Determine which corner is closest to the jointCenter
    let [corner1, corner2] = corners;

    const distance1 = Math.sqrt(
      Math.pow(corner1.x - jointCenter.x, 2) +
      Math.pow(corner1.z - jointCenter.z, 2)
    );

    const distance2 = Math.sqrt(
      Math.pow(corner2.x - jointCenter.x, 2) +
      Math.pow(corner2.z - jointCenter.z, 2)
    );

    // Determine the closest and flipped corner
    let closestCorner = distance1 < distance2 ? corner1 : corner2;
    let flippedCorner = distance1 < distance2 ? corner2 : corner1;

    // Return the closest or flipped corner based on `isFlipped`
    return isFlipped ? flippedCorner : closestCorner;
  }

  renderPoint(layer, point, color = "#00ff00") {
    const circle = new Konva.Circle({
      x: point.x,
      y: point.z * -1,
      radius: 50,
      stroke: color,
      strokeWidth: 32,
    });
    layer.add(circle);
  }

  calculate2DJointCenter(joint, jointKey) {
    console.log("calculate2DJointCenter joint:", joint, this.ahuObject);

    let jointCenter = {
      x: 0,
      z: 0,
    }

    for(const ductKey of this.ahuObject.associations.joints[jointKey].ducts) {
      const duct = this.ahuObject.resources.ducts[ductKey];
      if(this.ahuObject.xetoDictionary.edges[ductKey].isVertical) {
        jointCenter.x = duct.position.x;
      }
      else {
        jointCenter.z = duct.position.z;
      }
    }  

    // const circle = new Konva.Circle({
    //   x: jointCenter.x,
    //   y: jointCenter.z * -1,
    //   radius: 50,
    //   stroke: '#ff0000',
    //   strokeWidth: 32,
    // });
    // layer.add(circle);

    return jointCenter;
  }

  drawEnd(layer, end, endKey, konvaOptions) {
    console.log("drawEnd end:", end);

    let width = end.dimensions.z;
    let height = 200;

    if(endKey.includes("Insert")) {
      const shape = this.createInsert(end, width, height);
      layer.add(shape);
    }
    if(endKey.includes("Cap")) {
      const shape = this.createCap(end, width, height);
      layer.add(shape);
    }

  }

  createInsert(end, width, height) {
    let offset = 14;
    const insert = new Konva.Shape({
      x: end.position.x,
      y: end.position.z * -1,
      rotation: end.rotation.y, // Ensure rotation is applied if necessary
      sceneFunc: (context, shape) => {
        context.beginPath();
        context.lineCap = 'round';

        // Bottom left corner
        context.moveTo((-width / 2), 0 + offset);
        context.lineTo(((-width / 2) - 120), (height * -1) + offset);

        // Connect to the top right tip
        context.lineTo(((width / 2) + 120), (height * -1) + offset);

        // Close only the WIDE end by adding a line back to the other side
        context.lineTo(((width / 2)), 0 + offset);

        // Fill and/or stroke the shape
        context.fillStrokeShape(shape);
      },
      stroke: 'white', // Optional stroke
      strokeWidth: 30, // Optional stroke width
    });

    return insert;
  }

  createCap(end, width, height) {
    let offset = 14;
    const cap = new Konva.Shape({
      x: end.position.x,
      y: end.position.z * -1,
      rotation: end.rotation.y, // Ensure rotation is applied if necessary
      sceneFunc: (context, shape) => {
        context.beginPath();

        context.lineCap = 'round';
    
        // Define your custom shape's path
        context.moveTo((-width / 2), 0 + offset); // Top-left corner
        context.lineTo((width / 2), 0 + offset);  // Top-right corner
        // context.closePath();
    
        // Fill and/or stroke the shape
        context.fillStrokeShape(shape);
      },
      stroke: 'white', // Optional stroke
      strokeWidth: 30, // Optional stroke width
    });

    return cap;
  }

  setCanvasEvents(layer, stage, container){

    this.setKonvaWheel(stage);

    // Function to resize the stage dynamically
    const resizeStage = () => {
      const newWidth = container.offsetWidth;
      const newHeight = container.offsetHeight;
  
      // Update stage size
      stage.width(newWidth);
      stage.height(newHeight);
  
      // Reset layer scale and position before refitting
      layer.scale({ x: 1, y: 1 });
      layer.position({ x: 0, y: 0 });
  
      // Call your fit function to re-adjust the content correctly
      this.fitLayerToFrame(layer, newWidth, newHeight, 0.90);
  
      layer.draw();
    };

    // Observe container size changes and trigger resize
    window.addEventListener('resize', resizeStage);

    // Optional: Use ResizeObserver for better efficiency
    const resizeObserver = new ResizeObserver(() => {
      resizeStage();
    });
    resizeObserver.observe(container);
  }

  drawFrame(layer) {
    // Define padding values (adjust as needed)
    const paddingX = 500;  // Extra horizontal padding
    const paddingY = 500; // Extra vertical padding

    // Get all elements, including ducts, joints, and ends
    const shapes = layer.getChildren();
    let boundingBox = {
        x: Infinity,
        y: Infinity,
        width: 0,
        height: 0
    };

    // Compute bounding box from all shapes (ducts, joints, etc.)
    shapes.forEach(shape => {
        const rect = shape.getClientRect();
        boundingBox.x = Math.min(boundingBox.x, rect.x);
        boundingBox.y = Math.min(boundingBox.y, rect.y);
        boundingBox.width = Math.max(boundingBox.width, rect.x + rect.width - boundingBox.x);
        boundingBox.height = Math.max(boundingBox.height, rect.y + rect.height - boundingBox.y);
    });

    // Ensure ends are included in bounding box calculations
    for (const endKey in this.ahuObject.resources.ends) {
        const end = this.ahuObject.resources.ends[endKey];

        const endX = end.position.x;
        const endY = end.position.z * -1; // Convert to Konva coordinate system
        const endWidth = end.dimensions.z + paddingX; // Adding padding
        const endHeight = 200 + paddingY; // Adding padding

        boundingBox.x = Math.min(boundingBox.x, endX - endWidth / 2);
        boundingBox.y = Math.min(boundingBox.y, endY - endHeight / 2);
        boundingBox.width = Math.max(boundingBox.width, endX + endWidth / 2 - boundingBox.x);
        boundingBox.height = Math.max(boundingBox.height, endY + endHeight / 2 - boundingBox.y);
    }

    // Compute frame position
    const frameX = boundingBox.x - paddingX;
    const frameY = boundingBox.y - paddingY / 2; // Center the padding vertically
    const frameWidth = boundingBox.width + 2 * paddingX;
    const frameHeight = boundingBox.height + paddingY;

    // Apply padding to the entire bounding box
    const frame = new Konva.Rect({
        x: frameX,
        y: frameY,
        width: frameWidth,
        height: frameHeight,
        stroke: 'white',  // Frame color
        strokeWidth: 30,   // Frame thickness
        listening: false,  // Ensure frame does not capture events
    });

    // Compute text position (slightly above the bottom frame line)
    const textY = frameY + frameHeight - 0; // Position above bottom frame
    const text = new Konva.Text({
        text: "AHU-1 Blueprint",
        fontSize: 200,  // Adjust size as needed
        fontFamily: "Arial",
        fill: "white",  // Text color
        x: frameX + frameWidth / 2, // Center horizontally
        y: textY,
        align: "center",
        verticalAlign: "bottom",
        offsetY: -70
    });

    // Adjust text position to center it properly
    text.offsetX(text.width() / 2);

    // Apply padding to the entire bounding box
    const textFrame = new Konva.Rect({
      x: frameX,
      y: textY,
      width: frameWidth,
      height: 320,
      stroke: 'white',  // Frame color
      strokeWidth: 30,   // Frame thickness
      listening: false,  // Ensure frame does not capture events
    });

    // Add frame, text, and line to the layer
    layer.add(frame);
    layer.add(text);
    layer.add(textFrame);
  }
    
  fitLayerToFrame(layer, containerWidth, containerHeight, zoomOutFactor = 0.90) {
    // Find the frame object in the layer
    const frame = layer.getChildren().find(shape => shape.getClassName() === "Rect" && shape.stroke() === "white");

    // Get the frame's bounding box
    const frameBox = frame.getClientRect();
    
    // Calculate scaling factors
    const scaleX = containerWidth / frameBox.width;
    const scaleY = containerHeight / frameBox.height;
    let scale = Math.min(scaleX, scaleY) * zoomOutFactor;

    // Centering offsets
    const offsetX = (containerWidth - frameBox.width * scale) / 2;
    const offsetY = (containerHeight - frameBox.height * scale) / 2;

    // Apply scaling and positioning to fit to the frame
    layer.scale({ x: scale, y: scale });
    layer.position({
        x: -frameBox.x * scale + offsetX,
        y: -frameBox.y * scale + offsetY,
    });

    layer.draw();
  }
  
  setKonvaWheel(stage) {
      // Add mouse wheel zoom functionality
      const scaleBy = 1.15; // Zoom speed
      stage.on('wheel', (e) => {
        e.evt.preventDefault();
  
        const oldScale = stage.scaleX(); // Get the current scale
        const pointer = stage.getPointerPosition(); // Get the mouse pointer position
  
        // Calculate the new scale
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
  
        // Adjust the position to zoom towards the mouse pointer
        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };
  
        stage.scale({ x: newScale, y: newScale });
  
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
  
        stage.position(newPos);
        stage.batchDraw();
      });
  }
}