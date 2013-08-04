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

module.exports = function (grunt) {
  grunt.initConfig({
    jshint : {
      /*options: {
				"evil": true,
				"asi": true,
				"smarttabs": true,
				"eqnull": true
			},*/
      files : [
        'Gruntfile.js',
        'package.json',
        'js/**/*.js',
        '!js/lib/**/*.js' // Exclude lib folder (note the leading !)
      ]
    },
    connect : {
      www : {
        options : {
          base : '.',
          port : 4545
        }
      }
    },
    ghost : {
      dist : {
        filesSrc : ['tests/integration/casperjs/*_test.js'],
        options : {
          args : {
            baseUrl : 'http://localhost:' + '<%= connect.www.options.port %>/'
          },
          direct : false,
          logLevel : 'error',
          printCommand : false,
          printFilePaths : true
        }
      }
    },
    concat : {
      options : {
        separator : ';',
      },
      dist : {
        src : require('./script-load-list.js').scripts,
        dest : 'build/piskel-packaged.js',
      },
    },
    uglify : {
      options : {
        mangle : true
      },
      my_target : {
        files : {
          'build/piskel-packaged-min.js' : ['build/piskel-packaged.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ghost');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('test', ['jshint', 'connect', 'ghost']);
};
