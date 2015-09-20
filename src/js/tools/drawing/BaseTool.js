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
    overlay.setPixel(col, row, this.getHighlightColor_(frameColor));

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
      try {
        overlay.setPixel(this.highlightedPixelCol, this.highlightedPixelRow, Constants.TRANSPARENT_COLOR);
      } catch (e) {
        window.console.warn('ns.BaseTool.prototype.hideHighlightedPixel failed');
      }
      this.highlightedPixelRow = null;
      this.highlightedPixelCol = null;
    }
  };

  ns.BaseTool.prototype.raiseSaveStateEvent = function (replayData) {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.REPLAY,
      scope : this,
      replay : replayData
    });
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
})();
