const webpack = require('webpack');
const lodash = new webpack.ProvidePlugin({ _: "lodash" });
console.log(lodash);
module.exports = function (config) {
  config.set({
    files: [
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
    plugins: [
      lodash,
      'karma-webpack',
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-babel-preprocessor',
    ]
  });
};
