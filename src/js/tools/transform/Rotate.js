(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Rotate = function () {
    this.toolId = "tool-rotate";
    this.helpText = "Rotate tool";
    this.tooltipDescriptors = [];
  };

  pskl.utils.inherit(ns.Rotate, ns.Transform);

  ns.Rotate.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var clone = frame.clone();
    var w = frame.getWidth();
    var h = frame.getHeight();

    var isClockwise = altKey;
    clone.forEachPixel(function (color, x, y) {
      var _x = x, _y = y;
      if (isClockwise) {
        y = x;
        x = w-_y-1;
      } else {
        x = y;
        y = h-_x-1;
      }
      frame.pixels[x][y] = color;
    });
    frame.version++;
  };

})();