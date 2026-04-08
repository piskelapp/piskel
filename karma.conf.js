// Karma configuration
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {

  var mapToSrcFolder = function (path) { return ['src', path].join('/'); };

  var piskelScripts = require('./src/piskel-script-list.js').scripts.map(mapToSrcFolder);
  piskelScripts.push('tests/unit-tests/testutils/**/*.js');
  piskelScripts.push('tests/unit-tests/**/*.js');

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      ...piskelScripts],

    // list of files to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      ...(process.env.COVERAGE ? { 'src/js/**/*.js': ['coverage'] } : {})
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', ...(process.env.COVERAGE ? ['coverage'] : [])],

    ...(process.env.COVERAGE ? {
      coverageReporter: {
        reporters: [
          { type: 'html', dir: 'coverage/unit/html/' },
          { type: 'lcovonly', dir: 'coverage/unit/', subdir: '.', file: 'lcov.info' }
        ]
      }
    } : {}),


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
    browsers: ['ChromeHeadlessNoSandbox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
