/**
 * How to run grunt tasks:
 *   - At project root, run 'npm install' - It will install nodedependencies declared in package,json in <root>/.node_modules
 *   - install grunt CLI tools globally, run 'npm install -g grunt-cli'
 *   - run a grunt target defined in Gruntfiles.js, ex: 'grunt lint'
 *
 * Note: The 'ghost' grunt task have special deps on CasperJS and phantomjs.
 *       For now, It's configured to run only on TravisCI where these deps are
 *       correctly defined.
 *       If you run this task locally, it may require some env set up first.
 */

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      /*options: {
				"evil": true,
				"asi": true,
				"smarttabs": true,
				"eqnull": true
			},*/
      options: {
        indent:2
      },
      files: [
        'Gruntfile.js',
        'package.json',
        'js/**/*.js',
        '!js/lib/**/*.js' // Exclude lib folder (note the leading !)
      ]
    },
    connect: {
      www: {
        options: {
          base: '.',
          port: 4545
        }
      }
    },
    ghost: {
      dist: {
        filesSrc: ['tests/integration/casperjs/*_test.js'],
        options: {
          args: {
            baseUrl: 'http://localhost:' + '<%= connect.www.options.port %>/'
          },
          direct: false,
          logLevel: 'error',
          printCommand: false,
          printFilePaths: true
        }
      }
    }
  });

  grunt.config.set('leadingIndent.indentation', 'spaces');
  grunt.config.set('leadingIndent.jsFiles', {
    src: ['js/**/*.js','!js/lib/**/*.js']
  });
  grunt.config.set('leadingIndent.cssFiles', {
    src: ['css/**/*.css']
  });


  grunt.loadNpmTasks('grunt-leading-indent');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-ghost');

  grunt.registerTask('check-indent', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('test', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint', 'connect', 'ghost']);
};
