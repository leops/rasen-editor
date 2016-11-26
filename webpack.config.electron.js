/* eslint-disable import/no-extraneous-dependencies */

import webpack from 'webpack';
import validate from 'webpack-validator';
import merge from 'webpack-merge';
import baseConfig from './webpack.config.base';

export default validate(merge(baseConfig, {
    devtool: 'source-map',

    entry: ['babel-polyfill', './app/main.development'],

    // 'main.js' in root
    output: {
        path: __dirname,
        filename: './app/main.js'
    },

    plugins: [
        // Minify the output
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            }
        }),
        // Add source map support for stack traces in node
        // https://github.com/evanw/node-source-map-support
        // new webpack.BannerPlugin(
        //     'require("source-map-support").install();',
        //     { raw: true, entryOnly: false }
        // ),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        })
    ],

    /**
     * Set targed to Electron speciffic node.js env.
     * https://github.com/chentsulin/webpack-target-electron-renderer#how-this-module-works
     */
    target: 'electron-main',
}));
