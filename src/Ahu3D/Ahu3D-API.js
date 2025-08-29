//////////////////////////////////////////////////////////////////////////////////////
//
//	AHU3D - A Javascript Module for Parametric Design Tool for Air Handling Units.
//
//
//	    LIMITED TEMPORARY LICENSE FOR DEMO PURPOSES ONLY - EXPIRES 2025/01/01
//
//
//		   NOT AUTHORIZED FOR PRODUCTION DEPLOYENT OR REDISTRIBUTION.
//
//
//				PROPERTY OF COGNITIVE DYNAMICS LTD.
//
//
//				    ALL RIGHTS RESERVED - 2024.
//
//////////////////////////////////////////////////////////////////////////////////////

/**
 * @fileoverview AHU3D API module provides the main interface for the Air Handling Unit
 * 3D visualization system. It handles component library loading, scene management,
 * and interactive features like component manipulation and visual effects.
 * 
 * @module Ahu3D-API
 * @requires three
 * @requires three/examples/jsm/postprocessing/OutlinePass
 * @requires axios
 * @requires ../Preprocess/_Preprocess
 * @requires ../3D/Assets3D
 * @requires ../3D/Mesh3D
 * @requires ./FlowControl
 * @requires ./globals
 * @requires ../assets/2D-Wildcard.svg
 * 
 * @author Caleb Ebers
 * @copyright Cognitive Dynamics Ltd. 2024
 * @license Limited Temporary Demo License - Expires 2025/01/01
 */

import * as THREE from "three";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import axios from "axios";
import Preprocess from "../Preprocess/_Preprocess.js";
import Assets3D from "../3D/Assets3D.js";

import FlowControl from "./FlowControl.js";
import { sharedData } from "./globals.js";
import wildcardSvg from "../assets/2D-Wildcard.svg";
import { Context } from "svgcanvas";
import jsPDF from "jspdf";
import "svg2pdf.js";
import { CableSystem } from "./CableSystem.js";
import Panel from "../Wiring3D/Panel.js";

class Ahu3DAPI extends CableSystem {
    /**
     * Creates an instance of the AHU3D API.
     * Initializes core components and state management.
     * 
     * @param {Object} ahu3DInstance - Instance of the main AHU3D application
     */
    constructor(ahu3DInstance) {
        super();
        // Store reference to main AHU3D instance
        this.ahu3D = ahu3DInstance;     
        // Track library loading state
        this.libraryLoadInitiated = false;
        
        // Initialize flow control system (sceneHelper will be set later)
        this.FlowControl = new FlowControl();

        this.panel = null;

        this.cableSystem = new CableSystem();

        this.ahuObject = {};

        this.wiringDiagram = null;
    }

    /**
     * Update or create the components structure in the wiringData
     * @param {Object} wiringData - The wiring data to update
     * @return {Object} Updated wiring data with components structure
     */
    updateComponentsInWiringData(wiringData) {
      if (!wiringData) {
        wiringData = { cables: [] };
      }
      
      if (!wiringData.components) {
        wiringData.components = {
          all: [],
          connected: [],
          unconnected: []
        };
      }
      
      // Get all component IDs from the AHU object if available
      const allComponents = [];
      if (this.ahuObject && this.ahuObject.resources && this.ahuObject.resources.components) {
        Object.keys(this.ahuObject.resources.components).forEach(componentId => {
          allComponents.push(componentId);
        });
      }
      
      // Ensure components from cables are included in the all list
      const connectedComponents = [];
      wiringData.cables.forEach(cable => {
        if (cable.idTag && !connectedComponents.includes(cable.idTag)) {
          connectedComponents.push(cable.idTag);
          if (!allComponents.includes(cable.idTag)) {
            allComponents.push(cable.idTag);
          }
        }
      });
      
      // Calculate unconnected components
      const unconnectedComponents = allComponents.filter(componentId => 
        !connectedComponents.includes(componentId)
      );
      
      // Update the components in the wiring data
      wiringData.components = {
        all: allComponents,
        connected: connectedComponents,
        unconnected: unconnectedComponents
      };

      console.log("updateComponentsInWiringData wiringData:", wiringData);
      
      return wiringData;
    }

    /**
     * Sets the components structure in wiring data based on AHU object
     * @param {Object} wiringData - The wiring data to update with component structure
     */
    setWiringDataComponents(wiringData) {
        const componentKeys = Object.keys(this.ahuObject.resources.components); 
        
        let wiringDataComponents = {
          all: componentKeys,
          connected: [],
          unconnected: []
        }

        // Extract idTag values from cables and populate the connected array
        for(const cable of wiringData.cables) {
          // Make sure we're using the right property and that it exists
          if (cable.idTag) {
            // Extract the component ID part from the full idTag
            const componentId = cable.idTag;
            if (componentId && !wiringDataComponents.connected.includes(componentId)) {
              wiringDataComponents.connected.push(componentId);
            }
          }
        }
        
        // Explicitly calculate unconnected as components in 'all' that aren't in 'connected'
        wiringDataComponents.unconnected = wiringDataComponents.all.filter(component => {
          return !wiringDataComponents.connected.includes(component);
        });

        // Update wiringData with the new components structure
        wiringData = {
          ...wiringData,
          components: wiringDataComponents,
        };

        console.log("setWiringDataComponents wiringData.components:", wiringData.components);
    }

    /**
     * Initialize the panel component with wiring data
     * @param {HTMLElement} container - DOM element to render the panel into
     * @return {Panel} The initialized panel instance
     */
    initializePanel(container) {
        this.panel = new Panel(container, this.getWiringDataObject());
        return this.panel;
    }

    /**
     * Update the panel with current wiring data
     */
    updatePanel() {
        if (this.panel) {
            this.panel.updateWiringData(this.getWiringDataObject());
        }
    }

    /**
     * Override parent methods to add panel updates
     */
    
    /**
     * Creates a cable and updates the panel
     * @param {Object} cableConfig - Configuration for the new cable
     * @return {Object} The created cable object
     */
    createCable(cableConfig) {
        const cable = super.createCable(cableConfig);
        this.updatePanel();
        return cable;
    }
    
    /**
     * Removes a cable and updates the panel
     * @param {string} cableId - ID of the cable to remove
     * @return {boolean} Success status of the removal
     */
    removeCable(cableId) {
        const result = super.removeCable(cableId);
        this.updatePanel();
        return result;
    }
    
    /**
     * Adds a wire to a cable and updates the panel
     * @param {string} cableId - ID of the cable to add wire to
     * @param {Object} wireConfig - Configuration for the new wire
     * @return {Object} The created wire object
     */
    addWireToCable(cableId, wireConfig) {
        const wire = super.addWireToCable(cableId, wireConfig);
        this.updatePanel();
        return wire;
    }
    
    /**
     * Removes a wire from a cable and updates the panel
     * @param {string} cableId - ID of the cable to remove wire from
     * @param {string} wireId - ID of the wire to remove
     * @return {boolean} Success status of the removal
     */
    removeWireFromCable(cableId, wireId) {
        const result = super.removeWireFromCable(cableId, wireId);
        this.updatePanel();
        return result;
    }
    
    /**
     * Updates cable properties and updates the panel
     * @param {string} cableId - ID of the cable to update
     * @param {Object} updates - Properties to update on the cable
     * @return {Object} The updated cable object
     */
    updateCable(cableId, updates) {
        const cable = super.updateCable(cableId, updates);
        this.updatePanel();
        return cable;
    }
    
    /**
     * Updates wire properties and updates the panel
     * @param {string} cableId - ID of the cable containing the wire
     * @param {string} wireId - ID of the wire to update
     * @param {Object} updates - Properties to update on the wire
     * @return {Object} The updated wire object
     */
    updateWire(cableId, wireId, updates) {
        const wire = super.updateWire(cableId, wireId, updates);
        this.updatePanel();
        return wire;
    }
    
    /**
     * Loads wiring data and updates the panel
     * @param {Object} wiringData - The wiring data to load
     * @return {boolean} Success status of the load operation
     */
    loadWiringData(wiringData) {
        const result = super.loadWiringData(wiringData);
        this.updatePanel();
        return result;
    }

    /**
     * Handle updating the 3D visualization when cables change
     * @param {string} cableId - ID of the changed cable
     */
    updateCableVisualization(cableId) {
        const cable = this.getCable(cableId);
        if (!cable) return;
        
        // This method integrates with the 3D rendering system
        if (this.ahu3D && this.ahu3D.updateCableRendering) {
            this.ahu3D.updateCableRendering(cable);
        }
    }
    
    /**
     * Render cables in 3D space
     * This method would be implemented based on your specific 3D environment
     */
    renderCablesIn3D() {
        const allCables = this.getAllCables();
        
        // This is just a placeholder for your 3D rendering logic
        if (this.ahu3D && this.ahu3D.renderCables) {
            this.ahu3D.renderCables(allCables);
        }
    }
    
    /**
     * Export cable data as PDF
     * @param {string} filename - Output filename
     * @return {Promise<boolean>} Success status
     */
    async exportCableDataAsPDF(filename = 'cable-system.pdf') {
        try {
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(16);
            doc.text('Cable System Report', 20, 20);
            
            // Add generation date
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
            
            // Add cable info
            doc.setFontSize(12);
            doc.text('Cable Inventory:', 20, 40);
            
            let yPos = 50;
            this.getAllCables().forEach((cable, index) => {
                // Check if we need a new page
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFontSize(11);
                doc.text(`${index + 1}. ${cable.id} - ${cable.label || 'Unlabeled Cable'}`, 20, yPos);
                yPos += 7;
                
                doc.setFontSize(9);
                doc.text(`Equipment: ${cable.equipment || 'N/A'}`, 25, yPos);
                yPos += 5;
                
                doc.text(`Component: ${cable.idTag || 'N/A'}`, 25, yPos);
                yPos += 5;
                
                doc.text(`Wires: ${cable.wires.length}`, 25, yPos);
                yPos += 5;
                
                cable.wires.forEach(wire => {
                    doc.text(`- ${wire.id}: ${wire.color || 'N/A'} (${wire.panelWiringId || 'No panel'})`, 30, yPos);
                    yPos += 5;
                });
                
                yPos += 5;
            });
            
            // Add report summary
            const report = this.generateCableReport();
            
            // Add a new page for the report
            doc.addPage();
            doc.setFontSize(14);
            doc.text('System Summary', 20, 20);
            
            doc.setFontSize(10);
            doc.text(`Total Cables: ${report.totalCables}`, 20, 30);
            
            // Equipment types
            let eqYPos = 40;
            doc.text('Equipment Types:', 20, eqYPos);
            eqYPos += 5;
            
            Object.entries(report.equipmentTypes).forEach(([type, count]) => {
                doc.text(`- ${type}: ${count}`, 25, eqYPos);
                eqYPos += 5;
            });
            
            // Save the document
            doc.save(filename);
            return true;
        } catch (error) {
            console.error('Failed to export PDF', error);
            return false;
        }
    }

    /**
     * Initializes the wiring panel with AHU object and wiring data
     * @param {Object} ahuObject - The AHU object containing component data
     * @param {Object} wiringData - The wiring data for the panel
     */
    initWiringPanel(ahuObject, wiringData) {
        const rowNum = 2;
        const labelOrientation = "vertical";

        this.panel = new Panel(
            rowNum, 
            labelOrientation, 
            ahuObject, 
            wiringData,
            this.sceneHelper  // Pass the instance sceneHelper
        );

        this.panel.initPanelPipe();
    }

    /**
     * Sets 3D wiring data for the panel
     * @param {Object} ahuObject - The AHU object containing component data
     * @param {Object} wiringData - The wiring data to set
     */
    set3dWiringData(ahuObject, wiringData) {
        // this.sceneHelper.clear3dWiring();
        this.panel.set3dWiringData(ahuObject, wiringData);
    }

    /**
     * Creates a dictionary of duct connections based on shared locations
     * @param {Object} inputDict - Dictionary of duct objects with location data
     * @return {Object} Dictionary mapping duct IDs to their connected ducts
     */
    createDuctConnectionsDict(inputDict) {
        const result = {};
        const locationMap = {}; // Maps locations (like "B2") to ducts that connect there
        
        // First pass: Extract duct IDs and create location mapping
        Object.keys(inputDict).forEach(fullDuctId => {
          // Extract just the duct name (e.g., "Duct-0" from "r:novo.graphics::Duct-0")
          const ductId = fullDuctId.split("::")[1];
          
          // Initialize the duct in the result dictionary
          result[ductId] = {
            connections: []
          };
          
          // Map the start and end locations to this duct
          const location = inputDict[fullDuctId].graphicLocation;
          
          // Add duct to the start location map
          if (!locationMap[location.start]) {
            locationMap[location.start] = [];
          }
          locationMap[location.start].push(ductId);
          
          // Add duct to the end location map
          if (!locationMap[location.end]) {
            locationMap[location.end] = [];
          }
          locationMap[location.end].push(ductId);
        });
        
        // Second pass: Determine connections based on shared locations
        Object.keys(locationMap).forEach(location => {
          const ductsAtLocation = locationMap[location];
          
          // If more than one duct shares a location, they're connected
          if (ductsAtLocation.length > 1) {
            // For each duct at this location
            ductsAtLocation.forEach(ductId => {
              // Add all other ducts at this location as connections
              ductsAtLocation.forEach(connectedDuct => {
                if (ductId !== connectedDuct && 
                    !result[ductId].connections.includes(connectedDuct)) {
                  result[ductId].connections.push(connectedDuct);
                }
              });
            });
          }
        });
        
        return result;
    }

    /**
     * Inserts a component into a XETO configuration at a specified edge and position
     * @param {Array} xeto - The XETO configuration array
     * @param {string} selectedLibraryItem - Name of the component to insert
     * @param {string} selectedEdge - ID of the edge to insert the component into
     * @param {number|null} [insertIndex=null] - Position to insert at, null for end
     * @return {Array} Updated XETO configuration with the new component
     */
    insertComponent(xeto, selectedLibraryItem, selectedEdge, insertIndex = null) {
        let group = xeto.filter(child => child.spec.includes('Group'));
        let edgesList = xeto.filter(child => child.spec.includes('Edge'));
        let componentsList = xeto.filter(child => child.spec.includes('Component'));
    
        // Generate a unique component ID
        let i = 0;
        let componentId = `${selectedLibraryItem}-${i}`;
    
        while(xeto.filter(child => child.id.includes(componentId)).length != 0) {
            i++;
            componentId = `${selectedLibraryItem}-${i}`;
        }
    
        // Create the component block
        let componentBlock = {
            "id": `r:novo.graphics::${componentId}`,
            "spec": "r:novo.graphics::Component",
            "componentId": `r:novo.graphics::${selectedLibraryItem}`,
            "blockStyle": {
                "componentPadding": {
                    "startSpace": 250,
                    "endSpace": 250
                }
            }
        };
    
        // Find the edge to insert into
        let edge = edgesList.filter(child => child.id.includes(selectedEdge))[0];
        
        // Handle insertion at a specific index
        if (insertIndex !== null) {            

            // Make a copy of the components array
            const components = [...edge.components];
            
            // const arrayLength = components.length;
            // insertIndex = Math.max(0, arrayLength - insertIndex);
            
            // Ensure the index is within bounds
            if (insertIndex < 0) {
                // If negative, insert at the beginning
                insertIndex = 0;
            } else if (insertIndex > components.length) {
                // If too large, insert at the end
                insertIndex = components.length;
            }
            
            // Insert the component at the specified index
            components.splice(insertIndex, 0, `r:novo.graphics::${componentId}`);
            edge.components = components;
        } else {
            // Default behavior: append to the end
            edge.components.push(`r:novo.graphics::${componentId}`);
        }
    
        // Construct the new xeto object
        let newXeto = [
            ...group,
            ...edgesList,
            ...componentsList,
            componentBlock
        ];
    
        console.log("insertComponent componentBlock:", componentBlock);
        console.log("insertComponent edge after:", newXeto);
    
        return newXeto;
    }

    /**
     * Deletes a component from a XETO configuration
     * @param {Array} xeto - The XETO configuration array
     * @param {string} selectedComponent - ID of the component to delete
     * @return {Array} Updated XETO configuration with the component removed
     */
    deleteComponent(xeto, selectedComponent) {
        let group = xeto.filter(child => child.spec.includes('Group'));
        let edgesList = xeto.filter(child => child.spec.includes('Edge'));
        let componentsList = xeto.filter(child => child.spec.includes('Component'));

        console.log("deleteComponent edgesList:", edgesList);   
        
        for(const i in edgesList) {
            if(edgesList[i].components.length === 0) {
                alert("Xeto with an edge having 0 components is disallowed.");
                return xeto;
            }
        }

        for(const i in edgesList) {
            let newEdgeComponents = [];
            for(const j in edgesList[i].components) {
                if(!edgesList[i].components[j].includes(selectedComponent)) {
                    newEdgeComponents.push(edgesList[i].components[j]);
                }
            }

            edgesList[i].components = newEdgeComponents;
        }
        
        let newComponentsList = [];
        for(const i in componentsList) {
          if(!componentsList[i].id.includes(selectedComponent)) {
            newComponentsList.push(componentsList[i]);
          }
        }        
        
        console.log("deleteComponent componentsList:", newComponentsList);
        console.log("deleteComponent edgesList:", edgesList);

        let newXeto = [
          ...group,
          ...edgesList,
          ...newComponentsList
        ];

        console.log("deleteComponent newXeto:", newXeto);

        return newXeto;
    }

    /**
     * Shifts a component's position within its edge in a XETO configuration
     * @param {Array} xetoData - The XETO configuration array
     * @param {string} componentId - ID of the component to shift
     * @param {number} shiftOffset - Number of positions to shift (negative for left, positive for right)
     * @param {boolean} shiftWrap - Whether to wrap around edges when shifting
     */
    shiftComponent(xetoData, componentId, shiftOffset, shiftWrap) {
        // Get shift parameters (could be added to your UI)
        const offset = shiftOffset * -1 || -1; // Default to 1 if not set
        const wrap = shiftWrap !== false; // Default to true if not set

        function getEdgeContainingComponent(xetoData, componentId) {
            for (const item of xetoData) {
              if (item.spec && item.spec.includes('Edge') && item.components) {
                if (item.components.some(comp => comp.includes(componentId))) {
                  return item;
                }
              }
            }
            return null;
        }
        
        // Find which edge contains this component
        const edge = getEdgeContainingComponent(xetoData, componentId);
        
        if (!edge) {
          console.error(`shiftComponent No edge contains component ${componentId}`);
          return;
        }
        
        // Find the index of the component in the edge
        const index = edge.components.findIndex(comp => comp.includes(componentId));
        
        if (index === -1) {
          console.error(`shiftComponent Component ${componentId} not found in edge`);
          return;
        }
        
        // Create a copy of the components array
        const components = [...edge.components];
        
        // Get the component to shift
        const component = components[index];
        
        // Remove the component from its original position
        components.splice(index, 1);
        
        // Calculate the new position
        let newIndex;
        
        if (wrap) {
          // With wrapping - modulo arithmetic handles wrapping automatically
          newIndex = (index + offset) % (components.length + 1);
          // Handle negative wrapping
          if (newIndex < 0) {
            newIndex += (components.length + 1);
          }
        } else {
          // Without wrapping - clamp to array boundaries
          newIndex = Math.min(Math.max(index + offset, 0), components.length);
        }
        
        // Insert the component at the new position
        components.splice(newIndex, 0, component);
        
        // Update the edge's components
        edge.components = components;

        console.log(`shiftComponent Shifted component ${componentId} from position ${index} to ${newIndex}`);
    }

    /**
     * Converts a Konva Layer to an embedded SVG with customizable options
     * @param {Konva.Layer} layer - The Konva Layer to export
     * @param {Object} params - Export parameters including colors, filename, and scale
     * @param {string} [params.fileName="blueprint-export"] - Output filename
     * @param {string} [params.fileType="svg"] - Output file type
     * @param {string} [params.strokeColor="#000000"] - Stroke color for export
     * @param {string} [params.textColor="#000000"] - Text color for export
     * @param {string} [params.backgroundColor="#ffffff"] - Background color for export
     * @param {number} [params.scale=1] - Scale factor for export
     * @return {Promise<Blob>} Promise resolving to SVG data as blob
     */
    async exportBlueprintAsVector(layer, params) {
        return new Promise(async (resolve) => {
            if (!layer) {
                console.error("No layer provided.");
                return resolve(null);
            }     
            
            const imageParams = {
                fileName: params.fileName || "blueprint-export",
                fileType: params.fileType || "svg",
                strokeColor: params.strokeColor || "#000000",
                textColor: params.textColor || "#000000",
                backgroundColor: params.backgroundColor || "#ffffff",
                scale: params.scale || 1
            }

            const allText = layer.find("Text");
            const allRects = layer.find("Rect");
            const allPaths = layer.getChildren(node => node.getClassName() !== 'Text' && node.getClassName() !== 'Rect');

            let oldTextFill = allText[0].fill();
            let oldRectStroke = allRects[0].stroke();
            let oldRectFill = allRects[0].fill();
            let oldPathStroke = allPaths[0].stroke();

            for (const text of allText) {
                text.fill(imageParams.textColor);
            }
            for (const rect of allRects) {
                rect.stroke(imageParams.strokeColor);
                rect.fill(imageParams.backgroundColor);
            }
            for (const path of allPaths) {
                path.stroke(imageParams.strokeColor);
            }

            // Get the existing 2D rendering context
            const oldContext = layer.canvas.context._context;

            // Store original positions and dimensions
            const originalPosition = {
                x: layer.x(),
                y: layer.y()
            };
            const originalWidth = layer.width();
            const originalHeight = layer.height();
            const scaledWidth = originalWidth * imageParams.scale;
            const scaledHeight = originalHeight * imageParams.scale;

            // Create an SVG rendering context with scaled dimensions
            const c2s = layer.canvas.context._context = new Context({
                height: scaledHeight,
                width: scaledWidth,
                ctx: oldContext
            });

            // Store original layer scaling
            const originalScale = {
                x: layer.scaleX(),
                y: layer.scaleY()
            };

            // Apply scale to the layer
            layer.scale({
                x: imageParams.scale * originalScale.x,
                y: imageParams.scale * originalScale.y
            });
            
            // Calculate position adjustment to center the content
            // For scaling > 1, we need to move the layer inward to show more content
            // For scaling < 1, we need to move the layer outward to center the smaller content
            const positionAdjustX = Math.max(imageParams.scale - 1, 0) * 50;
            const positionAdjustY = Math.max(imageParams.scale - 1, 0) * 50;
            
            // Apply position adjustment
            layer.position({
                x: originalPosition.x + positionAdjustX,
                y: originalPosition.y + positionAdjustY
            });

            // Draw the layer
            layer.draw();

            // Get the SVG data
            let svgData = c2s.getSerializedSvg();

            console.log("exportBlueprintAsVector fileType:", imageParams.fileType);

            svgData = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

            // Restore original styles
            for (const text of allText) {
                text.fill(oldTextFill);
            }
            for (const rect of allRects) {
                rect.stroke(oldRectStroke);
                rect.fill(oldRectFill);
            }
            for (const path of allPaths) {
                path.stroke(oldPathStroke);
            }

            // Restore original scaling
            layer.scale({
                x: originalScale.x,
                y: originalScale.y
            });
            
            // Restore original position
            layer.position(originalPosition);

            // Restore original context
            layer.canvas.context._context = oldContext;
            layer.draw();

            resolve(svgData);
        });
    }

    /**
     * Exports the current wiring diagram as a vector graphic
     * @param {Function|null} [callback=null] - Optional callback function to receive the exported blob
     * @param {Object} params - Export parameters
     * @param {string} [params.fileName="wiring-export"] - Output filename
     * @param {string} [params.fileType="svg"] - Output file type
     * @param {string} [params.strokeColor="#000000"] - Stroke color for export
     * @param {string} [params.textColor="#000000"] - Text color for export
     * @param {string} [params.backgroundColor="#ffffff"] - Background color for export
     * @param {number} [params.scale=1] - Scale factor for export
     */
    exportWiringDiagram(callback = null, params) {
        const imageParams = {
            fileName: params?.fileName || "wiring-export",
            fileType: params?.fileType || "svg",
            strokeColor: params?.strokeColor || "#000000",
            textColor: params?.textColor || "#000000",
            backgroundColor: params?.backgroundColor || "#ffffff",
            scale: params?.scale || 1
        }


        // Call exportWiringLayerAsVector with a promise
        this.exportWiringLayerAsVector(this.wiringDiagram, imageParams)
            .then(svgData => {
                // If svgData is already a blob, use it
                const blob = (svgData instanceof Blob) ? 
                    svgData : 
                    new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    
                // If a callback was provided, pass the blob to it
                if (typeof callback === 'function') {
                    callback(blob);
                }
                
                return blob;
            })
            .catch(err => {
                console.error("Error exporting wiring diagram:", err);
                if (typeof callback === 'function') {
                    callback(null);
                }
            });
    }

    /**
     * Exports a Konva layer as a vector graphic with specified styling parameters
     * @param {Konva.Layer} layer - The Konva layer to export
     * @param {Object} imageParams - Export parameters including styling and scale options
     * @param {string} imageParams.textColor - Color for text elements
     * @param {string} imageParams.strokeColor - Color for stroke elements
     * @param {string} imageParams.backgroundColor - Background color
     * @param {number} imageParams.scale - Scale factor for export
     * @return {Promise<Blob>} Promise resolving to SVG data as blob
     */
    async exportWiringLayerAsVector(layer, imageParams) {
        return new Promise(async (resolve) => {
          if (!layer) {
            console.error("No layer provided.");
            return resolve(null);
          }            
  
          // Apply scale parameter (default to 1 if not provided)
          const scale = imageParams.scale || 1;
  
          // Store original styles for later restoration
          const allText = layer.find("Text");
          const allRects = layer.find("Rect");
          const allLines = layer.find("Line");
          const allShapes = layer.getChildren(node => 
            node.getClassName() !== 'Text' && 
            node.getClassName() !== 'Rect' && 
            node.getClassName() !== 'Line'
          );
  
          const originalStyles = {};
          if (allText.length > 0) originalStyles.textFill = allText[0].fill();
          if (allRects.length > 0) {
            originalStyles.rectStroke = allRects[0].stroke();
            originalStyles.rectFill = allRects[0].fill();
          }
  
          // Apply export styles
          for (const text of allText) {
            text.fill(imageParams.textColor);
          }
          for (const rect of allRects) {
            rect.stroke(imageParams.strokeColor);
            rect.fill(imageParams.backgroundColor);
          }
  
          // Get the existing 2D rendering context
          const oldContext = layer.canvas.context._context;
  
          // Calculate the actual bounds of all elements
          const bounds = this.calculateLayerBounds(layer);
          
          // Store original layer scaling
          const originalScale = {
            x: layer.scaleX(),
            y: layer.scaleY()
          };
  
          // Apply the scaling factor
          layer.scale({
            x: originalScale.x * scale,
            y: originalScale.y * scale
          });
          
          // Create an SVG rendering context with scaled dimensions
          const c2s = layer.canvas.context._context = new Context({
            width: bounds.width * scale,
            height: bounds.height * scale,
            ctx: oldContext
          });
  
          // Store original position
          const originalLayerPosition = {
            x: layer.x(),
            y: layer.y()
          };
          
          // Adjust position to account for the scaling
          layer.x(-bounds.x * scale);
          layer.y(-bounds.y * scale);
  
          // Draw the layer
          layer.draw();
  
          // Get the SVG data
          let svgData = c2s.getSerializedSvg();
  
          // Add a background rectangle to match the specified background color
          const backgroundRect = `<rect x="0" y="0" width="${bounds.width * scale}" height="${bounds.height * scale}" fill="${imageParams.backgroundColor}" />`;
          svgData = svgData.replace('<rect fill="#FFFFFF" stroke="none" x="0" y="0" width="600" height="400" transform="matrix(1 0 0 1 0 0)"/>', backgroundRect);
  
          svgData = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });  
  
          // Restore original styles
          for (const text of allText) {
            text.fill(originalStyles.textFill);
          }
          for (const rect of allRects) {
            rect.stroke(originalStyles.rectStroke);
            rect.fill(originalStyles.rectFill);
          }
          
          // Restore original shape styles
          for (const shape of allShapes) {
            if (originalStyles.pathStroke) {
              shape.stroke(originalStyles.pathStroke);
            }
          }
  
          // Restore original scale
          layer.scale(originalScale);
          
          // Restore original layer position
          layer.x(originalLayerPosition.x);
          layer.y(originalLayerPosition.y);
  
          // Restore original context
          layer.canvas.context._context = oldContext;
          layer.draw();
  
          resolve(svgData);
        });
    }

    /**
     * Calculates the bounding box of all elements in a Konva layer
     * @param {Konva.Layer} layer - The Konva layer to calculate bounds for
     * @return {Object} Bounds object with x, y, width, and height properties
     */
    calculateLayerBounds(layer) {
        // Initialize bounds to the initial layer size
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
  
        // Get all shapes in the layer
        const shapes = layer.getChildren();
  
        shapes.forEach(shape => {
          // Get the absolute position
          const absPos = shape.getAbsolutePosition();
          
          // For simple shapes
          if (shape.className !== 'Group') {
            // Calculate width and height based on shape properties
            let width = 0;
            let height = 0;
            
            if (shape.width && shape.height) {
              width = shape.width() * shape.scaleX();
              height = shape.height() * shape.scaleY();
            } else if (shape.radius) {
              // For circles and similar shapes
              const radius = shape.radius() * Math.max(shape.scaleX(), shape.scaleY());
              width = height = radius * 2;
            }
            
            // Update bounds
            minX = Math.min(minX, absPos.x);
            minY = Math.min(minY, absPos.y);
            maxX = Math.max(maxX, absPos.x + width);
            maxY = Math.max(maxY, absPos.y + height);
          } else {
            // For groups, recurse into their children
            const groupChildren = shape.getChildren();
            groupChildren.forEach(child => {
              const childPos = child.getAbsolutePosition();
              let childWidth = 0;
              let childHeight = 0;
              
              if (child.width && child.height) {
                childWidth = child.width() * child.scaleX();
                childHeight = child.height() * child.scaleY();
              } else if (child.radius) {
                const radius = child.radius() * Math.max(child.scaleX(), child.scaleY());
                childWidth = childHeight = radius * 2;
              }
              
              minX = Math.min(minX, childPos.x);
              minY = Math.min(minY, childPos.y);
              maxX = Math.max(maxX, childPos.x + childWidth);
              maxY = Math.max(maxY, childPos.y + childHeight);
            });
          }
        });
  
        // Add padding
        const padding = 20;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
  
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
    }

    /**
     * Exports a Konva layer as a raster image (PNG) with specified styling
     * @param {Konva.Layer} layer - The Konva layer to export
     * @param {Object} imageParams - Export parameters including styling options
     * @param {string} imageParams.fileName - Output filename
     * @param {string} imageParams.textColor - Color for text elements
     * @param {string} imageParams.strokeColor - Color for stroke elements  
     * @param {string} imageParams.backgroundColor - Background color
     */
    exportBlueprintAsRaster(layer, imageParams) {
        console.log("exportLayerAsSVGRaster started:", layer);

        const allText = layer.find("Text");
        const allRects = layer.find("Rect");
        const allPaths = layer.getChildren(node => node.getClassName() !== 'Text' && node.getClassName() !== 'Rect');

        let oldTextFill = allText[0].fill();
        let oldRectStroke = allRects[0].stroke();
        let oldRectFill = allRects[0].fill();
        let oldPathStroke = allPaths[0].stroke();

        for (const text of allText) {
            text.fill(imageParams.textColor);
        }
        for (const rect of allRects) {
            rect.stroke(imageParams.strokeColor);
            rect.fill(imageParams.backgroundColor);
        }
        for (const path of allPaths) {
            path.stroke(imageParams.strokeColor);
        }

        const pngDataUrl = layer.toDataURL({x:0, y:0});

        console.log("exportLayerAsSVGRaster pngDataUrl:", pngDataUrl);

        for (const text of allText) {
            text.fill(oldTextFill);
        }
        for (const rect of allRects) {
            rect.stroke(oldRectStroke);
            rect.fill(oldRectFill);
        }
        for (const path of allPaths) {
            path.stroke(oldPathStroke);
        }

        const a = document.createElement('a');
        a.href = pngDataUrl;
        a.download = imageParams.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngDataUrl);  // Cleanup
    }

    /**
     * Loads and initializes the component library from specified configurations.
     * Fetches JSON and SVG assets for each component and prepares them for use.
     * 
     * @param {Object} assetConfigs - Configuration object containing paths and component list
     * @param {string[]} assetConfigs.componentList - List of component names to load
     * @param {string} assetConfigs.assetsPath - Base path to component assets
     * @returns {Object} Loaded component library
     */
    async loadLibrary(assetConfigs) {
        // Mark library load as initiated
        this.libraryLoadInitiated = true;
    
        // Initialize storage for loaded files
        const files = {};
        const jsonFiles = assetConfigs.componentList;
        const assetsPath = assetConfigs.assetsPath;
    
        // Create promises for loading each component's assets
        const requests = jsonFiles.map(async (fileName) => {
            const jsonPath = `${assetsPath}${fileName}/${fileName}.json`;
    
            try {
                // Load and store component's JSON data
                const jsonResponse = await axios.get(jsonPath);
                files[fileName] = jsonResponse.data;

                const svgKey = files[fileName].files.svg;
                const svgPath = `${assetsPath}${fileName}/${svgKey}`;

                // Handle SVG loading for the component
                if(svgKey != null) {
                    // Attempt to load component-specific SVG
                    const svgResponse = await fetch(svgPath);
                    if (svgResponse.ok) {
                        files[fileName].svg = await svgResponse.text();
                    } 
                    else {
                        // Fall back to wildcard SVG if component SVG fails to load
                        console.error(`Failed to load ${fileName}.svg`);
                        files[fileName].svg = wildcardSvg;
                    }
                }
                else {
                    // Use wildcard SVG if no component SVG specified
                    files[fileName].svg = wildcardSvg;
                }
            } catch (error) {
                console.error(`Failed to load ${fileName} assets:`, error);
            }
        });
    
        // Wait for all assets to load
        await Promise.all(requests);
    
        // Store loaded library and share through global state
        this.library = files;
        sharedData.componentLibrary = files;
    
        // Initialize 3D assets and preprocessing
        this.Assets3D = new Assets3D(this.sceneHelper, this.library, assetConfigs);
        await this.Assets3D.loadInstanceSet();
        this.preprocess = new Preprocess(this.library);
    
        return this.library;
    } 

    /**
     * Processes and renders AHU data in specified output mode.
     * Ensures library is loaded before processing XETO data.
     * 
     * @param {Object} xeto - XETO data defining the AHU configuration
     * @param {string} outputMode - Desired output mode for processing
     * @returns {Object|null} Processed AHU object or null if library not loaded
     */
    async runAhu3D(xeto, outputMode){
        // Verify library has been initialized
        if(this.libraryLoadInitiated == false) {
            alert("Please load in the asset library before loading xeto.");
            return null;
        }

        // Wait for library to finish loading if necessary
        if(this.isLibraryLoaded == false) {
            await new Promise((resolve) => {
                const checkLibraryInterval = setInterval(() => {
                    if (this.isLibraryLoaded) {
                        clearInterval(checkLibraryInterval);
                        resolve();
                    }
                }, 100);
            });
        }        

        // Preprocess XETO data
        const {cleanedXeto, ductsDictionary} = this.preprocess.preprocessXeto(xeto);

        // Update FlowControl with processed data
        this.FlowControl.cleanedXeto = cleanedXeto;
        this.FlowControl.ductsDictionary = ductsDictionary;

        // Handle invalid XETO data
        if(!cleanedXeto) {
            return [];
        }

        // Clear existing scene
        this.sceneHelper.clearScene();

        // Process and render AHU configuration
        this.ahuObject = await this.FlowControl.runAhu3D(cleanedXeto, outputMode);

        // Store component meshes for later reference
        this.components = this.ahuObject["3d"].components.meshes;

        return this.ahuObject;
    }

    /**
     * Translates a component's position along the Y-axis within constraints.
     * 
     * @param {string} componentId - ID of the component to translate
     * @param {number} translateValue - Amount to translate (-2000 to 0)
     * @returns {number} Actual translation applied
     */
    translateY(componentId, translateValue) {
        // Get component reference
        const component = this.components[componentId];
        if (component != undefined) {
            // Apply translation if within valid range
            if(translateValue <= 0 && translateValue >= -2000) {
                component.position.y = translateValue;
                return translateValue;
            }
        }
        return 0;
    }
    
    /**
     * Applies a glowing effect to a specified component using the OutlinePass shader.
     * 
     * @param {string} componentId - Component identifier
     * @param {string[]} [colors=['white']] - Array of colors for glow cycling
     * @param {number} [edgeGlow=1] - Glow intensity (0-1)
     * @param {number} [edgeThickness=4] - Edge thickness (1-4)
     * @param {number} [edgeStrengthFactor=6] - Edge strength multiplier
     */
    setGlow(componentId, colors = ['white'], edgeGlow = 1, edgeThickness = 4, edgeStrengthFactor = 6) {       
        const component = this.components[componentId];
        if (component != undefined) {
            // Remove existing glow if present
            if(component.userData.colorQueue != undefined) {
                this.removeGlow(componentId);
            }

            // Remove from glowing meshes array if present
            const index = this.sceneHelper.glowingMeshes.indexOf(component);
            if (index !== -1) {
                this.glowingMeshes.splice(index, 1);
            }

            // Clean up existing outline pass
            if (component.userData.outlinePass) {
                this.composer.removePass(component.userData.outlinePass);
                delete component.userData.outlinePass;
            }

            // Set up color queue for glow effect
            component.userData.colorQueue = [];
            for (const color of colors) {
                component.userData.colorQueue.push(new THREE.Color(color));
            }
    
            // Create new outline pass for glow effect
            const newOutlinePass = new OutlinePass(
                new THREE.Vector2(
                    1 / this.moduleConfigs.scene.renderer.size.width, 
                    1 / this.moduleConfigs.scene.renderer.size.height
                ),
                this.sceneHelper.scene,
                this.sceneHelper.cameras.primary
            );

            // Configure outline pass parameters
            newOutlinePass.edgeGlow = edgeGlow;
            newOutlinePass.edgeThickness = edgeThickness;
            component.userData.edgeStrengthFactor = edgeStrengthFactor;
            newOutlinePass.hiddenEdgeColor.set(0x000000);
    
            // Set component as target for outline effect
            newOutlinePass.selectedObjects = [component];
            component.userData.outlinePass = newOutlinePass;
    
            // Add to rendering pipeline
            this.sceneHelper.composer.addPass(newOutlinePass);
            this.sceneHelper.glowingMeshes.push(component);
        }
    }

    /**
     * Removes glow effect from a specified component.
     * 
     * @param {string} componentId - Component to remove glow from
     */
    removeGlow(componentId) {
        const component = this.components[componentId];
        if (!component) {
            console.warn(`Component not found: ${componentId}`);
            return;
        }
    
        // Remove from glowing meshes list
        const index = this.sceneHelper.glowingMeshes.indexOf(component);
        if (index !== -1) {
            this.sceneHelper.glowingMeshes.splice(index, 1);
        }
    
        // Clean up outline pass
        if (component.userData.outlinePass) {
            this.sceneHelper.composer.removePass(component.userData.outlinePass);
            delete component.userData.outlinePass;
        }
    
        // Clear color queue
        if (component.userData.colorQueue) {
            component.userData.colorQueue = undefined;
        }
    }    
    
    /**
     * Sets the duration for cycling through glow colors.
     * 
     * @param {number} duration - Cycle duration in milliseconds
     */
    setGlowCycleDuration(duration) {
        this.sceneHelper.glowCycleDuration = duration;
    }

    /**
     * Attaches the 3D scene to a DOM element.
     * 
     * @param {string} selectorTag - CSS selector for container element
     */
    attachScene(selectorTag) {
        const container = document.querySelector(selectorTag);
        container.appendChild(this.sceneHelper.renderer.domElement);
    }

    /**
     * Toggles grid visibility in the scene.
     */
    toggleGrid() {
        this.sceneHelper.grid.visible = !this.sceneHelper.grid.visible;
    }

    /**
     * Toggles component selector functionality.
     */
    toggleSelector() {
        this.sceneHelper.selectorEnabled = !this.sceneHelper.selectorEnabled;
    }

    /**
     * Toggles tooltip visibility.
     */
    toggleTooltip() {
        this.sceneHelper.tooltipEnabled = !this.sceneHelper.tooltipEnabled;
    }

    /**
     * Sets an attribute value for a specified component.
     * 
     * @param {string} key - Component identifier
     * @param {*} value - Attribute value to set
     */
    setAttribute(key, value) {
        if (this.components[key]) {
            this.components[key].setAttribute(value);
        }
        else {
            console.warn(`Component with key ${key} not found`);
        }
    }

    /**
     * Sets transparency level for a specified component.
     * 
     * @param {string} key - Component identifier
     * @param {number} transparency - Transparency value to set
     */
    setTransparency(key, transparency) {
        if (this.components[key]) {
            this.components[key].setTransparency(transparency);
        }
        else {
            console.warn(`Component with key ${key} not found`);
        }
    }

    /**
     * Sets the visibility of 3D wire objects in the scene
     * @param {boolean} [isVisible=true] - Whether wires should be visible
     */
    set3dWireVisibility(isVisible = true) {
        console.log("set3dWireVisibility started");
        this.sceneHelper.scene.traverse((object3d) => {
            // console.log("set3dWireVisibility traverse:", object3d);
            if (object3d.isObject3D && object3d.name.includes('Wire')) {
                console.log("set3dWireVisibility found wire:", object3d);
                object3d.visible = isVisible;
            }
        });
    }

    /**
     * Loads a component into the scene.
     * 
     * @param {Object} component - Component data to load
     * @param {boolean} [isVisible=true] - Initial visibility state
     * @param {number} [hvacOpacity=1] - Initial opacity value
     */
    loadComponent(component, isVisible = true, hvacOpacity = 1){
        this.Assets3D.loadComponent(component, isVisible, hvacOpacity);
    }

    /**
     * Cleans up and disposes of all resources used by the API.
     * Releases memory and removes references to allow garbage collection.
     */
    dispose() {
        console.log("Disposing Ahu3D...");
        
        // Clean up scene resources
        if (this.sceneHelper) {
            this.sceneHelper.dispose();
            this.sceneHelper = null;
        }

        // Clear component references
        this.components = {};

        // Clear utility references
        this.imports = null;
        this.utils = null;

        // Clear library reference
        this.library = null;

        console.log("Ahu3D disposed successfully.");
    }

    /**
     * Enhanced blueprint export that handles all file formats and downloads
     * @param {Konva.Layer} layer - The Konva layer to export
     * @param {Object} imageParams - Export parameters
     * @param {string} imageParams.fileName - Output filename
     * @param {string} imageParams.fileType - File type (svg, pdf, png)
     * @param {string} imageParams.strokeColor - Stroke color
     * @param {string} imageParams.textColor - Text color
     * @param {string} imageParams.backgroundColor - Background color
     * @param {number} imageParams.scale - Scale factor
     * @returns {Promise<void>}
     */
    async exportBlueprint(layer, imageParams) {
        // Validate scale parameter
        const scale = Math.max(0.5, Math.min(3, Number(imageParams.scale) || 1));
        const params = { ...imageParams, scale };
        
        if (params.fileType === "png") {
            // Use existing raster export method
            this.exportBlueprintAsRaster(layer, params);
        } else {
            try {
                // Export as vector (SVG)
                const svg = await this.exportBlueprintAsVector(layer, params);
                const name = `${params.fileName}.${params.fileType}`;
                
                if (params.fileType === "pdf") {
                    // Convert SVG to PDF
                    await this._convertSvgToPdf(svg, name, params);
                } else if (params.fileType === "svg") {
                    // Download SVG directly
                    this._invokeDownload(svg, name, "image/svg+xml");
                }
            } catch (error) {
                console.error("Error exporting blueprint:", error);
                throw error;
            }
        }
    }

    /**
     * Convert SVG blob to PDF and trigger download
     * @private
     * @param {Blob} svgBlob - SVG blob data
     * @param {string} fileName - Output filename
     * @param {Object} params - Export parameters
     */
    async _convertSvgToPdf(svgBlob, fileName, params) {
        try {
            // Convert SVG blob to SVG string
            const svgString = await svgBlob.text();
            
            // Create an SVG DOM element
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            
            // Get SVG dimensions
            const svgWidth = parseFloat(svgElement.getAttribute('width') || 600);
            const svgHeight = parseFloat(svgElement.getAttribute('height') || 400);
            
            // Create PDF with appropriate dimensions
            const pdf = new jsPDF({
                orientation: svgWidth > svgHeight ? 'landscape' : 'portrait',
                unit: 'pt',
                format: [svgWidth, svgHeight]
            });
            
            // Convert SVG to PDF using svg2pdf.js
            await pdf.svg(svgElement, {
                x: 0,
                y: 0,
                width: svgWidth,
                height: svgHeight
            });
            
            // Save the PDF
            const pdfBlob = pdf.output('blob');
            this._invokeDownload(pdfBlob, fileName, 'application/pdf');
        } catch (error) {
            console.error("Error converting SVG to PDF:", error);
            throw error;
        }
    }

    /**
     * Trigger file download
     * @private
     * @param {Blob|string} content - File content
     * @param {string} name - Filename
     * @param {string} blobType - MIME type
     */
    _invokeDownload(content, name, blobType) {
        const blob = content instanceof Blob ? content : new Blob([content], { type: blobType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export default Ahu3DAPI;