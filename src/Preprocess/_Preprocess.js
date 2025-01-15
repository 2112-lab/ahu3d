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

    /**
     * preprocessXeto
     * 
     * Loads and processes the provided Xeto assembly data by cloning the input and analyzing it.
     * 
     * @param {Object} xeto - The Xeto assembly data.
     * @returns {Array} The cleaned and transformed Xeto assembly data.
     */
    preprocessXeto(xeto) {

        const isValid = this.validation.validateJsonBlocks(xeto);
        const isValid2 = this.validation.validateComponentIds(xeto);

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
            xetoDictionary.ductsDictionary,
            ...xetoDictionary.ahuGroup,
            ...xetoDictionary.ductsList,
            ...xetoDictionary.componentsList,
        ];

        return cleanedXeto;
    }
}

export default Preprocess;
