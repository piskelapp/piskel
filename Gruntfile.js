module.exports = function(grunt) {
  var ip = 'localhost';
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
          baseUrl : 'http://' + ip + ':' + '<%= express.test.options.port %>/',
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
        hostname : host || ip,
        bases: bases
      }
    };
  };

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    clean: {
      prod: ['dest', 'dest-tmp'],
      dev: ['dest-dev', 'dest-tmp']
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
      test: getExpressConfig(['dest-dev', 'test'], 9991),
      regular: getExpressConfig('dest', 9001),
      debug: getExpressConfig(['dest-dev', 'test'], 9901)
    },

    open : {
      regular : {
        path : 'http://' + ip + ':9001/'
      },
      debug : {
        path : 'http://' + ip + ':9901/?debug'
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
      js : {
        files : {
          'dest-tmp/js/piskel-packaged-min.js' : ['dest/js/piskel-packaged' + version + '.js']
        }
      }
    },

    includereplace: {
      all: {
        src: 'src/index.html',
        dest: 'dest-tmp/index.html'
      }
    },

    replace: {
      piskelBoot: {
        options: {
          patterns: [
            {
              match: 'version',
              replacement: version
            }
          ]
        },
        files: [
          {src: ['src/piskel-boot.js'], dest: 'dest/piskel-boot.js'},
          {src: ['src/piskel-boot.js'], dest: 'dest/piskel-boot' + version +'.js'}
        ]
      },
      // main-partial.html is used when embedded in piskelapp.com
      mainPartial: {
        options: {
          patterns: [{
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
          // src/index.html should already have been moved by the includereplace task
          {src: ['dest/index.html'], dest: 'dest/piskelapp-partials/main-partial.html'}
        ]
      }
    },

    copy: {
      prod: {
        files: [
          // dest/js/piskel-packaged-min.js should have been created by the uglify task
          {src: ['dest-tmp/js/piskel-packaged-min.js'], dest: 'dest/js/piskel-packaged-min' + version + '.js'},
          {src: ['dest-tmp/index.html'], dest: 'dest/index.html'},
          {src: ['src/logo.png'], dest: 'dest/logo.png'},
          {src: ['src/js/lib/gif/gif.ie.worker.js'], dest: 'dest/js/lib/gif/gif.ie.worker.js'},
          {expand: true, src: ['img/**'], cwd: 'src/', dest: 'dest/', filter: 'isFile'},
          {expand: true, src: ['css/fonts/**'], cwd: 'src/', dest: 'dest/', filter: 'isFile'}
        ]
      },
      dev: {
        files: [
          // in dev copy everything to dest-dev
          {src: ['dest-tmp/index.html'], dest: 'dest-dev/index.html'},
          {src: ['src/piskel-boot.js'], dest: 'dest-dev/piskel-boot.js'},
          {src: ['src/piskel-script-list.js'], dest: 'dest-dev/piskel-script-list.js'},
          {src: ['src/piskel-style-list.js'], dest: 'dest-dev/piskel-style-list.js'},
          {expand: true, src: ['js/**'], cwd: 'src/', dest: 'dest-dev/', filter: 'isFile'},
          {expand: true, src: ['css/**'], cwd: 'src/', dest: 'dest-dev/', filter: 'isFile'},
          {expand: true, src: ['img/**'], cwd: 'src/', dest: 'dest-dev/', filter: 'isFile'},
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
      'travis' : getCasperConfig('travis'),
      'local' : getCasperConfig('local')
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
        src: ['./dest/**/*', "./package.json", "!./dest/desktop/"]
      },
      macos : {
        options: {
          platforms : ['osx64'],
          // had performance issues with 0.11.5 on mac os, need to test new versions/new hardware
          version : "0.10.5",
          build_dir: './dest/desktop/'
        },
        src: ['./dest/**/*', "./package.json", "!./dest/desktop/"]
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
  grunt.registerTask('replace-all', ['replace:piskelBoot', 'replace:mainPartial']);
  grunt.registerTask('build',  ['clean:prod', 'sprite', 'merge-statics', 'build-index.html', 'replace-all', 'copy:prod']);
  grunt.registerTask('build-dev',  ['clean:dev', 'sprite', 'build-index.html', 'copy:dev']);

  // Validate & Build
  grunt.registerTask('default', ['lint', 'build']);

  // Build stand alone app with nodewebkit
  grunt.registerTask('desktop', ['default', 'nodewebkit:windows']);
  grunt.registerTask('desktop-mac', ['default', 'nodewebkit:macos']);

  // Start webserver and watch for changes
  grunt.registerTask('serve', ['build', 'express:regular', 'open:regular', 'watch:prod']);
  // Start webserver on src folder, in debug mode
  grunt.registerTask('serve-debug', ['build-dev', 'express:debug', 'open:debug', 'watch:dev']);
  grunt.registerTask('play', ['serve-debug']);
};
