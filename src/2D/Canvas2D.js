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
    
    drawToSecondaryViewport(assembly){
        console.log("drawToSecondaryViewport assembly", assembly);
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
    
        for(const index of assembly) {
    
          const sizes = {
            small: 500,
            medium: 1000,
            large: 1500
          }
    
          let width = sizes[index.xetoDuct.graphicLocation.size] * index.segment.duct.userData.component.object.scale.x;
          let height = sizes[index.xetoDuct.graphicLocation.size];
    
          if(index.segment.duct.userData.component.object.rotation.y != 0) {
            let temp = width;
            width = height;
            height = temp;
          }
    
          const rect = this.createCenteredRect(
            index.segment.duct.userData.component.object.position.x, 
            index.segment.duct.userData.component.object.position.z * -1, 
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
    }
    
    drawToPrimaryViewport(assembly){
        console.log("drawToPrimaryViewport assembly", assembly);
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
    
        for(const index of assembly) {
    
          const sizes = {
            small: 500,
            medium: 1000,
            large: 1500
          }
    
          let width = sizes[index.xetoDuct.graphicLocation.size] * index.segment.duct.userData.component.object.scale.x;
          let height = sizes[index.xetoDuct.graphicLocation.size];
    
          if(index.segment.duct.userData.component.object.rotation.y != 0) {
            let temp = width;
            width = height;
            height = temp;
          }
    
          const rect = this.createCenteredRect(
            index.segment.duct.userData.component.object.position.x, 
            index.segment.duct.userData.component.object.position.z * -1, 
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