/**
 * @provide pskl.tools.drawing.PaintBucket
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.PaintBucket = function() {
    this.toolId = 'tool-paint-bucket';
    this.helpText = 'Paint bucket tool';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.PAINT_BUCKET;

    this.tooltipDescriptors = [{ key: 'ctrl', description: 'Source only current layer' }];
  };

  pskl.utils.inherit(ns.PaintBucket, ns.BaseTool);

  /**
   * @override
   */
  ns.PaintBucket.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    var color = this.getToolColor();
    
    var sourceOnlyCurrentLayer = pskl.utils.UserAgent.isMac ? event.metaKey : event.ctrlKey;
    var sourceFrame = frame;
    if (!sourceOnlyCurrentLayer) {
      var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
      sourceFrame = pskl.utils.LayerUtils.mergeFrameAt(pskl.app.piskelController.getLayers(), currentFrameIndex);
    };

    pskl.PixelUtils.paintSimilarConnectedPixelsFromFrame(sourceFrame, frame, col, row, color);

    this.raiseSaveStateEvent({
      col : col,
      row : row,
      color : color
    });
  };

  ns.PaintBucket.prototype.replay = function (frame, replayData) {
    pskl.PixelUtils.paintSimilarConnectedPixelsFromFrame(frame, frame, replayData.col, replayData.row, replayData.color);
  };
})();
