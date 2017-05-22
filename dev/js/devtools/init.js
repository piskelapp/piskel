(function () {
  var ns = $.namespace('pskl.devtools');

  ns.init = function () {
    var href = document.location.href.toLowerCase();
    // test tools
    var testModeOn = href.indexOf('test=true') !== -1;
    if (testModeOn) {
      this.testRecorder = new pskl.devtools.DrawingTestRecorder(pskl.app.piskelController);
      this.testRecorder.init();

      this.testRecordController = new pskl.devtools.TestRecordController(this.testRecorder);
      this.testRecordController.init();
    }

    // test tools
    var runTestModeOn = href.indexOf('test-run=') !== -1;
    if (runTestModeOn) {
      var testPath = href.split('test-run=')[1];
      this.testRunner = new pskl.devtools.DrawingTestRunner(testPath);
      this.testRunner.start();
    }

    // test tools
    var runSuiteModeOn = href.indexOf('test-suite=') !== -1;
    if (runSuiteModeOn) {
      var suitePath = href.split('test-suite=')[1];
      this.testSuiteController = new pskl.devtools.DrawingTestSuiteController(suitePath);
      this.testSuiteController.init();
      this.testSuiteController.start();
    }
  };

})();
