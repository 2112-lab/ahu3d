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

    console.log("drawToViewport step 1");

    this.fitLayerToRects(layer, containerWidth, containerHeight, 0.90);

    this.setCanvasEvents(layer, stage, container);

    layer.draw();
  }

  renderAhuToLayer(layer) {
    console.log("renderAhuToLayer step 1");
    for(const ductKey in this.ahuObject.resources.ducts) {
      // console.log("renderAhuToLayer step 2");

      const duct = this.ahuObject.resources.ducts[ductKey];

      let width = duct.dimensions.x + 5;
      let height = duct.dimensions.z;
      let activeWalls = {
        top: true,
        bottom: true,
        left: false,
        right: false,
      }

      // console.log("renderAhuToLayer step 3");

      if(duct.rotation.y != 0 && duct.rotation.y != 180) {
        let temp = width;
        width = height;
        height = temp;
        activeWalls = {
          top: false,
          bottom: false,
          left: true,
          right: true,
        }
      }

      // console.log("renderAhuToLayer step 4");

      const konvaOptions = {
        stroke: 'white', // White stroke
        strokeWidth: 30,
        perfectDrawEnabled: true,
        filters: [Konva.Filters.Blur],
        blurRadius: 15,  // Softens the line edges
        opacity: 0.95,
      };

      const lines = this.createDuct(
          duct.position.x,
          duct.position.z * -1,
          width,
          height,
          konvaOptions,
          activeWalls
      );
      lines.forEach(line => layer.add(line));

      console.log("renderAhuToLayer step 5:", this.ahuObject.associations.ducts[ductKey]);

      if(this.ahuObject.associations.ducts[ductKey].ends) {
        for(const endKey in this.ahuObject.associations.ducts[ductKey].ends) {
          const endKey = this.ahuObject.associations.ducts[ductKey].ends[0];
          const end = this.ahuObject.resources.ends[endKey];
          console.log("renderAhuToLayer drawEnd starting:", this.ahuObject, endKey);
          this.drawEnd(layer, end, endKey, konvaOptions);
        }
        
      }     
      
      console.log("renderAhuToLayer step 6");
      
    }

    for(const jointKey in this.ahuObject.resources.joints) {
      this.create2DJoint(layer, this.ahuObject.resources.joints[jointKey], jointKey);
    }
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

    if(sharedData.xzJointStyle == "orthogonal") {

      let isOutwards = sharedData.xzJointDirection == "outwards";

        if(jointKeys.length == 2) {
          if(joint.up && joint.right) {
            point1 = joint.up.proxy2.position;
            point2 = joint.right.proxy1.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
  
            point1 = joint.right.proxy2.position;
            point2 = joint.up.proxy1.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
          }
          else if(joint.up && joint.down) {
            point1 = joint.up.proxy1.position;
            point2 = joint.down.proxy1.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
  
            point1 = joint.up.proxy2.position;
            point2 = joint.down.proxy2.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
          }
          else if(joint.left && joint.right) {
            point1 = joint.left.proxy1.position;
            point2 = joint.right.proxy1.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
  
            point1 = joint.left.proxy2.position;
            point2 = joint.right.proxy2.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
          }
        }
        else if(jointKeys.length == 3) {
          if(joint.left && joint.up && joint.down) {
            point1 = joint.up.proxy2.position;
            point2 = joint.down.proxy2.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter, true);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
  
            point1 = joint.down.proxy1.position;
            point2 = joint.left.proxy2.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
  
            point1 = joint.left.proxy1.position;
            point2 = joint.up.proxy1.position;
            midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
            this.drawBetweenPoints(layer, point1, point2, midPoint);
          }
        }
        else if(jointKeys.length == 4) {
          point1 = joint.up.proxy2.position;
          point2 = joint.right.proxy1.position;
          midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
          this.drawBetweenPoints(layer, point1, point2, midPoint);
  
          point1 = joint.right.proxy2.position;
          point2 = joint.down.proxy2.position;
          midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
          this.drawBetweenPoints(layer, point1, point2, midPoint);
  
          point1 = joint.down.proxy1.position;
          point2 = joint.left.proxy2.position;
          midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
          this.drawBetweenPoints(layer, point1, point2, midPoint);
  
          point1 = joint.left.proxy1.position;
          point2 = joint.up.proxy1.position;
          midPoint = this.createMidPoint(point1, point2, jointCenter, isOutwards);
          this.drawBetweenPoints(layer, point1, point2, midPoint);
        }      
    }
    
  }

  drawBetweenPoints(layer, point1, point2, midPoint) {

    let xOffset = 0;
    let zOffset = 0;

    // Helper to round point coordinates
    function roundPoint(point) {
      return {
          x: Math.round(point.x),
          z: Math.round(point.z),
      };
    }

    // Round all points
    point1 = roundPoint(point1);
    point2 = roundPoint(point2);
    midPoint = roundPoint(midPoint);

    const points = [
      point1.x + xOffset, (point1.z + zOffset) * -1,
      midPoint.x + xOffset, (midPoint.z + zOffset) * -1,
      point2.x + xOffset, (point2.z + zOffset) * -1
    ];

    const jointLine = new Konva.Line({
        points: points,
        stroke: 'white',
        lineCap: 'round',
        lineJoin: 'round',
        strokeWidth: 30,
        perfectDrawEnabled: true,
        filters: [Konva.Filters.Blur],
        blurRadius: 15,
    });

    layer.add(jointLine);
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

  renderPoint(point) {
    const circle = new Konva.Circle({
      x: point.x,
      y: point.z * -1,
      radius: 50,
      stroke: '#00ff00',
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
    
        // Define your custom shape's path
        context.moveTo(
          (-width / 2), 
          0 + offset
        ); // Top-left corner

        context.lineTo(
          ((-width / 2) - 120), 
          (height * -1) + offset
        );  // Top-right corner

        context.moveTo(
          (width / 2), 
          (0) + offset
        );
        context.lineTo(
          ((width / 2) + 120), 
          (height * -1) + offset
        );

        // context.closePath();
    
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
      this.fitLayerToRects(layer, newWidth, newHeight, 0.90);
  
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
    
  fitLayerToRects(layer, containerWidth, containerHeight, zoomOutFactor = 0.90) {
      // Get the bounding box of all rectangles
      const shapes = layer.getChildren();
      const boundingBox = shapes.reduce(
        (box, shape) => {
          const rect = shape.getClientRect();
          return {
            x: Math.min(box.x, rect.x),
            y: Math.min(box.y, rect.y),
            width: Math.max(box.width, rect.x + rect.width - box.x),
            height: Math.max(box.height, rect.y + rect.height - box.y),
          };
        },
        { x: Infinity, y: Infinity, width: 0, height: 0 }
      );
  
      const scaleX = containerWidth / boundingBox.width;
      const scaleY = containerHeight / boundingBox.height;
      let scale = Math.min(scaleX, scaleY);
  
      scale *= zoomOutFactor;
  
      const offsetX = (containerWidth - boundingBox.width * scale) / 2;
      const offsetY = (containerHeight - boundingBox.height * scale) / 2;
  
      layer.scale({ x: scale, y: scale });
      layer.position({
        x: -boundingBox.x * scale + offsetX,
        y: -boundingBox.y * scale + offsetY,
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