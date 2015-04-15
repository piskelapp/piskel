(function () {
  var ns = $.namespace('pskl.worker.framecolors');

  ns.FrameColors = function (frame, onSuccess, onStep, onError) {
    this.serializedFrame = JSON.stringify(frame.pixels);

    this.onStep = onStep;
    this.onSuccess = onSuccess;
    this.onError = onError;

    this.worker = pskl.utils.WorkerUtils.createWorker(ns.FrameColorsWorker, 'frame-colors');
    this.worker.onmessage = this.onWorkerMessage.bind(this);
  };

  ns.FrameColors.prototype.process = function () {
    this.worker.postMessage({
      serializedFrame : this.serializedFrame
    });
  };

  ns.FrameColors.prototype.onWorkerMessage = function (event) {
    if (event.data.type === 'STEP') {
      this.onStep(event);
    } else if (event.data.type === 'SUCCESS') {
      this.onSuccess(event);
      this.worker.terminate();
    } else if (event.data.type === 'ERROR') {
      this.onError(event);
      this.worker.terminate();
    }
  };
})();
