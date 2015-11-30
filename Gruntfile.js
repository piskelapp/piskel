module.exports = function(grunt) {

  // Update this variable if you don't want or can't serve on localhost
  var hostname = 'localhost';

  // create a version based on the build timestamp
  var dateFormat = require('dateformat');
  var version = '-' + dateFormat(new Date(), "yyyy-mm-dd-hh-MM");

  /**
   * Helper to prefix all strings in provided array with the provided path
   */
  var prefixPaths = function (paths, prefix) {
    return paths.map(function (path) {
      return prefix + path;
    });
  };

  // get the list of scripts paths to include
  var scriptPaths = require('./src/piskel-script-list.js').scripts;
  var piskelScripts = prefixPaths(scriptPaths, "src/").filter(function (path) {
    return path.indexOf('devtools') === -1;
  });

  // get the list of styles paths to include
  var stylePaths = require('./src/piskel-style-list.js').styles;
  var piskelStyles = prefixPaths(stylePaths, "src/");

  var getCasperConfig = function (suiteName, delay, host) {
    var testPaths = require('./test/casperjs/' + suiteName).tests;
    var tests = prefixPaths(testPaths, "test/casperjs/");

    return {
      filesSrc : tests,
      options : {
        args : {
          baseUrl : 'http://' + host + ':' + '<%= express.test.options.port %>/',
          mode : '?debug',
          delay : delay
        },
        async : false,
        direct : false,
        logLevel : 'info',
        printCommand : false,
        printFilePaths : true
      }
    };
  };

  var getExpressConfig = function (sourceFolders, port, host) {
    if (typeof sourceFolders === 'string') {
      sourceFolders = [sourceFolders];
    }

    return {
      options: {
        port: port,
        hostname : host,
        bases: sourceFolders
      }
    };
  };

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    clean: {
      prod: ['dest/prod', 'dest/tmp'],
      desktop: ['dest/desktop', 'dest/tmp'],
      dev: ['dest/dev', 'dest/tmp']
    },

    /**
     * STYLE CHECKS
     */

    leadingIndent : {
      options: {
        indentation : "spaces"
      },
      css : ['src/css/**/*.css']
    },

    jscs : {
      options : {
        "preset": "google",
        "maximumLineLength": 120,
        "requireCamelCaseOrUpperCaseIdentifiers": "ignoreProperties",
        "validateQuoteMarks": { "mark": "'", "escape": true },
        "disallowMultipleVarDecl": "exceptUndefined",
        "disallowSpacesInAnonymousFunctionExpression": null
      },
      js : [ 'src/js/**/*.js' , '!src/js/**/lib/**/*.js' ]
    },

    jshint: {
      options: {
        undef : true,
        latedef : true,
        browser : true,
        trailing : true,
        curly : true,
        globals : {'$':true, 'jQuery' : true, 'pskl':true, 'Events':true, 'Constants':true, 'console' : true, 'module':true, 'require':true, 'Q':true}
      },
      files: [
        'Gruntfile.js',
        'package.json',
        'src/js/**/*.js',
        '!src/js/**/lib/**/*.js' // Exclude lib folder (note the leading !)
      ]
    },

    /**
     * SERVERS, BROWSER LAUNCHERS
     */

    express: {
      regular: getExpressConfig('dest/prod', 9001, hostname),
      test: getExpressConfig(['dest/dev', 'test'], 9991, hostname),
      debug: getExpressConfig(['dest/dev', 'test'], 9901, hostname)
    },

    open : {
      regular : {
        path : 'http://' + hostname + ':9001/'
      },
      debug : {
        path : 'http://' + hostname + ':9901/?debug'
      }
    },

    watch: {
      prod: {
        files: ['src/**/*.*'],
        tasks: ['build'],
        options: {
          spawn: false
        }
      },
      dev: {
        files: ['src/**/*.*'],
        tasks: ['build-dev'],
        options: {
          spawn: false
        }
      }
    },

    /**
     * BUILD STEPS
     */

    sprite:{
      all : {
        src: 'src/img/icons/**/*.png',
        dest: 'src/img/icons.png',
        destCss: 'src/css/icons.css'
      }
    },

    concat : {
      js : {
        options : {
          separator : ';'
        },
        src : piskelScripts,
        dest : 'dest/prod/js/piskel-packaged' + version + '.js'
      },
      css : {
        src : piskelStyles,
        dest : 'dest/prod/css/piskel-style-packaged' + version + '.css'
      }
    },

    uglify : {
      options : {
        mangle : true
      },
      js : {
        files : {
          'dest/tmp/js/piskel-packaged-min.js' : ['dest/prod/js/piskel-packaged' + version + '.js']
        }
      }
    },

    includereplace: {
      all: {
        src: 'src/index.html',
        dest: 'dest/tmp/index.html',
        options : {
          globals : {
            'version' : version
          }
        }
      }
    },

    replace: {
      // main-partial.html is used when embedded in piskelapp.com
      mainPartial: {
        options: {
          patterns: [{
              match: /^(.|[\r\n])*<!--body-main-start-->/,
              replacement: "{% raw %}",
              description : "Remove everything before body-main-start comment"
            },{
              match: /<!--body-main-end-->(.|[\r\n])*$/,
              replacement: "{% endraw %}",
              description : "Remove everything after body-main-end comment"
            },{
              match: /([\r\n])  /g,
              replacement: "$1",
              description : "Decrease indentation by one"
            }
          ]
        },
        files: [
          // src/index.html should already have been moved by the includereplace task
          {src: ['dest/tmp/index.html'], dest: 'dest/prod/piskelapp-partials/main-partial.html'}
        ]
      }
    },

    copy: {
      prod: {
        files: [
          // dest/js/piskel-packaged-min.js should have been created by the uglify task
          {src: ['dest/tmp/js/piskel-packaged-min.js'], dest: 'dest/prod/js/piskel-packaged-min' + version + '.js'},
          {src: ['dest/tmp/index.html'], dest: 'dest/prod/index.html'},
          {src: ['src/logo.png'], dest: 'dest/prod/logo.png'},
          {src: ['src/js/lib/gif/gif.ie.worker.js'], dest: 'dest/prod/js/lib/gif/gif.ie.worker.js'},
          {expand: true, src: ['img/**'], cwd: 'src/', dest: 'dest/prod/', filter: 'isFile'},
          {expand: true, src: ['css/fonts/**'], cwd: 'src/', dest: 'dest/prod/', filter: 'isFile'}
        ]
      },
      dev: {
        files: [
          // in dev copy everything to dest/dev
          {src: ['dest/tmp/index.html'], dest: 'dest/dev/index.html'},
          {src: ['src/piskel-script-list.js'], dest: 'dest/dev/piskel-script-list.js'},
          {src: ['src/piskel-style-list.js'], dest: 'dest/dev/piskel-style-list.js'},
          {expand: true, src: ['js/**'], cwd: 'src/', dest: 'dest/dev/', filter: 'isFile'},
          {expand: true, src: ['css/**'], cwd: 'src/', dest: 'dest/dev/', filter: 'isFile'},
          {expand: true, src: ['img/**'], cwd: 'src/', dest: 'dest/dev/', filter: 'isFile'},
        ]
      }
    },

    /**
     * TESTING
     */

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    ghost : {
      'travis' : getCasperConfig('TravisTestSuite.js', 10000, hostname),
      'local' : getCasperConfig('LocalTestSuite.js', 50, hostname)
    },

    /**
     * DESKTOP BUILDS
     */

    nodewebkit: {
      windows : {
        options: {
          version : "0.11.5",
          build_dir: './dest/desktop/', // destination folder of releases.
          win: true,
          linux32: true,
          linux64: true
        },
        src: ['./dest/prod/**/*', "./package.json", "!./dest/desktop/"]
      },
      macos : {
        options: {
          platforms : ['osx64'],
          // had performance issues with 0.11.5 on mac os, need to test new versions/new hardware
          version : "0.10.5",
          build_dir: './dest/desktop/'
        },
        src: ['./dest/prod/**/*', "./package.json", "!./dest/desktop/"]
      }
    }
  });

  // Validate
  grunt.registerTask('lint', ['jscs:js', 'leadingIndent:css', 'jshint']);

  // karma/unit-tests task
  grunt.registerTask('unit-test', ['karma']);

  // Validate & Test
  grunt.registerTask('test-travis', ['lint', 'unit-test', 'build-dev', 'express:test', 'ghost:travis']);
  // Validate & Test (faster version) will NOT work on travis !!
  grunt.registerTask('test-local', ['lint', 'unit-test', 'build-dev', 'express:test', 'ghost:local']);
  grunt.registerTask('test-local-nolint', ['unit-test', 'build-dev', 'express:test', 'ghost:local']);

  grunt.registerTask('test', ['test-travis']);
  grunt.registerTask('precommit', ['test-local']);

  grunt.registerTask('build-index.html', ['includereplace']);
  grunt.registerTask('merge-statics', ['concat:js', 'concat:css', 'uglify']);
  grunt.registerTask('build',  ['clean:prod', 'sprite', 'merge-statics', 'build-index.html', 'replace', 'copy:prod']);
  grunt.registerTask('build-dev',  ['clean:dev', 'sprite', 'build-index.html', 'copy:dev']);

  // Validate & Build
  grunt.registerTask('default', ['lint', 'build']);

  // Build stand alone app with nodewebkit
  grunt.registerTask('desktop', ['clean:desktop', 'default', 'nodewebkit:windows']);
  grunt.registerTask('desktop-mac', ['clean:desktop', 'default', 'nodewebkit:macos']);

  // Start webserver and watch for changes
  grunt.registerTask('serve', ['build', 'express:regular', 'open:regular', 'watch:prod']);
  // Start webserver on src folder, in debug mode
  grunt.registerTask('serve-debug', ['build-dev', 'express:debug', 'open:debug', 'watch:dev']);
  grunt.registerTask('play', ['serve-debug']);
};
