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
    var pixels = [];
    var xC = Math.round((coords.x0 + coords.x1) / 2);
    var yC = Math.round((coords.y0 + coords.y1) / 2);
    var evenX = (coords.x0 + coords.x1) % 2;
    var evenY = (coords.y0 + coords.y1) % 2;
    var rX = coords.x1 - xC;
    var rY = coords.y1 - yC;
    var x, y, angle, r;

    if (penSize == 1) {
      for (x = coords.x0 ; x <= xC ; x++) {
        angle = Math.acos((x - xC) / rX);
        y = Math.round(rY * Math.sin(angle) + yC);
        pixels.push([x - evenX, y]);
        pixels.push([x - evenX, 2 * yC - y - evenY]);
        pixels.push([2 * xC - x, y]);
        pixels.push([2 * xC - x, 2 * yC - y - evenY]);
      }
      for (y = coords.y0 ; y <= yC ; y++) {
        angle = Math.asin((y - yC) / rY);
        x = Math.round(rX * Math.cos(angle) + xC);
        pixels.push([x, y - evenY]);
        pixels.push([2 * xC - x - evenX, y - evenY]);
        pixels.push([x, 2 * yC - y]);
        pixels.push([2 * xC - x - evenX, 2 * yC - y]);
      }
      return pixels;
    }

    var iX = rX - penSize;
    var iY = rY - penSize;
    if (iX < 0) {
      iX = 0;
    }
    if (iY < 0) {
      iY = 0;
    }

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
          pixels.push([xC - x - evenX, yC + y]);
          pixels.push([xC + x, yC - y - evenY]);
          pixels.push([xC - x - evenX, yC - y - evenY]);
        }
      }
    }

    return pixels;
  };
})();
