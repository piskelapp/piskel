(function () {
  var ns = $.namespace('pskl.devtools');

  ns.DrawingTestRunner = function (testName) {
    this.testName = testName;
    $.subscribe(Events.TEST_RECORD_END, this.onTestRecordEnd_.bind(this));
  };

  ns.DrawingTestRunner.prototype.start = function () {
    var testName = this.testName;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', testName, true);

    xhr.onload = function(e) {
      if (this.status == 200) {
        var recordPlayer = new ns.TestRecordPlayer(JSON.parse(this.responseText));
        recordPlayer.start();
      } else {
        this.onerror(e);
      }
    };
    xhr.onerror = function(e) {
      console.error('Could not load file : ' + testName);
    };
    xhr.send();
  };

  ns.DrawingTestRunner.prototype.onTestRecordEnd_ = function (evt, success, png) {
    var testResult = document.createElement('div');
    testResult.id = 'drawing-test-result';
    testResult.setAttribute('data-test-name', this.testName);
    // pskl.app.paletteController.setPrimaryColor('rgba(0,255,0,0)');
    testResult.innerHTML = success ? 'OK' : ('KO:'+png);
    document.body.appendChild(testResult);
  };

})();