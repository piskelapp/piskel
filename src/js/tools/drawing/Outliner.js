/**
 * @provide pskl.tools.drawing.Outliner
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.Outliner = function() {
    this.toolId = 'tool-outliner';
    this.helpText = 'Outliner tool';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.OUTLINER;
    this.tooltipDescriptors = [
      {key : 'ctrl', description : 'Fill corners'}
    ];
  };

  pskl.utils.inherit(ns.Outliner, ns.BaseTool);

  /**
   * @override
   */
  ns.Outliner.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    var fillCorners = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
    var color = this.getToolColor();
    pskl.PixelUtils.outlineSimilarConnectedPixelsFromFrame(frame, col, row, color, fillCorners);

    this.raiseSaveStateEvent({
      col : col,
      row : row,
      color : color,
      fillCorners: fillCorners
    });
  };

  ns.Outliner.prototype.replay = function (frame, replayData) {
    pskl.PixelUtils.outlineSimilarConnectedPixelsFromFrame(
      frame,
      replayData.col,
      replayData.row,
      replayData.color,
      replayData.fillCorners);
  };
})();
