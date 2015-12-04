(function () {
  var ns = $.namespace('pskl.utils');

  ns.Math = {
    minmax : function (val, min, max) {
      return Math.max(Math.min(val, max), min);
    },

    /**
     * Calculate the distance between {x0, y0} and {x1, y1}
     */
    distance : function (x0, x1, y0, y1) {
      var dx = Math.abs(x1 - x0);
      var dy = Math.abs(y1 - y0);
      return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }
  };
})();
