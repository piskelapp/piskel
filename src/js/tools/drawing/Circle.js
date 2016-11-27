/**
 * @provide pskl.tools.drawing.Circle
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.Circle = function() {
    ns.ShapeTool.call(this);

    this.toolId = 'tool-circle';
    this.helpText = 'Circle tool';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.CIRCLE;
  };

  pskl.utils.inherit(ns.Circle, ns.ShapeTool);

  /**
   * @override
   */
  ns.Circle.prototype.draw = function (col, row, color, targetFrame, penSize) {
    this.getCirclePixels_(this.startCol, this.startRow, col, row, penSize).forEach(function (point) {
      targetFrame.setPixel(point[0], point[1], color);
    });
  };

  ns.Circle.prototype.getCirclePixels_ = function (x0, y0, x1, y1, penSize) {
    var coords = pskl.PixelUtils.getOrderedRectangleCoordinates(x0, y0, x1, y1);
    var xC = Math.round((coords.x0 + coords.x1) / 2);
    var yC = Math.round((coords.y0 + coords.y1) / 2);

    var rX = coords.x1 - xC;
    var rY = coords.y1 - yC;
    var iX = rX - penSize;
    var iY = rY - penSize;
    if (iX < 0) {
      iX = 0;
    }
    if (iY < 0) {
      iY = 0;
    }

    var pixels = [];

    var x, y, angle, r;
    for (x = 0 ; x <= rX ; x++) {
      for (y = 0 ; y <= rY ; y++) {
        angle = Math.atan(y / x);
        r = Math.sqrt(x * x + y * y);
        if ((rX <= penSize || rY <= penSize ||
          r > iX * iY / Math.sqrt(iY * iY * Math.pow(Math.cos(angle), 2) + iX * iX * Math.pow(Math.sin(angle), 2)) +
          0.5) &&
          r < rX * rY / Math.sqrt(rY * rY * Math.pow(Math.cos(angle), 2) + rX * rX * Math.pow(Math.sin(angle), 2)) +
          0.5) {
          pixels.push([xC + x, yC + y]);
          pixels.push([xC - x, yC + y]);
          pixels.push([xC + x, yC - y]);
          pixels.push([xC - x, yC - y]);
        }
      }
    }

    return pixels;
  };
})();
