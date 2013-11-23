(function () {
  var ns = $.namespace('pskl.utils');

  ns.Math = {
    minmax : function (val, min, max) {
      return Math.max(Math.min(val, max), min);
    }
  };
})();