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

import Analysis from "./Analysis.js"
import Validation from "./Validation.js"

class Preprocess {
    constructor(componentLibEntries) {
        this.analysis = new Analysis();
        this.validation = new Validation(componentLibEntries);
    }

    preprocessXeto(xeto) {

        const isValid = this.validation.validateJsonBlocks(xeto);
        const isValid2 = this.validation.validateComponentIds(xeto);

        console.log("preprocessXeto step 1");

        // this.ahuGroup = xeto.filter(child => child.spec.includes('AhuGroup'))[0];

        // if(this.ahuGroup.blockStyle.joints.XZ.style == "arc" && this.ahuGroup.blockStyle.joints.XZ.direction == "inwards"){
        //     console.log("preprocessXeto step 2");
        //     return false;
        // }

        if(!isValid || !isValid2) {
            return false;
        }

        xeto = JSON.parse(JSON.stringify(xeto));

        let xetoDictionary = {};
        xetoDictionary.ahuGroup = xeto.filter(child => child.spec.includes('AhuGroup'));
        xetoDictionary.ductsList = xeto.filter(
            child => child.spec.includes('DuctEdge') && xetoDictionary.ahuGroup[0].ducts.includes(child.id)
        );
        xetoDictionary.componentsList = xeto.filter(child => child.spec.includes('Component'));

        this.analysis.analyzeAndTransform(xetoDictionary);
        this.validation.propogateBlockStyle(xetoDictionary);

        const cleanedXeto = [
            ...xetoDictionary.ahuGroup,
            ...xetoDictionary.ductsList,
            ...xetoDictionary.componentsList,
        ];

        console.log("preprocessXeto cleanedXeto:", cleanedXeto);

        return {cleanedXeto: cleanedXeto, ductsDictionary: xetoDictionary.ductsDictionary};
    }
}

export default Preprocess;
