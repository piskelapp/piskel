/**
 * @provide pskl.tools.drawing.Move
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.tools.drawing");

  ns.Move = function() {
    this.toolId = ns.Move.TOOL_ID;
    this.helpText = "Move tool";

    // Stroke's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;
  };

  ns.Move.TOOL_ID = "tool-move";

  pskl.utils.inherit(ns.Move, ns.BaseTool);

  /**
   * @override
   */
  ns.Move.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    this.startCol = col;
    this.startRow = row;
    this.frameClone = frame.clone();
  };

  ns.Move.prototype.moveToolAt = function(col, row, color, frame, overlay, event) {
    var colDiff = col - this.startCol, rowDiff = row - this.startRow;
    this.shiftFrame(colDiff, rowDiff, frame, this.frameClone, event);
  };

  ns.Move.prototype.shiftFrame = function (colDiff, rowDiff, frame, reference, event) {
    var color;
    var w = frame.getWidth();
    var h = frame.getHeight();
    for (var col = 0 ; col < w ; col++) {
      for (var row = 0 ; row < h ; row++) {
        var x = col - colDiff;
        var y = row - rowDiff;
        if (event.shiftKey) {
          x = (x + w) % w;
          y = (y + h) % h;
        }
        if (reference.containsPixel(x, y)) {
          color = reference.getPixel(x, y);
        } else {
          color = Constants.TRANSPARENT_COLOR;
        }
        frame.setPixel(col, row, color);
      }
    }
  };

  /**
   * @override
   */
  ns.Move.prototype.releaseToolAt = function(col, row, color, frame, overlay, event) {
    this.moveToolAt(col, row, color, frame, overlay, event);

    this.raiseSaveStateEvent({
      colDiff : col - this.startCol,
      rowDiff : row - this.startRow,
      shiftKey : event.shiftKey
    });
  };

  ns.Move.prototype.replay = function(frame, replayData) {
    var event = {
      shiftKey : replayData.shiftKey
    };
    this.shiftFrame(replayData.colDiff, replayData.rowDiff, frame, frame.clone(), event);
  };
})();
