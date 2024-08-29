class Import {
    constructor() {
        this.assets = {};
    }
    loadLibrary() {
        const files = {};
        const context = require.context(`../Library/`, true, /\.json$/);
        context.keys().forEach((key) => {
            const fileName = key.replace('./', '').replace('.json', '');
            files[fileName] = context(key);
        });       
        return files;
    }
    loadXeto() {
    }
}

export default Import;