import axios from 'axios';
import Analyze from "./Analyze"
import Validate from "./Validate"

class Import {
    /**
     * Constructor
     * 
     * Initializes the Import class and sets up the necessary properties for processing the Xeto assembly data.
     */
    constructor() {
        console.log("Import started");

        this.assets = {};
        this.assetConfigs = null;

        this.componentLibEntries = null;

        this.xeto;
        this.cleanedXeto = [];

        this.analyzer = new Analyze();
        this.validater = null;     
    }

    /**
     * loadLibraryFromApp
     * 
     * Loads component library entries from the specified asset configurations by sending asynchronous
     * requests to fetch JSON files and store their data.
     * 
     * @param {Object} assetConfigs - Configuration object with paths to assets and component list.
     * @returns {Object} The loaded files object.
     */
    async loadLibraryFromApp(assetConfigs) {
        const files = {};
        const jsonFiles = assetConfigs.componentList;
        const assetsPath = assetConfigs.assetsPath;

        const requests = jsonFiles.map(fileName => {
            const requestPath = `${assetsPath}json/${fileName}.json`;
            console.log("requestPath:", requestPath);
            return axios.get(requestPath) // Return the promise here
                .then(response => {
                    console.log(`Loaded ${fileName}.json successfully`);
                    files[fileName] = response.data;
                })
                .catch(error => {
                    console.error(`Failed to load ${fileName}.json:`, error);
                });
        });

        await Promise.all(requests); // Wait for all promises to resolve

        console.log("files:", files); // Now this will log after all requests are completed

        this.componentLibEntries = files;
        this.validater = new Validate(this.componentLibEntries);  

        return files; // Returning the files object directly
    }

    /**
     * loadXeto
     * 
     * Loads and processes the provided Xeto assembly data by cloning the input and analyzing it.
     * 
     * @param {Object} xeto - The Xeto assembly data.
     * @returns {Array} The cleaned and transformed Xeto assembly data.
     */
    loadXeto(xeto) {
        xeto = JSON.parse(JSON.stringify(xeto));

        let xetoDictionary = {};
        xetoDictionary.ahuGroup = xeto.filter(child => child.spec.includes('AhuGroup'));
        xetoDictionary.ductsList = xeto.filter(child => child.spec.includes('DuctEdge'));
        xetoDictionary.componentsList = xeto.filter(child => child.spec.includes('Component'));

        console.log("xetoDictionary 1:", xetoDictionary);

        this.analyzer.analyzeAndTransform(xetoDictionary);

        console.log("xetoDictionary 2:", xetoDictionary);

        this.validater.propogateBlockStyle(xetoDictionary);

        const cleanedXeto = [
            ...xetoDictionary.ahuGroup,
            ...xetoDictionary.ductsList,
            ...xetoDictionary.componentsList
        ];

        return cleanedXeto;
    }
}

export default Import;
