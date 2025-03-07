

const path = require('path');

module.exports = (env, argv) => {
    return {
        entry: './src/index.js',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'Ahu3D',  // Explicitly name the library
            libraryTarget: 'umd',
            globalObject: 'this',  // Ensure compatibility in both browser and Node.js environments
            publicPath: 'auto',
        },
        module: {
            rules: [
                {
                    test: /\.js$/, // Apply Babel to JavaScript files
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: /\.json$/, // Allow importing JSON files
                    type: 'javascript/auto',
                    loader: 'json-loader'
                },
                {
                    test: /\.html$/,
                    use: {
                        loader: 'html-loader',
                        options: {
                            sources: false,
                        },
                    },
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: 'raw-loader', // Loads SVG as raw HTML string
                        },
                    ],
                }
            ],
        },
        resolve: {
            extensions: ['.js', '.json', '.svg'],
            fallback: {
                path: false,
            },
        },
    };
};
