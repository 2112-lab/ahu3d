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

const path = require('path');
const WebpackObfuscator = require('webpack-obfuscator');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';
    console.log("isDevelopment:", isDevelopment);

    return {
        entry: './src/index.js',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'Ahu3D',  // Explicitly name the library
            libraryTarget: 'umd',
            globalObject: 'this',  // Ensure compatibility in both browser and Node.js environments
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
        // plugins: [
        //     ...(isDevelopment ? [] : [
        //         new WebpackObfuscator({
        //             rotateStringArray: true,
        //             reservedNames: ['^Ahu3D$'],  // Preserve the Ahu3D class name
        //         }, ['**/Scene.js']),
        //     ]),
        // ],
        // optimization: {
        //     minimize: !isDevelopment,  // Minimize only in production mode
        //     minimizer: [
        //         new TerserPlugin({
        //             terserOptions: {
        //                 compress: {
        //                     drop_console: !isDevelopment,  // Keep console logs in development
        //                 },
        //                 mangle: {
        //                     reserved: ['Ahu3D'],  // Prevent mangling the Ahu3D class name
        //                 },
        //             },
        //         }),
        //     ],
        // },
    };
};
