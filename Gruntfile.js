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
  var dateFormat = require('dateformat');
  var now = new Date();
  var version = '-' + dateFormat(now, "yyyy-mm-dd-hh-MM");

  var mapToSrcFolder = function (path) {
    return "src/" + path;
  };

  var piskelScripts = require('./src/piskel-script-list.js').scripts.map(mapToSrcFolder).filter(function (path) {
    return path.indexOf('devtools') === -1;
  });
  var piskelStyles = require('./src/piskel-style-list.js').styles.map(mapToSrcFolder);

  var mapToCasperFolder = function (path) {
    return "test/casperjs/" + path;
  };

  var casperEnvironments = {
    'local' : {
      suite : './test/casperjs/LocalTestSuite.js',
      delay : 50
    },
    'travis' : {
      suite : './test/casperjs/TravisTestSuite.js',
      delay : 10000
    }
  };

  var getCasperConfig = function (env) {
    var conf = casperEnvironments[env];
    var tests = require(conf.suite).tests.map(mapToCasperFolder);
    return {
      filesSrc : tests,
      options : {
        args : {
          baseUrl : 'http://localhost:' + '<%= express.test.options.port %>/',
          mode : '?debug',
          delay : conf.delay
        },
        async : false,
        direct : false,
        logLevel : 'info',
        printCommand : false,
        printFilePaths : true
      }
    };
  };

  var getExpressConfig = function (source, port, host) {
    var bases;
    if (typeof source === 'string') {
      bases = [source];
    } else if (Array.isArray(source)) {
      bases = source;
    }

    return {
      options: {
        port: port,
        hostname : host || 'localhost',
        bases: bases
      }
    };
  };

  grunt.initConfig({
    clean: {
      before: ['dest'],
      after: ['build/closure/closure_compiled_binary.js']
    },
    jshint: {
      options: {
        indent:2,
        undef : true,
        latedef : true,
        browser : true,
        trailing : true,
        curly : true,
        es3 : true,
        globals : {'$':true, 'jQuery' : true, 'pskl':true, 'Events':true, 'Constants':true, 'console' : true, 'module':true, 'require':true}
      },
      files: [
        'Gruntfile.js',
        'package.json',
        'src/js/**/*.js',
        '!src/js/lib/**/*.js' // Exclude lib folder (note the leading !)
      ]
    },
    express: {
      test: getExpressConfig(['src', 'test'], 9991),
      regular: getExpressConfig('dest', 9001),
      debug: getExpressConfig(['src', 'test'], 9901)
    },
    open : {
      regular : {
        path : 'http://localhost:9001/'
      },
      debug : {
        path : 'http://localhost:9901/?debug'
      }
    },

    watch: {
      scripts: {
        files: ['src/**/*.*'],
        tasks: ['merge'],
        options: {
          spawn: false
        }
      }
    },
    ghost : {
      'travis' : getCasperConfig('travis'),
      'local' : getCasperConfig('local')
    },
    concat : {
      js : {
        options : {
          separator : ';'
        },
        src : piskelScripts,
        dest : 'dest/js/piskel-packaged' + version + '.js'
      },
      css : {
        src : piskelStyles,
        dest : 'dest/css/piskel-style-packaged' + version + '.css'
      }
    },
    uglify : {
      options : {
        mangle : true
      },
      my_target : {
        files : {
          'dest/js/piskel-packaged-min.js' : ['dest/js/piskel-packaged' + version + '.js']
        }
      }
    },
    replace: {
      main: {
        options: {
          patterns: [
            {
              match: 'version',
              replacement: version
            }
          ]
        },
        files: [
          {src: ['src/piskel-boot.js'], dest: 'dest/piskel-boot.js'}
        ]
      },
      editor: {
        options: {
          patterns: [
            {
              match: /templates\//g,
              replacement: "../templates"+version+"/"
            },{
              match: /piskel-boot.js/g,
              replacement: "../piskel-boot"+version+".js"
            },{
              match: /^(.|[\r\n])*<!--body-main-start-->/,
              replacement: "",
              description : "Remove everything before body-main-start comment"
            },{
              match: /<!--body-main-end-->(.|[\r\n])*$/,
              replacement: "",
              description : "Remove everything after body-main-end comment"
            },{
              match: /([\r\n])  /g,
              replacement: "$1",
              description : "Decrease indentation by one"
            }
          ]
        },
        files: [
          {src: ['src/index.html'], dest: 'dest/piskelapp-partials/main-partial.html'}
        ]
      }
    },
    copy: {
      main: {
        files: [
          {src: ['dest/js/piskel-packaged-min.js'], dest: 'dest/js/piskel-packaged-min' + version + '.js'},
          {src: ['dest/piskel-boot.js'], dest: 'dest/piskel-boot' + version + '.js'},
          {src: ['src/logo.png'], dest: 'dest/logo.png'},
          {src: ['src/js/lib/iframeLoader-0.1.0.js'], dest: 'dest/js/lib/iframeLoader-0.1.0.js'},
          {src: ['src/js/lib/gif/gif.ie.worker.js'], dest: 'dest/js/lib/gif/gif.ie.worker.js'},
          {expand: true, src: ['img/**'], cwd: 'src/', dest: 'dest/', filter: 'isFile'},
          {expand: true, src: ['css/fonts/**'], cwd: 'src/', dest: 'dest/', filter: 'isFile'},
          {expand: true, src: ['**/*.html'], cwd: 'src/', dest: 'dest/', filter: 'isFile'}
        ]
      }
    },
    closureCompiler:  {
      options: {
        // [REQUIRED] Path to closure compiler
        compilerFile: 'build/closure/closure_compiler_20130823.jar',

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
          externs: ['build/closure/piskel-closure-externs.js'],
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
          'src/js/**/*.js',
          'src/piskel-boot.js',
          'src/piskel-script-list.js',
          '!src/js/lib/**/*.js'
        ],

        // This generated JS binary is currently not used and even excluded from source control using .gitignore.
        dest: 'build/closure/closure_compiled_binary.js'
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },
    nodewebkit: {
      options: {
        build_dir: './dest/desktop/', // destination folder of releases.
        mac: true,
        win: true,
        linux32: true,
        linux64: true
      },
      src: ['./dest/**/*', "./package.json", "!./dest/desktop/"]
    }
  });

  grunt.config.set('leadingIndent.indentation', 'spaces');
  grunt.config.set('leadingIndent.jsFiles', {
    src: [
      'src/js/**/*.js',
      '!src/js/lib/**/*.js'
    ]
  });
  grunt.config.set('leadingIndent.cssFiles', {
    src: ['src/css/**/*.css']
  });

  grunt.loadNpmTasks('grunt-closure-tools');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-ghost');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-leading-indent');
  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Validate
  grunt.registerTask('lint', ['leadingIndent:jsFiles', 'leadingIndent:cssFiles', 'jshint']);

  // karma/unit-tests task
  grunt.registerTask('unit-test', ['karma']);

  // Validate & Test
  grunt.registerTask('test-travis', ['lint', 'compile', 'unit-test', 'express:test', 'ghost:travis']);
  // Validate & Test (faster version) will NOT work on travis !!
  grunt.registerTask('test-local', ['lint', 'compile', 'unit-test', 'express:test', 'ghost:local']);

  grunt.registerTask('test', ['test-travis']);
  grunt.registerTask('precommit', ['test-local']);


  // Compile JS code (eg verify JSDoc annotation and types, no actual minified code generated).
  grunt.registerTask('compile', ['closureCompiler:compile', 'clean:after']);

  grunt.registerTask('rep', ['replace:main', 'replace:editor']);

  grunt.registerTask('merge',  ['concat:js', 'concat:css', 'uglify', 'rep', 'copy']);

  // Validate & Build
  grunt.registerTask('default', ['clean:before', 'lint', 'compile', 'merge']);

  // Build stand alone app with nodewebkit
  grunt.registerTask('desktop', ['default', 'nodewebkit']);

  grunt.registerTask('server', ['merge', 'express:regular', 'open:regular', 'express-keepalive']);

  // Start webserver and watch for changes
  grunt.registerTask('server:watch', ['server', 'watch']);

  // Start webserver on src folder, in debug mode
  grunt.registerTask('server:debug', ['express:debug', 'open:debug', 'express-keepalive']);
};
