const path = require('path');
const WebpackObfuscator = require('webpack-obfuscator');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';
    console.log("isDevelopment:", isDevelopment);

    return {
        mode: isDevelopment ? 'development' : 'production', // Set mode explicitly
        entry: './src/index.js',
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
            ],
        },
        resolve: {
            extensions: ['.js', '.json'],
            fallback: {
                path: false,
            },
        },
        plugins: [
            ...(isDevelopment ? [] : [
                new WebpackObfuscator({
                    rotateStringArray: true,
                }, ['**/Scene.js']),
            ]),
        ],
        optimization: {
            minimize: !isDevelopment,  // Minimize only in production mode
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: !isDevelopment,  // Keep console logs in development
                        },
                        mangle: !isDevelopment,  // Only mangle in production
                    },
                }),
            ],
        },
    };
};
