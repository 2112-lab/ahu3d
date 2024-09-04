class Validate {
    constructor(componentLibEntries) {
        this.componentLibEntries = componentLibEntries;
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
        console.log("propogateBlockStyle started");

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