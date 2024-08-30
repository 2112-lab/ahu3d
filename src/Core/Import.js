class Import {
    constructor() {
        this.assets = {};
    }
    loadLibraryFromApp() {
        const files = {};
        const context = require.context(`/static/components/json/`, true, /\.json$/);
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