(function () {
  var ns = $.namespace('pskl.devtools');

  ns.init = function () {
    // We don't want this to be lower case because the test suites files are
    // named in both lower and upper case !!!
    var href = document.location.href;

    var testModeOn = href.indexOf('test=true') !== -1;
    var runTestModeOn = href.indexOf('test-run=') !== -1;
    var runSuiteModeOn = href.indexOf('test-suite=') !== -1;

    // test tools
    if (testModeOn) {
      this.testRecorder = new pskl.devtools.DrawingTestRecorder(pskl.app.piskelController);
      this.testRecorder.init();

      this.testRecordController = new pskl.devtools.TestRecordController(this.testRecorder);
      this.testRecordController.init();
    }

    // test tools
    if (runTestModeOn) {
      var testPath = href.split('test-run=')[1];
      this.testRunner = new pskl.devtools.DrawingTestRunner(testPath);
      this.testRunner.start();
    }

    // test tools
    if (runSuiteModeOn) {
      var suitePath = href.split('test-suite=')[1];
      this.testSuiteController = new pskl.devtools.DrawingTestSuiteController(suitePath);
      this.testSuiteController.init();
      this.testSuiteController.start();
    }
  };

})();
