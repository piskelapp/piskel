(function () {
  var ns = $.namespace('pskl.worker.hash');

  ns.Hash = function (str, onSuccess, onStep, onError) {
    this.str = str;

    this.onStep = onStep;
    this.onSuccess = onSuccess;
    this.onError = onError;

    this.worker = pskl.utils.WorkerUtils.createWorker(ns.HashWorker, 'hash');
    this.worker.onmessage = this.onWorkerMessage.bind(this);
  };

  ns.Hash.prototype.process = function () {
    this.worker.postMessage({
      str : this.str
    });
  };

  ns.Hash.prototype.onWorkerMessage = function (event) {
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
