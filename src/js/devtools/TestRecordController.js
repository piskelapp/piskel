(function () {
  var ns = $.namespace('pskl.devtools');

  ns.TestRecordController = function (testRecorder) {
    this.testRecorder = testRecorder;
    $.subscribe(Events.TEST_RECORD_END, this.onTestRecordEnd_.bind(this));
  };

  ns.TestRecordController.prototype.init  = function () {
    var fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.addEventListener('change', this.onFileInputChange_.bind(this));
    fileInput.style.display = 'none';

    var container = document.createElement('div');
    container.style.cssText = 'position:absolute;z-index:10000;margin:5px;padding:10px;background:lightgrey';
    document.body.appendChild(container);

    var loadInput = document.createElement('button');
    loadInput.innerHTML = 'Load Test ...';
    loadInput.addEventListener('click', this.onLoadInputClick_.bind(this));

    var startInput = document.createElement('button');
    startInput.innerHTML = 'Start record';
    startInput.addEventListener('click', this.onStartInputClick_.bind(this));

    var stopInput = document.createElement('button');
    stopInput.innerHTML = 'Stop record';
    stopInput.addEventListener('click', this.onStopInputClick_.bind(this));
    stopInput.setAttribute('disabled', 'disabled');

    this.container = container;
    this.fileInput = this.container.appendChild(fileInput);
    this.loadInput = this.container.appendChild(loadInput);
    this.startInput = this.container.appendChild(startInput);
    this.stopInput = this.container.appendChild(stopInput);
  };

  ns.TestRecordController.prototype.onLoadInputClick_  = function () {
    this.fileInput.click();
  };

  ns.TestRecordController.prototype.onFileInputChange_  = function () {
    var files = this.fileInput.files;
    if (files.length == 1) {
      var file = files[0];
      pskl.utils.FileUtils.readFile(file, function (content) {
        var testRecord = JSON.parse(window.atob(content.replace(/data\:.*?\;base64\,/, '')));
        var testPlayer = new ns.DrawingTestPlayer(testRecord);
        testPlayer.start();
      }.bind(this));
    }
  };

  ns.TestRecordController.prototype.onStartInputClick_  = function () {
    this.testRecorder.startRecord();
    this.startInput.setAttribute('disabled', 'disabled');
    this.stopInput.removeAttribute('disabled');
  };

  ns.TestRecordController.prototype.onStopInputClick_  = function () {
    var testRecord = this.testRecorder.stopRecord();

    pskl.utils.BlobUtils.stringToBlob(testRecord, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, 'record_piskel.json');
    }.bind(this), 'application/json');

    this.startInput.removeAttribute('disabled');
    this.stopInput.setAttribute('disabled', 'disabled');
  };

  ns.TestRecordController.prototype.onTestRecordEnd_  = function (evt, success) {
    window.alert('Test finished : ' + (success ? 'success' : 'failed'));
  };

})();
