(function () {
  var ns = $.namespace('pskl.devtools');

  ns.DrawingTestSuiteController = function (suitePath) {
    if (suitePath.indexOf('/') === -1) {
      suitePath = [Constants.DRAWING_TEST_FOLDER, suitePath].join('/');
    }
    this.suitePath = suitePath;
    this.testSuiteRunner = null;
  };

  ns.DrawingTestSuiteController.prototype.init = function () {
    $.subscribe(Events.TEST_CASE_END, this.onTestCaseEnd_.bind(this));
    $.subscribe(Events.TEST_SUITE_END, this.onTestSuiteEnd_.bind(this));
  };

  ns.DrawingTestSuiteController.prototype.start = function () {
    this.reset();
    this.startTime_ = Date.now();
    pskl.utils.Xhr.get(this.suitePath, this.onTestSuiteLoaded_.bind(this));

    var testSuiteStatus = document.createElement('li');
    testSuiteStatus.innerHTML = pskl.utils.Template.replace(
      '<b>Test Suite [{{path}}]</b>',
      {path : this.shortenPath_(this.suitePath)}
    );
    this.testListElt.appendChild(testSuiteStatus);
  };

  ns.DrawingTestSuiteController.prototype.reset = function () {
    this.domElt = document.createElement('div');
    this.domElt.style.cssText = 'position:absolute;z-index:10000;margin:5px;padding:10px;background:lightgrey';

    this.testListElt = document.createElement('ul');

    this.domElt.appendChild(this.testListElt);

    document.body.appendChild(this.domElt);
  };

  ns.DrawingTestSuiteController.prototype.onTestSuiteLoaded_ = function (response) {
    var testPaths = JSON.parse(response.responseText).tests;
    testPaths = testPaths.map(function (path) {
      return [Constants.DRAWING_TEST_FOLDER, 'tests', path].join('/');
    }.bind(this));
    this.testSuiteRunner = new ns.DrawingTestSuiteRunner(testPaths);
    this.testSuiteRunner.start();
  };

  ns.DrawingTestSuiteController.prototype.onTestCaseEnd_ = function (evt, testPath, success, performance) {
    var testCaseStatus = document.createElement('li');

    testCaseStatus.innerHTML = pskl.utils.Template.replace(
      '[{{path}}] finished : <b style="color:{{color}}">{{status}} ({{performance}})</b>',
      {
        path : this.shortenPath_(testPath),
        status : success ? 'OK' : 'KO',
        color : success ? 'green' : 'red',
        performance: performance.toFixed(2)
      }
    );
    this.testListElt.appendChild(testCaseStatus);
  };

  ns.DrawingTestSuiteController.prototype.onTestSuiteEnd_ = function (evt, status, performance) {
    var elapsed = Date.now() - this.startTime_;
    elapsed = (elapsed / 1000).toFixed(4);

    var testSuiteStatus = document.createElement('li');
    testSuiteStatus.innerHTML = pskl.utils.Template.replace(
      '<b>Test finished : {{status}}</b> ({{elapsed}}s, performance: {{performance}})',
      {
        status : status,
        elapsed : elapsed,
        performance: performance.toFixed(2)
      }
    );
    this.testListElt.appendChild(testSuiteStatus);
  };

  ns.DrawingTestSuiteController.prototype.shortenPath_ = function (path) {
    // keep only the part after the last '/'
    return path.replace(/^.*\/([^\/]+.json$)/, '$1');
  };
})();
