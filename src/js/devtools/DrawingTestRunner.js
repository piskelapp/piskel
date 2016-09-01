(function () {
  var ns = $.namespace('pskl.devtools');

  ns.DrawingTestRunner = function (testName) {
    this.testName = testName;
    $.subscribe(Events.TEST_RECORD_END, this.onTestRecordEnd_.bind(this));
  };

  ns.DrawingTestRunner.prototype.start = function () {
    pskl.utils.Xhr.get(this.testName, function (response) {
      var res = response.responseText;
      var recordPlayer = new ns.DrawingTestPlayer(JSON.parse(res));
      recordPlayer.start();
    }.bind(this));
  };

  ns.DrawingTestRunner.prototype.onTestRecordEnd_ = function (evt, success) {
    var testResult = document.createElement('div');
    testResult.id = 'drawing-test-result';
    testResult.setAttribute('data-test-name', this.testName);
    testResult.innerHTML = success ? 'OK' : 'KO';
    document.body.appendChild(testResult);
  };
})();
