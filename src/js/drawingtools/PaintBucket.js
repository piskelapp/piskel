/**
 * @provide pskl.drawingtools.PaintBucket
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.PaintBucket = function() {
    this.toolId = "tool-paint-bucket";
    this.helpText = "Paint bucket tool";
  };

  pskl.utils.inherit(ns.PaintBucket, ns.BaseTool);

  /**
   * @override
   */
  ns.PaintBucket.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    pskl.PixelUtils.paintSimilarConnectedPixelsFromFrame(frame, col, row, color);

    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'TOOL',
      tool : this,
      replay : {
        col : col,
        row : row,
        color : color
      }
    });
  };

  ns.PaintBucket.prototype.replay = function (frame, replayData) {
    pskl.PixelUtils.paintSimilarConnectedPixelsFromFrame(frame, replayData.col, replayData.row, replayData.color);
  };
})();













