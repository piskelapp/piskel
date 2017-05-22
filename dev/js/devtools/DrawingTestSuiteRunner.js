(function () {
  var ns = $.namespace('pskl.devtools');

  ns.DrawingTestSuiteRunner = function (testPaths) {
    if (Array.isArray(testPaths)) {
      this.testStatus = {};
      this.testPaths = testPaths;
      this.status = ns.DrawingTestSuiteRunner.STATUS.NOT_STARTED;
      this.currentIndex = -1;
    } else {
      throw new Error('testPaths should be an array of string (test paths)');
    }
  };

  ns.DrawingTestSuiteRunner.STATUS = {
    ERROR : 'ERROR',
    FAILED : 'FAILED',
    SUCCESS : 'SUCCESS',
    ONGOING : 'ONGOING',
    NOT_STARTED : 'NOT_STARTED'
  };

  ns.DrawingTestSuiteRunner.prototype.start = function () {
    this.status = ns.DrawingTestSuiteRunner.STATUS.ONGOING;
    this.runTest(0);
  };

  ns.DrawingTestSuiteRunner.prototype.runTest = function (testIndex) {
    this.currentIndex = testIndex;
    var path = this.testPaths[testIndex];
    if (path) {
      pskl.utils.Xhr.get(path, this.onTestLoaded_.bind(this));
    } else {
      this.onTestSuiteEnd_();
    }
  };

  ns.DrawingTestSuiteRunner.prototype.onTestLoaded_ = function (response) {
    var testRecord = JSON.parse(response.responseText);

    var testPlayer = new ns.DrawingTestPlayer(testRecord);

    testPlayer.addEndTestCallback(this.onTestEnd_.bind(this));
    testPlayer.start();
  };

  ns.DrawingTestSuiteRunner.prototype.onTestEnd_ = function (data /* {success, performance} */) {
    var path = this.testPaths[this.currentIndex];
    this.testStatus[path] = data;

    $.publish(Events.TEST_CASE_END, [path, data.success, data.performance]);

    this.runTest(this.currentIndex + 1);
  };

  ns.DrawingTestSuiteRunner.prototype.onTestSuiteEnd_ = function () {
    var success = this.testPaths.every(function (path) {
      return this.testStatus[path].success;
    }.bind(this));

    var performance = this.testPaths.reduce(function (p, path) {
      return this.testStatus[path].performance + p;
    }.bind(this), 0);

    this.status = success ? ns.DrawingTestSuiteRunner.STATUS.SUCCESS : ns.DrawingTestSuiteRunner.STATUS.ERROR;
    $.publish(Events.TEST_SUITE_END, [this.status, performance]);
  };
})();
