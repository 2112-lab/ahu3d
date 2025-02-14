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

/**
 * Class representing a Validation utility for the 3D model configuration.
 * This class contains various methods to validate JSON configuration data.
 */
class Validation {
  
  /**
   * Constructor for the Validation class.
   * Initializes the class with the component library entries.
   * 
   * @param {Object} componentLibEntries - A dictionary containing component library entries.
   */
  constructor(componentLibEntries) {
      this.componentLibEntries = componentLibEntries;
  }

  /**
   * validateJsonBlocks
   * 
   * Validates the structure of the provided JSON data (xeto), ensuring all references between
   * EdgeBlocks, Components, and AHU groups are valid.
   * 
   * @param {Array} xeto - The array of objects representing the configuration data to be validated.
   * @returns {Boolean} Returns true if validation passes, false otherwise.
   */
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

  /**
   * validateComponentIds
   * 
   * Validates the component IDs by checking for duplicates in the components list of DuctEdge objects.
   * If duplicates are found, an alert message is generated.
   * 
   * @param {Array} xeto - The array of objects representing the configuration data to be validated.
   * @returns {Boolean} Returns true if there are no duplicates, false otherwise.
   */
  validateComponentIds(xeto) {
      console.log("validateComponentIds started:", xeto);

      // Filter the ducts that have the spec 'DuctEdge'
      const ductsList = xeto.filter(child => child.spec.includes('DuctEdge'));
      console.log("validateComponentIds ductsList:", ductsList);

      let combinedArray = [];
      // Combine all components from the ducts into one array
      for(let duct of ductsList) {
          combinedArray.push(...duct.components);
      }

      console.log("validateComponentIds combinedArray:", combinedArray);

      let alertMessage = '';

      /**
       * hasDuplicates
       * 
       * Checks if an array contains any duplicate items.
       * 
       * @param {Array} arr - The array to check for duplicates.
       * @returns {Boolean} Returns true if duplicates are found, false otherwise.
       */
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

  /**
   * hasClosedLoop
   * 
   * Checks if a set of edges has a closed loop. This function creates a graph from the edges' connections 
   * and performs a depth-first search (DFS) to detect cycles (closed loops).
   * 
   * @param {Array} edges - The list of edges representing the connections between components.
   * @returns {Boolean} Returns true if a closed loop is detected, false otherwise.
   */
  hasClosedLoop(edges) {
      console.log("hasClosedLoop started");

      // Build a graph from the given edges
      let graph = {};

      edges.forEach(edge => {
          const edgeId = edge.id;
          if (!graph[edgeId]) graph[edgeId] = [];

          // Iterate through the edge's connections and add to the graph
          for (let direction in edge.connections) {
              edge.connections[direction].forEach(connId => {
                  graph[edgeId].push(connId);
              });
          }
      });

      let visited = new Set();
      let recStack = new Set();

      /**
       * dfs
       * 
       * Performs a depth-first search (DFS) on the graph to detect cycles (closed loops).
       * 
       * @param {String} node - The node to start DFS from.
       * @returns {Boolean} Returns true if a cycle is detected, false otherwise.
       */
      function dfs(node) {
          if (recStack.has(node)) return true;  // Cycle detected
          if (visited.has(node)) return false;  // Already visited

          visited.add(node);
          recStack.add(node);

          // Recur for all neighbors of the current node
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
              return true; // Cycle found
          }
      }

      console.log("hasClosedLoop finished");

      return false; // No cycle found
  }

  /**
   * propogateBlockStyle
   * 
   * Propagates block style attributes from the AHU group to ducts, and from ducts to components.
   * Ensures that any missing block style attributes are inherited correctly from their parent objects.
   * 
   * @param {Object} xetoDictionary - A dictionary containing the AHU group, ducts list, and components list.
   */
  propogateBlockStyle(xetoDictionary) {
      console.log("propogateBlockStyle started:", this.componentLibEntries);

      // Iterate over each duct in the ducts list
      for(const duct of xetoDictionary.ductsList) {
          // If a duct block is missing any blockStyle attributes, inherit them from the AHU group
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
          };

          // If no helpers are defined, inherit them from the AHU group or set defaults
          if(duct.blockStyle.helpers == undefined) {
            duct.blockStyle.helpers = xetoDictionary.ahuGroup[0].blockStyle.helpers || defaultHelpers;
          }
          if(duct.blockStyle.helpers.arrow == undefined) {
            duct.blockStyle.helpers.arrow = xetoDictionary.ahuGroup[0].blockStyle.helpers.arrow;
          }
          if(duct.blockStyle.helpers.text == undefined) {
            duct.blockStyle.helpers.text = xetoDictionary.ahuGroup[0].blockStyle.helpers.text;
          }

          // Propagate blockStyle to components in the duct if missing
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

              // Use component library entry to propagate additional component attributes
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
