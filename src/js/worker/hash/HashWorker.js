(function () {
  var ns = $.namespace('pskl.worker.hash');

  ns.HashWorker = function () {
    var hashCode = function(str) {
      var hash = 0;
      if (str.length !== 0) {
        for (var i = 0, l = str.length; i < l; i++) {
          var chr = str.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
      }
      return hash;
    };

    this.onmessage = function(event) {
      try {
        var data = event.data;
        var str = data.str;
        var hash = hashCode(str);
        this.postMessage({
          type : 'SUCCESS',
          hash : hash
        });
      } catch (e) {
        this.postMessage({
          type : 'ERROR',
          message : e.message
        });
      }
    };
  };
})();
