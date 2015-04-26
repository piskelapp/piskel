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

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    clean: {
      before: ['dest']
    },
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
      js : {
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
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },
    nodewebkit: {
      options: {
        version : "0.11.5",
        build_dir: './dest/desktop/', // destination folder of releases.
        mac: true,
        win: true,
        linux32: true,
        linux64: true
      },
      src: ['./dest/**/*', "./package.json", "!./dest/desktop/"]
    }
  });

  // Validate
  grunt.registerTask('lint', ['jscs:js', 'leadingIndent:css', 'jshint']);

  // karma/unit-tests task
  grunt.registerTask('unit-test', ['karma']);

  // Validate & Test
  grunt.registerTask('test-travis', ['lint', 'unit-test', 'express:test', 'ghost:travis']);
  // Validate & Test (faster version) will NOT work on travis !!
  grunt.registerTask('test-local', ['lint', 'unit-test', 'express:test', 'ghost:local']);
  grunt.registerTask('test-local-nolint', ['unit-test', 'express:test', 'ghost:local']);

  grunt.registerTask('test', ['test-travis']);
  grunt.registerTask('precommit', ['test-local']);

  grunt.registerTask('build',  ['concat:js', 'concat:css', 'uglify', 'replace:main', 'replace:editor', 'copy']);

  // Validate & Build
  grunt.registerTask('default', ['clean:before', 'lint', 'build']);

  // Build stand alone app with nodewebkit
  grunt.registerTask('desktop', ['default', 'nodewebkit']);

  // Start webserver and watch for changes
  grunt.registerTask('serve', ['build', 'express:regular', 'open:regular', 'express-keepalive', 'watch']);

  // Start webserver on src folder, in debug mode
  grunt.registerTask('serve-debug', ['express:debug', 'open:debug', 'express-keepalive']);
  grunt.registerTask('play', ['serve-debug']);
};
