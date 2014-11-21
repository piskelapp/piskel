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
    }
  };

})();