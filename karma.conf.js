const webpack = require('webpack');

module.exports = function (config) {
  config.set({
    files: [
      './lib/lodash.js',
      './src/Angular.js',
      { pattern: './test/**/*.js', watched: false }
    ],
    frameworks: ['jasmine'],
    browsers: ['PhantomJS'],
    preprocessors: {
      './test/**/*.js': ['webpack', 'babel']
    },
    // reporters: ['spec'],

    webpack: {

      module: {
        entry: {},
        loaders: [{
          test: /\.js/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015']
          }
        }]
      },
      watch: true
    },
    webpackServer: {
      noInfo: true
    },
    singleRun: true,
    plugins: [
      'karma-webpack',
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-babel-preprocessor',
    ]
  });
};
