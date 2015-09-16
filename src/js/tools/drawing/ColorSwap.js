/**
 * @provide pskl.tools.drawing.ColorSwap
 *
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.ColorSwap = function() {
    this.toolId = 'tool-colorswap';

    this.helpText = 'Paint all pixels of the same color';

    this.tooltipDescriptors = [
      {key : 'ctrl', description : 'Apply to all layers'},
      {key : 'shift', description : 'Apply to all frames'}
    ];
  };

  pskl.utils.inherit(ns.ColorSwap, ns.BaseTool);

  /**
   * @override
   */
  ns.ColorSwap.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    if (frame.containsPixel(col, row)) {
      var sampledColor = frame.getPixel(col, row);

      var allLayers = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
      var allFrames = event.shiftKey;

      this.swapColors(sampledColor, this.getToolColor(), allLayers, allFrames);

      $.publish(Events.PISKEL_SAVE_STATE, {
        type : pskl.service.HistoryService.SNAPSHOT
      });
    }
  };

  ns.ColorSwap.prototype.swapColors = function(oldColor, newColor, allLayers, allFrames) {
    var swapPixelColor = function (pixelColor, x, y, frame) {
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
