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
import Mesh3D from "../3D/Mesh3D.js";
import FlowControl from "./FlowControl.js";
import { sharedData } from "./globals.js";
import wildcardSvg from "../assets/2D-Wildcard.svg";
import { Context } from "svgcanvas";
import jsPDF from "jspdf";
import "svg2pdf.js";
import { CableSystem } from "./CableSystem.js";

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
        // Initialize 3D mesh handler
        this.Mesh3D = new Mesh3D(this.sceneHelper);
        // Initialize flow control system
        this.FlowControl = new FlowControl();
    }

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
     * Converts a Konva Layer to an embedded SVG in a PDF with customizable options.
     * @param {Konva.Layer} layer - The Konva Layer
     * @param {Object} imageParams - Image Parameters (e.g., colors, file name)
     * @param {Object} [pdfOptions] - Additional PDF settings
     */
    async exportLayerAsVector(layer, imageParams, pdfOptions = {}) {
        return new Promise(async (resolve) => {
            if (!layer) {
                console.error("No layer provided.");
                return resolve(null);
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

            // Create an SVG rendering context
            const exportShrinkFactor = 0.25; // Shrink SVG size further
            const c2s = layer.canvas.context._context = new Context({
                height: layer.height() * exportShrinkFactor,
                width: layer.width() * exportShrinkFactor,
                ctx: oldContext
            });

            pdfOptions.x = 

            // Draw the layer
            layer.draw();

            // Get the SVG data
            let svgData = c2s.getSerializedSvg();

            console.log("exportLayerAsVector fileType:", imageParams.fileType);

            if (imageParams.fileType === "svg") {
                svgData = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                const svgDataUrl = URL.createObjectURL(svgData);

                // Export the SVG file
                const a = document.createElement("a");
                a.href = svgDataUrl;
                a.download = `${imageParams.fileName}.${imageParams.fileType}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(svgDataUrl); // Cleanup
            } 
            else if (imageParams.fileType === "pdf") {
                layer.width(100);
                layer.height(200);
                // Get the original SVG dimensions
                const svgWidth = layer.width();
                const svgHeight = layer.height();

                // Set default PDF dimensions (A4 size in points: 595x842)
                const pdfWidth = 794;
                const pdfHeight = 1123;

                // Calculate scaling factor
                const scaleX = pdfWidth / svgWidth;
                const scaleY = pdfHeight / svgHeight;
                const scale = pdfOptions.scale || Math.min(scaleX, scaleY); // Default: Fit inside PDF

                // Create jsPDF instance
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "px",
                    format: [svgWidth, svgHeight]
                });

                // Convert SVG string to a DOM element
                const parser = new DOMParser();
                const svgElement = parser.parseFromString(svgData, "image/svg+xml").documentElement;

                // Embed SVG into PDF with options
                await pdf.svg(svgElement, {
                    x: pdfOptions.x || 0,  // Custom X position (default: 0)
                    y: pdfOptions.y || 0,  // Custom Y position (default: 0)
                    width: svgWidth,  // Scale width
                    height: svgHeight, // Scale height
                });

                // Save or download the PDF
                pdf.save(`${imageParams.fileName}.pdf`);
            }

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

            // Restore original context
            layer.canvas.context._context = oldContext;
            layer.draw();

            resolve(svgData);
        });
    }

    exportLayerAsRaster(layer, imageParams) {
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

    async loadControllers(controllerConfigs) {
        // Mark library load as initiated
        this.libraryLoadInitiated = true;
    
        // Initialize storage for loaded files
        const files = {};
        const controllerList = controllerConfigs.controllerList;
        const assetsPath = controllerConfigs.assetsPath;
    
        // Create promises for loading each controller's assets
        const requests = controllerList.map(async (controllerName) => {
            const jsonPath = `${assetsPath}${controllerName}/${controllerName}.json`;
    
            try {
                // Load and store controllers's JSON data
                const jsonResponse = await axios.get(jsonPath);
                files[controllerName] = jsonResponse.data;
            } catch (error) {
                console.error(`Failed to load ${controllerName} controller:`, error);
            }
        });
    
        // Wait for all controllers to load
        await Promise.all(requests);
    
        // Store loaded library and share through global state
        this.controllers = files;
        sharedData.controllers = files;
    
        return this.controllers;
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
        const ahuObject = await this.FlowControl.runAhu3D(cleanedXeto, outputMode);

        // Store component meshes for later reference
        this.components = ahuObject["3d"].components.meshes;

        return ahuObject;
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
}

export default Ahu3DAPI;