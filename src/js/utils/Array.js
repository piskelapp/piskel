(function () {
  var ns = $.namespace('pskl.utils');

  ns.Array = {
    find : function (array, filterFn) {
      var match = null;
      array = Array.isArray(array) ? array : [];
      var filtered = array.filter(filterFn);
      if (filtered.length) {
        match = filtered[0];
      }
      return match;
    },

    chunk : function (array, chunks) {
      var chunked = [];

      // We cannot have more chunks than array items.
      chunks = Math.min(chunks, array.length);

      // chunks should be at least 1
      chunks = Math.max(1, chunks);

      var step = Math.round(array.length / chunks);
      for (var i = 0 ; i < chunks ; i++) {
        var isLast = i == chunks - 1;
        var end = isLast ? array.length : (i + 1) * step;
        chunked.push(array.slice(i * step, end));
      }
      return chunked;
    }
  };

})();
