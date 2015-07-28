module.exports = function(grunt){

  grunt.initConfig({

    jshint: {
      all: ['src/**/*.js', 'test/**/*.js']

    },

    karma: {
      unit: {
        options: {
          frameworks: ['jasmine'],
          singleRun: true,
          browsers: ['PhantomJS'],
          reporters: ['progress'],
          files: [
          'lib**/*.js',
          'src/**/*.js',
          'test/**/*.js'
          ]
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', [ 'jshint','karma:unit']);

};
