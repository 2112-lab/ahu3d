/*
 * Analysis.js
 * 
 * Author: Caleb Ebers
 * Date: 9/06/2024
 * 
 * This module handles analysis tasks within the scene, including real-time metrics and 
 * performance evaluation based on the loaded 3D models.
 * 
 */

/**
 * Class representing an Analysis utility for 3D models and ducts.
 * This class contains various methods for manipulating and analyzing ducts and their relationships.
 */
class Analysis {
  
    /**
     * analyzeAndTransform
     * 
     * Analyzes the duct data and performs transformations, such as aligning secondary ducts and determining connections.
     * Removes ducts marked for deletion and prepares ducts for further analysis.
     * 
     * @param {Object} xetoDictionary - The dictionary containing all the duct and AHU data.
     * @returns {Object} The transformed xetoDictionary after analysis and transformations.
     */
    analyzeAndTransform(xetoDictionary) {
        console.log("analyzeAndTransform started");
        
        // Get the primary duct from the list of ducts
        let currentDuct = this.getPrimaryDuct(xetoDictionary.ductsList);

        // Recursively traverse the tree of ducts to align secondary ducts
        // Align the secondary ducts so that the start value of each duct equals the end value of the previous duct.
        this.alignSecondaryDucts(xetoDictionary.ductsList, currentDuct);
        
        // Remove ducts marked for deletion from the AHU group and the ducts list
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

        // Filter out ducts that are marked for deletion
        xetoDictionary.ductsList = xetoDictionary.ductsList.filter(obj => obj.delete == undefined);

        // Determine the orientations of all ducts
        this.determineOrientations(xetoDictionary.ductsList);

        // Determine the connections between the ducts
        this.determineConnections(xetoDictionary.ductsList);

        // Create a dictionary of ducts based on their intersections
        xetoDictionary.ductsDictionary = this.determineIntersectionDucts(xetoDictionary.ductsList);

        console.log("xetoDictionary:", xetoDictionary);

        // Return the modified xetoDictionary
        return xetoDictionary
    }

    /**
     * getRelativePosition
     * 
     * Logs the relative position of ducts based on their IDs, ensuring ducts are not logged multiple times.
     * This is used for debugging and analysis purposes.
     * 
     * @param {Object} ductsDictionary - A dictionary containing ducts and their intersections.
     */
    getRelativePosition(ductsDictionary) {
        const traversedDucts = new Set();

        // Iterate through the ducts in the dictionary to log their IDs
        for (const key in ductsDictionary) {
            for (const duct of ductsDictionary[key]) {
                if (!traversedDucts.has(duct.id)) {
                    console.log("getRelativePosition duct:", duct.id.split("::")[1]);
                    traversedDucts.add(duct.id); // Mark duct as logged
                }
            }
        }
    }

    /**
     * determineIntersectionDucts
     * 
     * Builds a dictionary of ducts based on their intersection locations (start and end).
     * This helps in identifying the ducts that are connected at specific locations.
     * 
     * @param {Array} ductsList - A list of all ducts in the assembly.
     * @returns {Object} A dictionary of ducts categorized by their start and end locations.
     */
    determineIntersectionDucts(ductsList) {
        // Build the ductsDictionary by grouping ducts based on their start and end locations
        const ductsDictionary = ductsList.reduce((acc, duct) => {
            const { start, end } = duct.graphicLocation;
          
            // Ensure an array exists for the 'start' location
            if (!acc[start]) {
              acc[start] = [];
            }
            acc[start].push(duct);
          
            // Ensure an array exists for the 'end' location
            if (!acc[end]) {
              acc[end] = [];
            }
            acc[end].push(duct);
          
            return acc;
          }, {});
          
        console.log(ductsDictionary);

        // Return the dictionary of ducts based on their intersection locations
        return ductsDictionary;
    }

    /**
     * determineConnections
     * 
     * Determines the connections between ducts based on their orientations.
     * Ducts are grouped into north, south, east, and west orientations, and their connections are calculated.
     * 
     * @param {Array} ductsList - A list of all ducts in the assembly.
     */
    determineConnections(ductsList) {
        console.log("determineConnections ductsList:", ductsList);

        // Filter ducts based on their orientation
        const northDucts = ductsList.filter(child => child.orientation === "north");
        const southDucts = ductsList.filter(child => child.orientation === "south");
        const eastDucts = ductsList.filter(child => child.orientation === "east");
        const westDucts = ductsList.filter(child => child.orientation === "west");

        // Initialize the connections for each duct
        for (const duct of ductsList) {
            duct.connections = {
                top: {},
                bottom: {},
                left: {},
                right: {}
            };
        }

        // Loop through ducts in the north orientation to determine their top and bottom connections
        for (const duct of northDucts) {
            duct.connections.top = ductsList.filter(child => 
                (duct.graphicLocation.end === child.graphicLocation.start || 
                 duct.graphicLocation.end === child.graphicLocation.end) && 
                duct !== child
            ).map(child => child.id.split("::")[1]);

            duct.connections.bottom = ductsList.filter(child => 
                (duct.graphicLocation.start === child.graphicLocation.start || 
                 duct.graphicLocation.start === child.graphicLocation.end) && 
                duct !== child
            ).map(child => child.id.split("::")[1]);
        }

        // Loop through ducts in the south orientation to determine their top and bottom connections
        for (const duct of southDucts) {
            duct.connections.top = ductsList.filter(child => 
                (duct.graphicLocation.start === child.graphicLocation.start || 
                 duct.graphicLocation.start === child.graphicLocation.end) && 
                duct !== child
            ).map(child => child.id.split("::")[1]);

            duct.connections.bottom = ductsList.filter(child => 
                (duct.graphicLocation.end === child.graphicLocation.start || 
                 duct.graphicLocation.end === child.graphicLocation.end) && 
                duct !== child
            ).map(child => child.id.split("::")[1]);
        }

        // Log the connections for each duct (top and bottom)
        for (const duct of ductsList) {
            console.log(`determineConnections ${duct.id.split("::")[1]} top:\n` + JSON.stringify(duct.connections.top, null, 2));
            console.log(`determineConnections ${duct.id.split("::")[1]} bottom:\n` + JSON.stringify(duct.connections.bottom, null, 2));
        }
    }

    /**
     * determineOrientations
     * 
     * Determines the orientation of each duct based on its start and end locations.
     * The orientation is categorized as north, south, east, or west based on the relative positions of the start and end locations.
     * Additionally, each duct is marked as vertical if its orientation is north or south.
     * 
     * @param {Array} ductsList - A list of all ducts in the assembly.
     */
    determineOrientations(ductsList) {
        // Iterate through each duct to determine its orientation
        for(const duct of ductsList) {
            duct.orientation = this.getOrientation(
                duct.graphicLocation.start, 
                duct.graphicLocation.end
            );
            
            // Mark duct as vertical if its orientation is north or south
            if(duct.orientation === "north" || duct.orientation === "south") {
                duct.isVertical = true;
            } else {
                duct.isVertical = false;
            }
        }
    }

    /**
     * getPrimaryDuct
     * 
     * Identifies the primary duct in a list of ducts based on intersection analysis.
     * A duct is considered primary if it does not have any intersecting ducts at either its start or end location.
     * 
     * @param {Array} ductsList - List of all ducts in the assembly.
     * @returns {Object} The primary duct.
     */
    getPrimaryDuct(ductsList) {
        // Iterate through ducts to find the one without intersections at either its start or end
        for(const duct of ductsList) {
            const startIntersections = ductsList.filter(child => 
                duct.graphicLocation.start === child.graphicLocation.start &&
                duct !== child ||
                duct.graphicLocation.start === child.graphicLocation.end &&
                duct !== child
            );

            const endIntersections = ductsList.filter(child => 
                duct.graphicLocation.end === child.graphicLocation.start &&
                duct !== child ||
                duct.graphicLocation.end === child.graphicLocation.end &&
                duct !== child
            );

            // If no intersections at start or end, this is the primary duct
            if(startIntersections.length == 0 || endIntersections.length == 0) {
                return duct;
            }
        }
    }

    /**
     * alignPrimaryDuct
     * 
     * Aligns the primary duct by swapping its start and end points if it intersects with another duct.
     * This ensures that the primary duct’s positions are correct relative to other ducts.
     * 
     * @param {Array} ductsList - List of all ducts in the assembly.
     * @param {Object} currentDuct - The current duct to align.
     */
    alignPrimaryDuct(ductsList, currentDuct) {
        // Filter ducts that intersect with the current duct at its start
        let intersectedDucts = ductsList.filter(child => 
            currentDuct.graphicLocation.start === child.graphicLocation.start && 
            child !== currentDuct
        );
        
        // Filter ducts that intersect with the current duct at its end
        let intersectedDucts2 = ductsList.filter(child => 
            currentDuct.graphicLocation.start === child.graphicLocation.end
        );
        
        // If there are intersections, swap the start and end points of the current duct
        if(intersectedDucts.length > 0 || intersectedDucts2.length > 0) {
            console.log("alignPrimaryDuct started:", JSON.parse(JSON.stringify(currentDuct)) );
            this.swapStartEnd(currentDuct);
        }
    }

    /**
     * swapStartEnd
     * 
     * Swaps the start and end points of a duct's graphic location.
     * This operation is performed to adjust the duct's alignment relative to others in the assembly.
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
     * This method ensures the smooth alignment of duct networks by adjusting their positions.
     * 
     * @param {Array} ductsList - List of all ducts in the assembly.
     * @param {Object} currentDuct - The current duct being processed.
     */
    alignSecondaryDucts(ductsList, currentDuct) {
        // Filter ducts that intersect with the current duct at its end
        let intersectedDucts = ductsList.filter(child => 
            currentDuct.graphicLocation.end === child.graphicLocation.start && 
            child !== currentDuct
        );

        // Recursively align each intersected duct
        for(let intersectedDuct of intersectedDucts) {
            this.alignSecondaryDucts(ductsList, intersectedDuct, intersectedDucts);
        }

        // Filter ducts that intersect with the current duct at its end on the other side
        intersectedDucts = ductsList.filter(child => 
            currentDuct.graphicLocation.end === child.graphicLocation.end && 
            child !== currentDuct
        );

        // Recursively swap start and end and align intersected ducts
        for(let intersectedDuct of intersectedDucts) {
            this.swapStartEnd(intersectedDuct);
            this.alignSecondaryDucts(ductsList, intersectedDuct, intersectedDucts);
        }
    }

    /**
     * getOrientation
     * 
     * Determines the orientation of a duct based on the start and end graphic locations.
     * The orientation is categorized as north, south, east, or west based on the relative positions of the start and end locations.
     * 
     * @param {String} start - The start location of the duct.
     * @param {String} end - The end location of the duct.
     * @returns {String} The orientation of the duct (e.g., "north", "south", "east", "west").
     */
    getOrientation(start, end) {
        let orientation = "east"; // Default orientation is east
        if(this.getRow(end) > this.getRow(start)) {
            orientation = "south"; // Duct goes downwards
        }
        else if(this.getRow(end) < this.getRow(start)) {
            orientation = "north"; // Duct goes upwards
        }
        else if(end[0] > start[0]) {
            orientation = "east"; // Duct goes to the right
        }
        else if(end[0] < start[0]) {
            orientation = "west"; // Duct goes to the left
        }
        return orientation;
    }

    /**
     * getRow
     * 
     * Extracts the row number from a location string (e.g., "A5" -> 5).
     * This function is used to help determine the orientation of ducts.
     * 
     * @param {String} location - The location string (e.g., "A5").
     * @returns {Number} The row number extracted from the location.
     */
    getRow(location) {
        return parseInt(location.slice(1, location.length)); // Extract and return the numeric part of the location string
    }
}

export default Analysis;
