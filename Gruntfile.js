module.exports = function(grunt) {

  // Update this variable if you don't want or can't serve on localhost
  var hostname = 'localhost';

  var PORT = {
    PROD : 9001,
    DEV : 9901,
    TEST : 9991
  };

  // create a version based on the build timestamp
  var dateFormat = require('dateformat');
  var version = '-' + dateFormat(new Date(), "yyyy-mm-dd-hh-MM");
  var releaseVersion = require('./package.json').version;

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

  // Casper JS tests
  var casperjsOptions = [
    '--baseUrl=http://' + hostname + ':' + PORT.TEST,
    '--mode=?debug',
    '--verbose=false',
    '--includes=test/casperjs/integration/include.js',
    '--log-level=info',
    '--print-command=false',
    '--print-file-paths=true',
  ];

  var integrationTestPaths = require('./test/casperjs/integration/IntegrationSuite.js').tests;
  var integrationTests = prefixPaths(integrationTestPaths, "test/casperjs/integration/");

  var getConnectConfig = function (base, port, host) {
    if (typeof base === 'string') {
      base = [base];
    }

    return {
      options: {
        port: port,
        hostname : host,
        base: base
      }
    };
  };

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    clean: {
      all: ['dest', 'src/img/icons.png', 'src/css/icons.css'],
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

    eslint: {
      files: [
        // Includes
        'src/js/**/*.js',
        // Exludes
        // TODO: remove this (for now we still get warnings from the lib folder)
        '!src/js/**/lib/**/*.js'
      ]
    },

    /**
     * SERVERS, BROWSER LAUNCHERS
     */

    connect: {
      prod: getConnectConfig('dest/prod', PORT.PROD, hostname),
      test: getConnectConfig(['dest/dev', 'test'], PORT.TEST, hostname),
      dev: getConnectConfig(['dest/dev', 'test'], PORT.DEV, hostname)
    },

    open : {
      prod : {
        path : 'http://' + hostname + ':' + PORT.PROD + '/'
      },
      dev : {
        path : 'http://' + hostname + ':' + PORT.DEV + '/?debug'
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
        retinaSrcFilter: 'src/img/icons/**/*@2x.png',
        dest: 'src/img/icons.png',
        retinaDest: 'src/img/icons@2x.png',
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
        dest : 'dest/tmp/css/piskel-style-packaged' + version + '.css'
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
            'version' : version,
            'releaseVersion' : releaseVersion
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
      },

      css: {
        options: {
          patterns: [{
            match: /var\(--highlight-color\)/g,
            replacement: "gold",
          }]
        },
        files: [{
          src: ['dest/tmp/css/piskel-style-packaged' + version + '.css'],
          dest: 'dest/prod/css/piskel-style-packaged' + version + '.css'
        }]
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

    casperjs : {
      drawing : {
        files : {
          src: ['test/casperjs/DrawingTest.js']
        },
        options : {
          casperjsOptions: casperjsOptions
        }
      },
      integration : {
        files : {
          src: integrationTests
        },
        options : {
          casperjsOptions: casperjsOptions
        }
      }
    },

    /**
     * DESKTOP BUILDS
     */

    nwjs: {
      windows : {
        options: {
          downloadUrl: 'https://dl.nwjs.io/',
          version : "0.19.4",
          build_dir: './dest/desktop/', // destination folder of releases.
          win: true,
          linux32: true,
          linux64: true,
          flavor: "normal",
        },
        src: ['./dest/prod/**/*', "./package.json", "!./dest/desktop/"]
      },
      macos : {
        options: {
          downloadUrl: 'https://dl.nwjs.io/',
          osx64: true,
          version : "0.19.4",
          build_dir: './dest/desktop/',
          flavor: "normal",
        },
        src: ['./dest/prod/**/*', "./package.json", "!./dest/desktop/"]
      },
      macos_old : {
        options: {
          downloadUrl: 'https://dl.nwjs.io/',
          osx64: true,
          version : "0.12.3",
          build_dir: './dest/desktop/old',
          flavor: "normal",
        },
        src: ['./dest/prod/**/*', "./package.json", "!./dest/desktop/"]
      }
    }
  });

  // TEST TASKS
  // Run linting
  grunt.registerTask('lint', ['eslint', 'leadingIndent:css']);
  // Run unit-tests
  grunt.registerTask('unit-test', ['karma']);
  // Run integration tests
  grunt.registerTask('integration-test', ['build-dev', 'connect:test', 'casperjs:integration']);
  // Run drawing tests
  grunt.registerTask('drawing-test', ['build-dev', 'connect:test', 'casperjs:drawing']);
  // Run linting, unit tests, drawing tests and integration tests
  grunt.registerTask('test', ['lint', 'unit-test', 'build-dev', 'connect:test', 'casperjs:drawing', 'casperjs:integration']);

  // Run the tests, even if the linting fails
  grunt.registerTask('test-nolint', ['unit-test', 'build-dev', 'connect:test', 'casperjs:drawing', 'casperjs:integration']);

  // Used by optional precommit hook
  grunt.registerTask('precommit', ['test']);

  // BUILD TASKS
  grunt.registerTask('build-index.html', ['includereplace']);
  grunt.registerTask('merge-statics', ['concat:js', 'concat:css', 'uglify']);
  grunt.registerTask('build',  ['clean:prod', 'sprite', 'merge-statics', 'build-index.html', 'replace:mainPartial', 'replace:css', 'copy:prod']);
  grunt.registerTask('build-dev',  ['clean:dev', 'sprite', 'build-index.html', 'copy:dev']);
  grunt.registerTask('desktop', ['clean:desktop', 'default', 'nwjs:windows']);
  grunt.registerTask('desktop-mac', ['clean:desktop', 'default', 'nwjs:macos']);
  grunt.registerTask('desktop-mac-old', ['clean:desktop', 'default', 'replace:desktop', 'nwjs:macos_old']);

  // SERVER TASKS
  // Start webserver and watch for changes
  grunt.registerTask('serve', ['build', 'connect:prod', 'open:prod', 'watch:prod']);
  // Start webserver on src folder, in debug mode
  grunt.registerTask('play', ['build-dev', 'connect:dev', 'open:dev', 'watch:dev']);

  // ALIASES, kept for backward compatibility
  grunt.registerTask('serve-debug', ['play']);
  grunt.registerTask('serve-dev', ['play']);
  grunt.registerTask('test-travis', ['test']);
  grunt.registerTask('test-local', ['test']);

  // Default task
  grunt.registerTask('default', ['lint', 'build']);
};
