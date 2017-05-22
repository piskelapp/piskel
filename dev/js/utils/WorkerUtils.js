(function () {
  var ns = $.namespace('pskl.utils');

  var workers = {};

  ns.WorkerUtils = {
    createWorker : function (worker, workerId) {
      if (!workers[workerId]) {
        workers[workerId] = ns.WorkerUtils.createWorkerURL(worker);
      }

      return new Worker(workers[workerId]);
    },

    createWorkerURL : function (worker) {
      // remove "function () {" at the start of the worker string and the last "}" before the end
      var typedArray = [(worker + '').replace(/function\s*\(\)\s*\{/, '').replace(/\}[^}]*$/, '')];
      var blob = new Blob(typedArray, {type: 'application/javascript'});
      return window.URL.createObjectURL(blob);
    }
  };
})();
