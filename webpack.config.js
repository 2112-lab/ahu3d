const path = require('path');

module.exports = {
    entry: './src/index.js', // Replace with your entry point
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        sources: false,
                    },
                },
            },
            // Add other loaders as needed
        ],
    },
    resolve: {
        extensions: ['.js', '.json'], // Extensions Webpack will resolve
        fallback: {
            "path": false // Prevent path from being polyfilled in the client-side bundle
        }
    },
};
