(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Flip = function () {
    this.toolId = "tool-flip";
    this.helpText = "Flip tool";
    this.tooltipDescriptors = [];
  };

  pskl.utils.inherit(ns.Flip, ns.Transform);

  ns.Flip.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var clone = frame.clone();
    var w = frame.getWidth();
    var h = frame.getHeight();

    var isVertical = !altKey;
    clone.forEachPixel(function (color, x, y) {
      if (isVertical) {
        x = w-x-1;
      } else {
        y = h-y-1;
      }
      frame.pixels[x][y] = color;
    });
    frame.version++;
  };

})();