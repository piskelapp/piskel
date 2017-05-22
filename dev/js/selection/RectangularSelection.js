(function () {
  var ns = $.namespace('pskl.selection');

  ns.RectangularSelection = function (x0, y0, x1, y1) {
    this.pixels = pskl.PixelUtils.getRectanglePixels(x0, y0, x1, y1);
  };

  pskl.utils.inherit(ns.RectangularSelection, ns.BaseSelection);
})();
