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
        jquery : true,
        globals : {'pskl':true, 'Events':true, 'Constants':true, 'console' : true, 'module':true, 'require':true}
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
    },
    closureCompiler:  {
      options: {
        // [REQUIRED] Path to closure compiler
        compilerFile: 'closure_compiler_20130823.jar',

        // [OPTIONAL] set to true if you want to check if files were modified
        // before starting compilation (can save some time in large sourcebases)
        //checkModified: true,

        // [OPTIONAL] Set Closure Compiler Directives here
        compilerOpts: {
          /**
           * Keys will be used as directives for the compiler
           * values can be strings or arrays.
           * If no value is required use null
           */
          //compilation_level: 'ADVANCED_OPTIMIZATIONS',
          compilation_level: 'SIMPLE_OPTIMIZATIONS',
          externs: ['piskel-closure-externs.js'],
          // Inject some constants in JS code, could we use that for appengine wiring ?
          //define: ["'goog.DEBUG=false'"],
          warning_level: 'verbose',
          jscomp_off: ['checkTypes', 'fileoverviewTags'],
          summary_detail_level: 1,
          language_in: 'ECMASCRIPT3'
          //output_wrapper: '"(function(){%output%}).call(this);"'
        },
        execOpts: { // [OPTIONAL] Set exec method options
          maxBuffer: 999999 * 1024
        }

      },
      compile: {

        /**
         *[OPTIONAL] Here you can add new or override previous option of the Closure Compiler Directives.
         * IMPORTANT! The feature is enabled as a temporary solution to [#738](https://github.com/gruntjs/grunt/issues/738).
         * As soon as issue will be fixed this feature will be removed.
         */
        TEMPcompilerOpts: {
        },
        src: [
          'js/**/*.js',
          //'!js/lib/**/*.js',
          '!js/lib/bootstrap/**/*.js',
          '!js/lib/jsColor_1_4_0/**/*.js',
          '!js/lib/gif/**/*.js',
          'piskel-boot.js',
          'piskel-script-list.js'
        ],

        // This generated JS binary is currently not used and even excluded from source control using .gitignore.
        dest: 'closure_compiled_binary.js'
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
  grunt.loadNpmTasks('grunt-closure-tools');
  grunt.loadNpmTasks('grunt-ghost');
  grunt.loadNpmTasks('grunt-leading-indent');

  // Validate
  grunt.registerTask('lint', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint']);

  // Validate & Test 
  grunt.registerTask('test', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint', 'compile', 'connect:test', 'ghost:default']);

  // Validate & Test (faster version) will NOT work on travis !!
  grunt.registerTask('precommit', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint', 'compile', 'connect:test', 'ghost:local']);

  // Compile JS code (eg verify JSDoc annotation and types, no actual minified code generated).
  grunt.registerTask('compile', ['closureCompiler:compile']);

  // Validate & Build
  grunt.registerTask('default', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint', 'concat', 'compile', 'uglify']);

  // Start webserver
  grunt.registerTask('serve', ['connect:serve']);
};
