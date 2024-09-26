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
 * Analyze.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module handles analysis tasks within the scene, including real-time metrics and 
 * performance evaluation based on the loaded 3D models.
 * 
 * 
 */
class Analyze {
    analyzeAndTransform(xetoDictionary) {
        console.log("analyzeAndTransform started");
        
        let primaryDuct = this.getPrimaryDuct(xetoDictionary.ductsList);

        let currentDuct = primaryDuct;
        
        // Align the primary duct with its adjacent duct so that the end value of the primary duct equals the start value of the previous duct.
        this.alignPrimaryDuct(xetoDictionary.ductsList, currentDuct);

        // Recursively traverse the tree of ducts.
        // Align the secondary ducts so that the start value of each duct equals the end value of the previous duct.
        this.alignSecondaryDucts(xetoDictionary.ductsList, currentDuct);
        
        this.consolidateRedundantDucts(xetoDictionary.ductsList);

        for(const duct of xetoDictionary.ductsList) {
            if(duct.delete == true) {
                const ductIDs = duct.id.split(", ");
                for(const id of ductIDs) {
                    const index = xetoDictionary.ahuGroup[0].ducts.indexOf(id);
                    if (index !== -1) {
                        xetoDictionary.ahuGroup[0].ducts.splice(index, 1);
                    }
                }
            }
        }  

        xetoDictionary.ductsList = xetoDictionary.ductsList.filter(obj => obj.delete == undefined);

        return xetoDictionary
    }

    /**
     * getPrimaryDuct
     * 
     * Identifies the primary duct in a list of ducts based on intersection analysis.
     * 
     * @param {Array} ductsList - List of all ducts in the assembly.
     * @returns {Object} The primary duct.
     */
    getPrimaryDuct(ductsList){
        for(const duct of ductsList) {
            const startIntersections = ductsList.filter(child => 
                duct.graphicLocation.start === child.graphicLocation.start &&
                duct != child ||
                duct.graphicLocation.start === child.graphicLocation.end &&
                duct != child
            );

            const endIntersections = ductsList.filter(child => 
                duct.graphicLocation.end === child.graphicLocation.start &&
                duct != child ||
                duct.graphicLocation.end === child.graphicLocation.end &&
                duct != child
            );

            if(startIntersections.length == 0 || endIntersections.length == 0) {
                return duct
            }
        }
    }

    /**
     * alignPrimaryDuct
     * 
     * Aligns the primary duct by swapping its start and end points if it intersects with another duct.
     * 
     * @param {Array} ductsList - List of all ducts in the assembly.
     * @param {Object} currentDuct - The current duct to align.
     */
    alignPrimaryDuct(ductsList, currentDuct) {
        let intersectedDucts = ductsList.filter(child => 
            currentDuct.graphicLocation.start === child.graphicLocation.start && 
            child != currentDuct
        );
        let intersectedDucts2 = ductsList.filter(child => 
            currentDuct.graphicLocation.start === child.graphicLocation.end
        );
        if(intersectedDucts.length > 0 || intersectedDucts2.length > 0) {
            console.log("alignPrimaryDuct started:", JSON.parse(JSON.stringify(currentDuct)) );
            this.swapStartEnd(currentDuct);
        }
    }

    /**
     * swapStartEnd
     * 
     * Swaps the start and end points of a duct's graphic location.
     * 
     * @param {Object} duct - The duct whose start and end points are to be swapped.
     */
    swapStartEnd(duct) {
        let temp = duct.graphicLocation.start;
        duct.graphicLocation.start = duct.graphicLocation.end;
        duct.graphicLocation.end = temp;
    }

    /**
     * alignSecondaryDucts
     * 
     * Recursively aligns secondary ducts by ensuring the start value of each duct equals the end value of the previous duct.
     * 
     * @param {Array} ductsList - List of all ducts in the assembly.
     * @param {Object} currentDuct - The current duct being processed.
     */
    alignSecondaryDucts(ductsList, currentDuct) {
        let intersectedDucts = ductsList.filter(child => 
            currentDuct.graphicLocation.end === child.graphicLocation.start && 
            child != currentDuct
        );
        for(let intersectedDuct of intersectedDucts) {
            this.alignSecondaryDucts(ductsList, intersectedDuct, intersectedDucts);
        }

        intersectedDucts = ductsList.filter(child => 
            currentDuct.graphicLocation.end === child.graphicLocation.end && 
            child != currentDuct
        );
        for(let intersectedDuct of intersectedDucts) {
            this.swapStartEnd(intersectedDuct);
            this.alignSecondaryDucts(ductsList, intersectedDuct, intersectedDucts);
        }
    }

    /**
     * consolidateRedundantDucts
     * 
     * Consolidates redundant ducts by merging them when they have the same orientation
     * and updating their end locations and components.
     * 
     * @param {Array} ductsList - List of all ducts in the assembly.
     */
    consolidateRedundantDucts(ductsList) {
        for(let currentDuct of ductsList) {
            let currentDuctOrientation = this.getOrientation(
                currentDuct.graphicLocation.start, 
                currentDuct.graphicLocation.end
            );

            let intersectedDucts = ductsList.filter(child => 
                currentDuct.graphicLocation.end === child.graphicLocation.start && 
                child != currentDuct
            );
            while(intersectedDucts.length == 1) {
                let intersectionOrientation = this.getOrientation(
                    intersectedDucts[0].graphicLocation.start, 
                    intersectedDucts[0].graphicLocation.end
                );
                if(intersectionOrientation == currentDuctOrientation) {
                    currentDuct.components.push(...intersectedDucts[0].components);
                    currentDuct.graphicLocation.end = intersectedDucts[0].graphicLocation.end;
                    currentDuct.id = currentDuct.id + ", " + intersectedDucts[0].id;

                    intersectedDucts[0].delete = true;
                    intersectedDucts = ductsList.filter(child => 
                        intersectedDucts[0].graphicLocation.end === child.graphicLocation.start && 
                        child != currentDuct
                    );
                }
                else {
                    intersectedDucts = [];
                }
                
            } 
        }
    }

    /**
     * getOrientation
     * 
     * Determines the orientation of a duct based on the start and end graphic locations.
     * 
     * @param {String} start - The start location of the duct.
     * @param {String} end - The end location of the duct.
     * @returns {String} The orientation of the duct (e.g., "north", "south", "east", "west").
     */
    getOrientation(start, end) {
        let orientation = "east";
        if(this.getRow(end) > this.getRow(start)) {
            orientation = "south";
        }
        else if(this.getRow(end) < this.getRow(start)) {
            orientation = "north";
        }
        else if(end[0] > start[0]) {
            orientation = "east";
        }
        else if(end[0] < start[0]) {
            orientation = "west";
        }
        return orientation;
    }

    /**
     * getRow
     * 
     * Extracts the row number from a location string.
     * 
     * @param {String} location - The location string (e.g., "A5").
     * @returns {Number} The row number extracted from the location.
     */
    getRow(location) {
        return parseInt(location.slice(1, location.length));
    }
}

export default Analyze;