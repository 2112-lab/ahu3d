import { sharedData } from "../Ahu3D/globals.js"

export default class Canvas2D {
    createCenteredRect(x, y, width, height, options = {}) {
        return new Konva.Rect({
          x: x - width / 2,
          y: y - height / 2,
          width: width,
          height: height,
          ...options
        });
      }
    
    drawToSecondaryViewport(ahuObject){
        console.log("drawToSecondaryViewport ahuObject", ahuObject);
        const container = document.getElementById('secondaryKonvaContainer');
    
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
    
        // Create a stage attached to the div
        const stage = new Konva.Stage({
            container: 'secondaryKonvaContainer', // Attach to this div
            width: containerWidth, // Stage size matches the container
            height: containerHeight,
        });
    
        // Create a layer
        const layer = new Konva.Layer();
    
        // Add the layer to the stage
        stage.add(layer);
    
        for(const ductKey in ahuObject.resources.ducts) {

          const duct = ahuObject.resources.ducts[ductKey];
    
          let width = duct.dimensions.x;
          let height = duct.dimensions.z;
    
          if(duct.rotation.y != 0 && duct.rotation.y != 180) {
            let temp = width;
            width = height;
            height = temp;
          }
    
          const rect = this.createCenteredRect(
            duct.position.x, 
            duct.position.z * -1, 
            width, 
            height, 
            {
              fill: '#fff0',
              stroke: '#fff',
              strokeWidth: 15,
            }
          );
          layer.add(rect);
          
        }
    
        layer.draggable(true);
    
        this.fitLayerToRects(layer, containerWidth, containerHeight, 0.90);
    
        this.setKonvaWheel(stage);
    
        layer.draw(); // Redraw layer to show changes

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

    drawToPrimaryViewport(ahuObject){
        console.log("drawToPrimaryViewport ahuObject", ahuObject);
        const container = document.getElementById('primaryKonvaContainer');
    
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
    
        // Create a stage attached to the div
        const stage = new Konva.Stage({
            container: 'primaryKonvaContainer', // Attach to this div
            width: containerWidth, // Stage size matches the container
            height: containerHeight,
        });
    
        // Create a layer
        const layer = new Konva.Layer();
    
        // Add the layer to the stage
        stage.add(layer);
    
        for(const ductKey in ahuObject.resources.ducts) {

          const duct = ahuObject.resources.ducts[ductKey];
    
          let width = duct.dimensions.x;
          let height = duct.dimensions.z;
    
          if(duct.rotation.y != 0 && duct.rotation.y != 180) {
            let temp = width;
            width = height;
            height = temp;
          }
    
          const rect = this.createCenteredRect(
            duct.position.x, 
            duct.position.z * -1, 
            width, 
            height, 
            {
              fill: '#fff0',
              stroke: '#fff',
              strokeWidth: 15,
            }
          );
          layer.add(rect);
          
        }
    
        layer.draggable(true);
    
        this.fitLayerToRects(layer, containerWidth, containerHeight, 0.90);
    
        this.setKonvaWheel(stage);
    
        layer.draw(); // Redraw layer to show changes

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