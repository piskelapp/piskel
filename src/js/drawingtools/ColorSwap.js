/**
 * @provide pskl.drawingtools.ColorSwap
 *
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.ColorSwap = function() {
    this.toolId = "tool-colorswap";

    this.shortHelpText = "Paint all";
    this.helpText = [
      "<div class='tools-tooltip-container'>",
      "Paint all pixels of the same color {{shortcut}}<br/>",
      this.getModifierHelpText('ctrl', 'Apply to all layers'),
      this.getModifierHelpText('shift', 'Apply to all frames'),
      "</div>"
    ].join("");
  };

  pskl.utils.inherit(ns.ColorSwap, ns.BaseTool);

  /**
   * @override
   */
  ns.ColorSwap.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    if (frame.containsPixel(col, row)) {
      var sampledColor = frame.getPixel(col, row);

      var allLayers = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
      var allFrames = event.shiftKey;

      this.swapColors(sampledColor, color, allLayers, allFrames);

      $.publish(Events.PISKEL_SAVE_STATE, {
        type : pskl.service.HistoryService.SNAPSHOT
      });
    }
  };

  ns.ColorSwap.prototype.swapColors = function(oldColor, newColor, allLayers, allFrames) {
    var swapPixelColor = function (pixelColor,x,y,frame) {
      if (pixelColor == oldColor) {
        frame.pixels[x][y] = newColor;
      }
    };
    var currentLayer = pskl.app.piskelController.getCurrentLayer();
    var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
    pskl.app.piskelController.getPiskel().getLayers().forEach(function (l) {
      if (allLayers || l === currentLayer) {
        l.getFrames().forEach(function (f, frameIndex) {
          if (allFrames || frameIndex === currentFrameIndex) {
            f.forEachPixel(swapPixelColor);
            f.version++;
          }
        });
      }
    });
  };
})();
