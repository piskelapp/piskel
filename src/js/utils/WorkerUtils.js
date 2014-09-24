(function () {
  var ns = $.namespace('pskl.utils');

  var workers = {};

  ns.WorkerUtils = {
    createWorker : function (worker, workerId) {
      if (!workers[workerId]) {
        var typedArray = [(worker+"").replace(/function \(\)\s?\{/,"").replace(/\}[^}]*$/, "")];
        var blob = new Blob(typedArray, {type: "application/javascript"}); // pass a useful mime type here
        workers[workerId] = window.URL.createObjectURL(blob);
      }

      return new Worker(workers[workerId]);
    }
  };
})();