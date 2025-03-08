const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    
    return {
        entry: './src/index.js',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'Ahu3D',
            libraryTarget: 'umd',
            globalObject: 'this',
            publicPath: 'auto',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: /\.json$/,
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
                            loader: 'raw-loader',
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
        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        parse: {
                            ecma: 8,
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            comparisons: false,
                            inline: 2,
                            drop_console: isProduction,
                            drop_debugger: isProduction,
                            pure_funcs: isProduction ? ['console.info', 'console.debug', 'console.log'] : [],
                        },
                        mangle: {
                            safari10: true,
                        },
                        output: {
                            ecma: 5,
                            comments: false,
                            ascii_only: true,
                        },
                    },
                    extractComments: false,
                    parallel: true,
                }),
            ],
        },
    };
};