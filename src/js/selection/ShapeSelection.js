(function () {
  var ns = $.namespace('pskl.selection');

  ns.ShapeSelection = function (pixels) {
    this.pixels = pixels;
  };

  pskl.utils.inherit(ns.ShapeSelection, ns.BaseSelection);
})();
