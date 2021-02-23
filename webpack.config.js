const lodash = require('lodash');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

function srcPaths(src) {
  return path.join(__dirname, src);
}

const isEnvProduction = process.env.NODE_ENV === 'production';
const isEnvDevelopment = process.env.NODE_ENV === 'development';

// #region Common
const commonConfig = {
  devtool: isEnvDevelopment ? 'source-map' : false,
  mode: isEnvProduction ? 'production' : 'development',
  output: { path: srcPaths('dist') },
  node: { __dirname: false, __filename: false },
  resolve: {
    alias: {
      _: srcPaths('client'),
    },
    extensions: ['.js', '.json', '.ts', '.tsx', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.(scss|css)$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|png|svg|ico|icns|glb)$/,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
        },
      },
    ],
  },
};
// #endregion

const mainConfig = lodash.cloneDeep(commonConfig);
mainConfig.entry = './client/renderer.js';
mainConfig.target = 'electron-main';
mainConfig.output.filename = 'main.bundle.js';
mainConfig.plugins = [
  new CopyPlugin({
    patterns: [
      {
        from: 'package.json',
        to: 'package.json',
        transform: (content, _path) => { // eslint-disable-line no-unused-vars
          const jsonContent = JSON.parse(content);

          delete jsonContent.devDependencies;
          delete jsonContent.scripts;
          delete jsonContent.build;

          jsonContent.main = './main.bundle.js';
          jsonContent.scripts = { start: 'electron ./main.bundle.js' };
          jsonContent.postinstall = 'electron-builder install-app-deps';

          return JSON.stringify(jsonContent, undefined, 2);
        },
      },
    ],
  }),
];


const preloadConfig = {
  entry: './client/preload.js',
  target: 'electron-preload',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'preload.js'
  }
};


/*
preloadConfig.entry = './client/preload.js';
preloadConfig.target = 'electron-preload';
preloadConfig.output.filename = 'preload.js';
*/


const rendererConfig = lodash.cloneDeep(commonConfig);
rendererConfig.entry = './client/app.js';
rendererConfig.target = 'electron-renderer';
rendererConfig.output.filename = 'renderer.bundle.js';
rendererConfig.plugins = [
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, './client/index.html'),
  }),
];

//module.exports = [mainConfig, rendererConfig];
module.exports = [mainConfig, rendererConfig, preloadConfig];