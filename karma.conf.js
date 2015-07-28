module.exports = function(config){

  config.set({
    frameworks: ['jasmine'],
    browsers: ['PhantomJS'],
    files: [
      'src/**/*.js',
      'test/**/*.js'
    ],
    port: 8080
  });

}