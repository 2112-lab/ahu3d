/*
 * Validate.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module is responsible for validating the JSON configuration files, ensuring all 
 * necessary components and parameters are correctly defined and structured.
 * 
 */
class Validate {
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

export default Validate;