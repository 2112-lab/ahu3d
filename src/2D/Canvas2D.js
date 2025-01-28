import { sharedData } from "../Ahu3D/globals.js"

export default class Canvas2D {
  createCenteredRectWithIndependentLines(x, y, width, height, konvaOptions, options = {}) {
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

  drawToViewport(ahuObject, domID) {
    console.log("drawToViewport ahuObject", domID, ahuObject);
    const container = document.getElementById(domID);

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Create a stage attached to the div
    const stage = new Konva.Stage({
        container: domID, // Attach to this div
        width: containerWidth, // Stage size matches the container
        height: containerHeight,
        draggable: true,
    });

    // Create a layer
    const layer = new Konva.Layer();

    // Add the layer to the stage
    stage.add(layer);

    console.log("drawToViewport step 1");

    for(const ductKey in ahuObject.resources.ducts) {

      console.log("drawToViewport step 2:", ductKey);

      const duct = ahuObject.resources.ducts[ductKey];

      console.log("drawToViewport step 3:", duct);

      let width = duct.dimensions.x;
      let height = duct.dimensions.z;
      let activeWalls = {
        top: true,
        bottom: true,
        left: false,
        right: false,
      }

      console.log("drawToViewport step 4:", width);

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

      console.log("drawToViewport step 5:", width);

      const konvaOptions = {
        stroke: '#fff', // White stroke
        strokeWidth: 30,
      };

      const lines = this.createCenteredRectWithIndependentLines(
          duct.position.x,
          duct.position.z * -1,
          width,
          height,
          konvaOptions,
          activeWalls
      );

      // Add each line separately to the layer
      lines.forEach(line => layer.add(line));

      if(ahuObject.associations.ducts[ductKey].ends[0]) {
        const endKey = ahuObject.associations.ducts[ductKey].ends[0];
        const end = ahuObject.resources.ends[endKey];
        console.log("drawEnd starting:", ahuObject, endKey);
        this.drawEnd(end, endKey, layer, konvaOptions);
      }        
      
    }

    this.fitLayerToRects(layer, containerWidth, containerHeight, 0.90);

    this.setCanvasEvents(stage, layer, container);

    layer.draw(); // Redraw layer to show changes
  }

  drawEnd(end, endKey, layer, konvaOptions) {
    console.log("drawEnd end:", end);

    const factor = 100;

    // const lines = [];
    // lines.push(new Konva.Line({
    //   points: [
    //     end.position.x / 2, end.position.z / 2,    // Top-left
    //     0, 0,   // Top-right
    //   ],
    //   closed: false,
    //   ...konvaOptions
    // }));

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
    let offset = 15;
    const insert = new Konva.Shape({
      x: end.position.x,
      y: end.position.z * -1,
      rotation: end.rotation.y, // Ensure rotation is applied if necessary
      sceneFunc: (context, shape) => {
        context.beginPath();
    
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
    const cap = new Konva.Shape({
      x: end.position.x,
      y: end.position.z * -1,
      rotation: end.rotation.y, // Ensure rotation is applied if necessary
      sceneFunc: (context, shape) => {
        context.beginPath();
    
        // Define your custom shape's path
        context.moveTo((-width / 2), 0); // Top-left corner
        context.lineTo((width / 2), 0);  // Top-right corner
        // context.closePath();
    
        // Fill and/or stroke the shape
        context.fillStrokeShape(shape);
      },
      stroke: 'white', // Optional stroke
      strokeWidth: 30, // Optional stroke width
    });

    return cap;
  }

  setCanvasEvents(stage, layer, container){

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
  
      // Calculate scale to fit the bounding box into the container
      const scaleX = containerWidth / boundingBox.width;
      const scaleY = containerHeight / boundingBox.height;
      let scale = Math.min(scaleX, scaleY); // Uniform scaling
  
      // Apply zoom out factor
      scale *= zoomOutFactor;
  
      // Center the layer content
      const offsetX = (containerWidth - boundingBox.width * scale) / 2;
      const offsetY = (containerHeight - boundingBox.height * scale) / 2;
  
      // Apply scale and position
      layer.scale({ x: scale, y: scale });
      layer.position({
        x: -boundingBox.x * scale + offsetX,
        y: -boundingBox.y * scale + offsetY,
      });
  
      // Redraw the layer to apply changes
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