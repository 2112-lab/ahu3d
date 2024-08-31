import axios from 'axios';

class Import {
    constructor() {
        this.assets = {};
        this.assetConfigs = null;
    }

    async loadLibraryFromApp(assetConfigs) {
        // assetConfigs = {
        //     "components": ["Fan", /** Continuing list here **/],
        //     "assetsPath": "/components/json/"
        // }

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

        return files; // Returning the files object directly
    }

    loadXeto() {
        // Implement as needed
    }
}

export default Import;
