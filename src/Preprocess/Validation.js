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

/*
 * Validation.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module is responsible for validating the JSON configuration files, ensuring all 
 * necessary components and parameters are correctly defined and structured.
 * 
 */
class Validation {
    constructor(componentLibEntries) {
        this.componentLibEntries = componentLibEntries;
    }

    validateJsonBlocks(xeto) {

      let alertMessage = "";
      let isValid = true;

      // Track the valid IDs for EdgeBlocks and Components
      const edgeBlocks = new Set();
      const components = new Set();
    
      // First, gather all IDs for EdgeBlocks and Components
      xeto.forEach(item => {
        if (item.spec === 'r:novo.graphics::DuctEdge') {
          edgeBlocks.add(item.id);
        }
        if (item.spec === 'r:novo.graphics::Component') {
          components.add(item.id);
        }
      });
    
      // Now validate the structure
      for (const item of xeto) {
        if (item.spec === 'r:novo.graphics::AhuGroup') {
          // Validate ducts (AhuBlock needs to reference valid EdgeBlock)
          if (item.ducts) {
            for (const duct of item.ducts) {
              if (!edgeBlocks.has(duct)) {
                if(alertMessage != "") {
                  alertMessage += "\n\n";
                }
                alertMessage += `Invalid EdgeBlock reference: ${duct} in AHU Block: ${item.id}`;
                isValid = false;
              }
            }
          }
        } else if (item.spec === 'r:novo.graphics::DuctEdge') {
          // Validate components (EdgeBlock needs to reference valid Component)
          if (item.components) {
            for (const component of item.components) {
              if (!components.has(component)) {
                if(alertMessage != "") {
                  alertMessage += "\n\n";
                }
                alertMessage += `Invalid Component reference: ${component} in Edge Block: ${item.id}`;
                isValid = false;
              }
            }
          }
        }
      }

      if(isValid) {
        console.log('Validation passed.');
      }
      else {
        alert(alertMessage);
      }
      
      return isValid;        
    }

    validateComponentIds(xeto) {
      console.log("validateComponentIds started:", xeto);
      const ductsList = xeto.filter(child => child.spec.includes('DuctEdge'));
      console.log("validateComponentIds ductsList:", ductsList);

      let combinedArray = [];
      for(let duct of ductsList) {
        combinedArray.push(...duct.components);
      }

      console.log("validateComponentIds combinedArray:", combinedArray);

      let alertMessage = '';

      function hasDuplicates(arr) {
        const seen = new Set();
        for (const item of arr) {
            if (seen.has(item)) {
              alertMessage = `Duplicate component ID is found: ${item}`;
              return true; // Duplicate found
            }
            seen.add(item);
        }
        return false; // No duplicates
      }

      const isValid = !hasDuplicates(combinedArray);

      if(isValid) {
        console.log('validateComponentIds: Validation passed.');
      }
      else {
        alert(alertMessage);
      }

      return isValid;
    }

    hasClosedLoop(edges) {
      console.log("hasClosedLoop started");
      // Build a graph from the given edges
      let graph = {};
    
      edges.forEach(edge => {
        const edgeId = edge.id;
        if (!graph[edgeId]) graph[edgeId] = [];
    
        for (let direction in edge.connections) {
          edge.connections[direction].forEach(connId => {
            graph[edgeId].push(connId);
          });
        }
      });
    
      let visited = new Set();
      let recStack = new Set();
    
      // Function to perform DFS and detect cycles
      function dfs(node) {
        if (recStack.has(node)) return true;  // Cycle detected
        if (visited.has(node)) return false;  // Already visited
    
        visited.add(node);
        recStack.add(node);
    
        for (let neighbor of graph[node] || []) {
          if (dfs(neighbor)) return true;
        }
    
        recStack.delete(node);
        return false;
      }
    
      // Check each node in the graph for cycles
      for (let node in graph) {
        if (dfs(node)) {
          console.log(`hasClosedLoop: ${node}`);
          return true;
        }
      }

      console.log("hasClosedLoop finished");
    
      return false;
    }

    /**
     * propogateBlockStyle
     * 
     * Propagates block style attributes from the AHU group to ducts, and from ducts to components.
     * Ensures that any missing block style attributes are inherited correctly.
     * 
     * @param {Object} xetoDictionary - A dictionary of the ahuGroup, ductsList, and componentsList.
     */
    propogateBlockStyle(xetoDictionary) {
        console.log("propogateBlockStyle started:", this.componentLibEntries);

        for(const duct of xetoDictionary.ductsList) {

            // if a duct block is missing the blockStyle or any of the blockStyle attributes, inherit from the xetoDictionary.ahuGroup
            if(duct.blockStyle == undefined) {
                duct.blockStyle = xetoDictionary.ahuGroup[0].blockStyle;
            }
            if(duct.blockStyle.ductEnds == undefined) {
                duct.blockStyle.ductEnds = xetoDictionary.ahuGroup[0].blockStyle.ductEnds;
            }
            if(duct.blockStyle.flowDirection == undefined) {
                duct.blockStyle.flowDirection = xetoDictionary.ahuGroup[0].blockStyle.flowDirection;
            }
            if(duct.blockStyle.componentPadding == undefined) {
                duct.blockStyle.componentPadding = xetoDictionary.ahuGroup[0].blockStyle.componentPadding;
            }

            const defaultHelpers = {
              "arrow": {
                "display": false,
                "material": {
                  "opacity": 0.5,
                  "color": "#0000FF"
                },
                "padding": 0
              },
              "text": {
                "display": false,
                "value": "Mock Test",
                "material": {
                  "opacity": 1,
                  "color": "#FFFFFF"
                },
                "padding": 0
              }
            }

            if(duct.blockStyle.helpers == undefined) {
              duct.blockStyle.helpers = xetoDictionary.ahuGroup[0].blockStyle.helpers || defaultHelpers;
            }
            if(duct.blockStyle.helpers.arrow == undefined) {
              duct.blockStyle.helpers.arrow = xetoDictionary.ahuGroup[0].blockStyle.helpers.arrow;
            }
            if(duct.blockStyle.helpers.text == undefined) {
              duct.blockStyle.helpers.text = xetoDictionary.ahuGroup[0].blockStyle.helpers.text;
            }

            // if a component block is missing the blockStyle or any of the blockStyle attributes, inherit from the parent duct
            for(const componentId of duct.components) {
                let componentBlock = xetoDictionary.componentsList.filter(child => child.id.includes(componentId))[0];
                if(componentBlock.blockStyle == undefined) {
                    componentBlock.blockStyle = duct.blockStyle;
                }
                if(componentBlock.blockStyle.flowDirection == undefined) {
                    componentBlock.blockStyle.flowDirection = duct.blockStyle.flowDirection;
                    console.log("setting componentBlock.blockStyle.flowDirection:", componentBlock.blockStyle.flowDirection);
                }
                if(componentBlock.blockStyle.componentPadding == undefined) {
                    componentBlock.blockStyle.componentPadding = duct.blockStyle.componentPadding;
                }

                const splitComponentId = componentBlock.componentId.split("::")[1];

                const componentLibEntry = this.componentLibEntries[splitComponentId];
                if(componentLibEntry.componentPosition != undefined && componentBlock.blockStyle.componentPosition == undefined) {
                    componentBlock.blockStyle.componentPosition = componentLibEntry.componentPosition;
                }
                if(componentLibEntry.componentFacing != undefined && componentBlock.blockStyle.componentFacing == undefined) {
                    componentBlock.blockStyle.componentFacing = componentLibEntry.componentFacing;
                }
            }
        }
    }
}

export default Validation;