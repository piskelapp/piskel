/**
 * @provide pskl.tools.drawing.BaseTool
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.BaseTool = function() {
    pskl.tool.Tool.call(this);
    this.toolId = 'tool-base';
  };

  pskl.utils.inherit(ns.BaseTool, pskl.tools.Tool);

  ns.BaseTool.prototype.applyToolAt = function (col, row, frame, overlay, event) {};

  ns.BaseTool.prototype.moveToolAt = function (col, row, frame, overlay, event) {};

  ns.BaseTool.prototype.replay = Constants.ABSTRACT_FUNCTION;

  ns.BaseTool.prototype.supportsDynamicPenSize = function() {
    return false;
  };

  ns.BaseTool.prototype.getToolColor = function() {
    if (pskl.app.mouseStateService.isRightButtonPressed()) {
      return pskl.app.selectedColorsService.getSecondaryColor();
    }
    return pskl.app.selectedColorsService.getPrimaryColor();
  };

  ns.BaseTool.prototype.moveUnactiveToolAt = function (col, row, frame, overlay, event) {
    if (overlay.containsPixel(col, row)) {
      this.updateHighlightedPixel(frame, overlay, col, row);
    } else {
      this.hideHighlightedPixel(overlay);
    }
  };

  ns.BaseTool.prototype.updateHighlightedPixel = function (frame, overlay, col, row) {
    if (!isNaN(this.highlightedPixelCol) &&
      !isNaN(this.highlightedPixelRow) &&
      (this.highlightedPixelRow != row ||
        this.highlightedPixelCol != col)) {

      // Clean the previously highlighted pixel:
      overlay.clear();
    }

    var frameColor = frame.getPixel(col, row);
    var highlightColor = this.getHighlightColor_(frameColor);
    var size = this.supportsDynamicPenSize() ? pskl.app.penSizeService.getPenSize() : 1;
    pskl.PixelUtils.resizePixel(col, row, size).forEach(function (point) {
      overlay.setPixel(point[0], point[1], highlightColor);
    });

    this.highlightedPixelCol = col;
    this.highlightedPixelRow = row;
  };

  ns.BaseTool.prototype.getHighlightColor_ = function (frameColor) {
    if (!frameColor) {
      return Constants.TOOL_HIGHLIGHT_COLOR_DARK;
    }

    var luminance = window.tinycolor(frameColor).toHsl().l;
    if (luminance > 0.5) {
      return Constants.TOOL_HIGHLIGHT_COLOR_DARK;
    } else {
      return Constants.TOOL_HIGHLIGHT_COLOR_LIGHT;
    }
  };

  ns.BaseTool.prototype.hideHighlightedPixel = function (overlay) {
    if (this.highlightedPixelRow !== null && this.highlightedPixelCol !== null) {
      overlay.clear();
      this.highlightedPixelRow = null;
      this.highlightedPixelCol = null;
    }
  };

  ns.BaseTool.prototype.releaseToolAt = function (col, row, frame, overlay, event) {};

  /**
   * Bresenham line algorithm: Get an array of pixels from
   * start and end coordinates.
   *
   * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
   * http://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
   *
   * @private
   */
  ns.BaseTool.prototype.getLinePixels_ = function (x0, x1, y0, y1) {
    x1 = pskl.utils.normalize(x1, 0);
    y1 = pskl.utils.normalize(y1, 0);

    var pixels = [];
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);

    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;
    while (true) {
      // Do what you need to for this
      pixels.push({'col': x0, 'row': y0});

      if ((x0 == x1) && (y0 == y1)) {
        break;
      }

      var e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0  += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0  += sy;
      }
    }

    return pixels;
  };

  var dist = function (x0, x1, y0, y1) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  };

  var MAX_STEP = 5;
  ns.BaseTool.prototype.getUniformLinePixels_ = function (x0, x1, y0, y1) {
    var pixels = [];

    x1 = pskl.utils.normalize(x1, 0);
    y1 = pskl.utils.normalize(y1, 0);

    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);

    var ratio = Math.max(dx, dy) / Math.min(dx, dy);
    // in pixel art, lines should use uniform number of pixels for each step
    var pixelStep = Math.round(ratio);
    // invalid step, bail out
    if (pixelStep === 0 || isNaN(pixelStep)) {
      return pixels;
    }
    // the tool should make it easy to draw straight lines
    if (pixelStep > MAX_STEP && pixelStep < MAX_STEP * 2) {
      pixelStep = MAX_STEP;
    } else if (pixelStep >= MAX_STEP * 2) {
      pixelStep = Infinity;
    }

    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;

    var x = x0;
    var y = y0;
    var maxDistance = dist(x0, x1, y0, y1);

    var i = 0;
    while (true) {
      i++;

      pixels.push({'col': x, 'row': y});
      if (dist(x0, x, y0, y) >= maxDistance) {
        break;
      }

      var isAtStep = i % pixelStep === 0;
      if (dx >= dy || isAtStep) {
        x += sx;
      }
      if (dy >= dx || isAtStep) {
        y += sy;
      }
    }

    return pixels;
  };
})();
