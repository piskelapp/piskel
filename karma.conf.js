// Karma configuration
// Generated on Tue Jul 22 2014 23:49:26 GMT+0200 (Romance Daylight Time)

const puppeteer = require('puppeteer');
process.env.CHROME_BIN = puppeteer.executablePath();
// process.env.EDGE_BIN = puppeteer.executablePath();

module.exports = function(config) {

  var mapToSrcFolder = function (path) {return ['src', path].join('/');};

  var piskelScripts = require('./src/piskel-script-list.js').scripts.map(mapToSrcFolder);
  piskelScripts.push('test/js/testutils/**/*.js');
  piskelScripts.push('test/js/**/*.js');

  // Polyfill for Object.assign (missing in PhantomJS)
  piskelScripts.push('./node_modules/phantomjs-polyfill-object-assign/object-assign-polyfill.js');

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: piskelScripts.concat([
      './node_modules/promise-polyfill/promise.js'
    ]),


    // list of files to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: [
    //   'ChromeHeadless',
    //   // 'EdgeHeadless',
    //   // 'FirefoxHeadless',
    // ],

    // https://github.com/karma-runner/karma-chrome-launcher/issues/158#issuecomment-339265457
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    plugins: [
      'karma-chrome-launcher',
      // '@chiragrupani/karma-chromium-edge-launcher',
      // 'karma-firefox-launcher',
      'karma-jasmine',
    ],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
  });
};
