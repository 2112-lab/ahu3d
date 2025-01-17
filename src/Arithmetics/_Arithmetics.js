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
 * Arithmetics.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This class handles the calculation, placement, and orientation of HVAC assembly segments 
 * using the provided component library entries and cleaned assembly data. It ensures that 
 * all segments are correctly aligned, dimensioned, and positioned within the scene.
 * 
 */
/*
 * _Arithmetic.js
 * 
 * Author: Caleb Ebers
 * Date: 8/16/2024
 * 
 * This class handles the calculation, placement, and orientation of HVAC assembly segments 
 * using the provided component library entries and cleaned assembly data. It ensures that 
 * all segments are correctly aligned, dimensioned, and positioned within the scene.
 * 
 */

import Ahu from "./Ahu.js";
import Ends from "./Ends.js";
import Ducts from "./Ducts.js";
import Mesh3D from "../3D/Mesh3D.js";
import Helpers from "./Helpers.js";

export default class Arithmetics {
    /**
     * Constructor
     * 
     * Initializes the Arithmetics class with the component library entries and cleaned assembly data.
     * Precalculates the assembly segments and returns them.
     * 
     * @param {Object} componentLibrary - The library entries for the HVAC components.
     * @returns {Array} The precalculated assembly segments.
     */
    constructor(componentLibrary, sceneHelper) {
        this.componentLibrary = componentLibrary; // Store the component library entries.
        console.log("demo componentLibrary:", componentLibrary);
        this.sceneHelper = sceneHelper;

        this.primaryColor = 0xAEB9C2;

        this.innerDuctDimensions = {
            small: 500,
            medium: 1000,
            large: 1500
        }  

        this.Mesh3D = new Mesh3D(this.sceneHelper);

        this.Ahu = new Ahu();
        this.Ends = new Ends(this.innerDuctDimensions, this.sceneHelper, this.primaryColor);
        this.Helpers = new Helpers();
    }

    /**
     * calculateAssembly
     * 
     * Precalculates the assembly by processing ducts, building segments, creating duct ends,
     * placing segments in the scene, and calculating assembly dimensions.
     * 
     * @param {Object} cleanedXeto - The cleaned HVAC assembly data.
     * @returns {Array} The calculated assembly segments.
     */
    async calculateAssembly(cleanedXeto) {
        console.log("demo cleanedXeto:", cleanedXeto);

        this.cleanedXeto = cleanedXeto; // Store the cleaned assembly data.

        this.ductsDictionary = this.cleanedXeto[0];
        delete this.cleanedXeto[0];

        console.log("demo this.ductsDictionary:", this.ductsDictionary);

        this.ahuGroup = this.cleanedXeto.filter(child => child.spec.includes('AhuGroup'))[0];

        this.Ducts = new Ducts(
            this.innerDuctDimensions,
            this.ductsDictionary, 
            this.primaryColor, 
            this.Mesh3D, 
            this.componentLibrary,
            this.ahuGroup,
            this.sceneHelper
        );        

        this.assemblySegments = await this.Ducts.initializeAllDuctSegments(this.cleanedXeto);                 

        this.assemblySegments = await this.Ducts.placeSegments(this.assemblySegments); // Place the segments in the correct positions.

        this.assemblyGridBounds = this.ahuGroup.graphicLocation; // Get the grid bounds for the AHU group.
        console.log("demo this.assemblyGridBounds:", this.assemblyGridBounds);
        // this.assemblyDimensions = this.getAssemblyDimensions(this.assemblyGridBounds); // Calculate the dimensions of the assembly.
        // this.Ahu.translate(this.assemblySegments);

        this.Ends.createDuctEnds(this.assemblySegments); // Create the ends for the ducts.
        this.Helpers.createFlowHelpers(this.assemblySegments); // Create arrows for the ducts with open ends.

        console.log("demo this.assemblySegments:", this.assemblySegments);

        return this.assemblySegments; // Return the assembly segments.
    }
    
}
