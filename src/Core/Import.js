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
 * Import.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module is responsible for loading external assets, such as 3D models and textures, 
 * into the scene, ensuring compatibility and correct positioning.
 * 
 */
import axios from 'axios';
import Analyze from "./Analyze.js"
import Validate from "./Validate.js"

class Import {
    constructor() {
        this.assets = {};
        this.assetConfigs = null;

        this.componentLibEntries = null;

        this.xeto;
        this.cleanedXeto = [];

        this.analyzer = new Analyze();
        this.validator = null;     
    }

    /**
     * loadLibrary
     * 
     * Loads component library entries from the specified asset configurations by sending asynchronous
     * requests to fetch JSON files and store their data.
     * 
     * @param {Object} assetConfigs - Configuration object with paths to assets and component list.
     * @returns {Object} The loaded files object.
     */
    async loadLibrary(assetConfigs) {
        const files = {};
        const jsonFiles = assetConfigs.componentList;
        const assetsPath = assetConfigs.assetsPath;

        const requests = jsonFiles.map(fileName => {
            const requestPath = `${assetsPath}${fileName}/${fileName}.json`;
            return axios.get(requestPath) // Return the promise here
                .then(response => {
                    // console.log(`Loaded ${fileName}.json successfully`);
                    files[fileName] = response.data;
                })
                .catch(error => {
                    console.error(`Failed to load ${fileName}.json:`, error);
                });
        });

        await Promise.all(requests); // Wait for all promises to resolve

        // console.log("files:", files); // Now this will log after all requests are completed

        this.componentLibEntries = files;
        this.validator = new Validate(this.componentLibEntries);  

        return files; // Returning the files object directly
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

        const isValid = this.validator.validateJsonBlocks(xeto);

        if(!isValid) {
            return isValid;
        }

        xeto = JSON.parse(JSON.stringify(xeto));

        let xetoDictionary = {};
        xetoDictionary.ahuGroup = xeto.filter(child => child.spec.includes('AhuGroup'));
        console.log("xetoDictionary.ahuGroup[0]:", xetoDictionary.ahuGroup[0]);
        xetoDictionary.ductsList = xeto.filter(
            child => child.spec.includes('DuctEdge') && xetoDictionary.ahuGroup[0].ducts.includes(child.id)
        );
        console.log("xetoDictionary.ductsList:", xetoDictionary.ductsList);
        xetoDictionary.componentsList = xeto.filter(child => child.spec.includes('Component'));

        for(const duct of xetoDictionary.ductsList) {

        }

        this.analyzer.analyzeAndTransform(xetoDictionary);

        this.validator.propogateBlockStyle(xetoDictionary);

        console.log("Import.js xetoDictionary.ahuGroup:", xetoDictionary.ahuGroup[0].blockStyle);

        if(xetoDictionary.ahuGroup[0].blockStyle.jointPadding == undefined) {
            xetoDictionary.ahuGroup[0].blockStyle["jointPadding"] = 0;
        }

        const cleanedXeto = [
            xetoDictionary.ductsDictionary,
            ...xetoDictionary.ahuGroup,
            ...xetoDictionary.ductsList,
            ...xetoDictionary.componentsList,
        ];

        return cleanedXeto;
    }
}

export default Import;
