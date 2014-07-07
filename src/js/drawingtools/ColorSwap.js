/**
 * @provide pskl.drawingtools.ColorSwap
 *
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.ColorSwap = function() {
    this.toolId = "tool-colorswap";
    this.helpText = "Color swap";
  };

  pskl.utils.inherit(ns.ColorSwap, ns.BaseTool);

  /**
   * @override
   */
  ns.ColorSwap.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    if (frame.containsPixel(col, row)) {
      var sampledColor = frame.getPixel(col, row);
      this.swapColors(sampledColor, color);

      $.publish(Events.PISKEL_SAVE_STATE, {
        type : pskl.service.HistoryService.SNAPSHOT
      });
    }
  };

  ns.ColorSwap.prototype.swapColors = function(oldColor, newColor) {
    var swapPixelColor = function (pixelColor,x,y,frame) {
      if (pixelColor == oldColor) {
        frame.pixels[x][y] = newColor;
      }
    };
    pskl.app.piskelController.getPiskel().getLayers().forEach(function (l) {
      l.getFrames().forEach(function (f) {
        f.forEachPixel(swapPixelColor);
        f.version++;
      });
    });
  };
})();
