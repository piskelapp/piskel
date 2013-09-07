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

  var piskelScripts = require('./piskel-script-list.js').scripts;
  var getGhostConfig = function (delay) {
    return {
      filesSrc : ['tests/integration/casperjs/*_test.js'],
      options : {
        args : {
          baseUrl : 'http://localhost:' + '<%= connect.test.options.port %>/',
          mode : '?debug',
          delay : delay
        },
        direct : false,
        logLevel : 'info',
        printCommand : false,
        printFilePaths : true
      }
    };
  };

  grunt.initConfig({
    jshint: {
      options: {
        indent:2,
        undef : true,
        latedef : true,
        browser : true,
        globals : {'$':true, 'jQuery' : true, 'pskl':true, 'Events':true, 'Constants':true, 'console' : true, 'module':true, 'require':true}
      },
      files: [
        'Gruntfile.js',
        'package.json',
        'js/**/*.js',
        '!js/lib/**/*.js' // Exclude lib folder (note the leading !)
      ]
    },
    connect : {
      test : {
        options : {
          base : '.',
          port : 4321
        }
      },
      serve : {
        options : {
          base : '.',
          port : 1234,
          keepalive : true
        }
      }
    },
    ghost : {
      default : getGhostConfig(3000),
      local : getGhostConfig(50)
    },
    concat : {
      options : {
        separator : ';',
      },
      dist : {
        src : piskelScripts,
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

  grunt.config.set('leadingIndent.indentation', 'spaces');
  grunt.config.set('leadingIndent.jsFiles', {
    src: ['js/**/*.js','!js/lib/**/*.js']
  });
  grunt.config.set('leadingIndent.cssFiles', {
    src: ['css/**/*.css']
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ghost');
  grunt.loadNpmTasks('grunt-leading-indent');

  // Validate
  grunt.registerTask('lint', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint']);

  // Validate & Test 
  grunt.registerTask('test', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint', 'connect:test', 'ghost:default']);

  // Validate & Test (faster version) will NOT work on travis !!
  grunt.registerTask('precommit', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint', 'connect:test', 'ghost:local']);

  // Validate & Build
  grunt.registerTask('default', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint', 'concat', 'uglify']);

  // Start webserver
  grunt.registerTask('serve', ['connect:serve']);

};
