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

    /**
     * Split a provided array in a given amount of chunks.
     * For instance [1,2,3,4] chunked in 2 parts will be [1,2] & [3,4].
     * @param  {Array} array the array to chunk
     * @param  {Number} chunksCount the number of chunks to create
     * @return {Array<Array>} array of arrays containing the items of the original array
     */
    chunk : function (array, chunksCount) {
      var chunks = [];

      // We cannot have more chunks than array items.
      chunksCount = Math.min(chunksCount, array.length);

      // chunksCount should be at least 1
      chunksCount = Math.max(1, chunksCount);

      var step = Math.round(array.length / chunksCount);
      for (var i = 0 ; i < chunksCount ; i++) {
        var isLast = i == chunksCount - 1;
        var end = isLast ? array.length : (i + 1) * step;
        chunks.push(array.slice(i * step, end));
      }
      return chunks;
    }
  };

})();
