

import Analysis from "./Analysis.js"
import Validation from "./Validation.js"

class Preprocess {
    constructor(componentLibEntries) {
        this.analysis = new Analysis();
        this.validation = new Validation(componentLibEntries);
    }

    preprocessXeto(xeto) {

        xeto = JSON.parse(JSON.stringify(xeto));

        let xetoDictionary = {};
        xetoDictionary.ahuGroup = xeto.filter(child => child.spec.includes('AhuGroup'));
        xetoDictionary.ductsList = xeto.filter(
            child => child.spec.includes('DuctEdge') && xetoDictionary.ahuGroup[0].ducts.includes(child.id)
        );
        xetoDictionary.componentsList = xeto.filter(child => child.spec.includes('Component'));

        console.log("preprocessXeto xetoDictionary.ductsList:", xetoDictionary.ductsList);

        const edges = JSON.parse(JSON.stringify(xetoDictionary.ductsList));

        const isValid = this.validation.validateJsonBlocks(xeto);
        const isValid2 = this.validation.validateComponentIds(xeto);

        // const isValid3 = this.validation.hasClosedLoop(edges) == false;
        // if(!isValid3) {
        //     alert("Xeto contains a closed loop.");
        // }

        if(!isValid || !isValid2) {
            return false;
        }

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
