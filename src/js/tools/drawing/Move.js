/**
 * @provide pskl.tools.drawing.Move
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.Move = function() {
    this.toolId = ns.Move.TOOL_ID;
    this.helpText = 'Move tool';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.MOVE;

    this.tooltipDescriptors = [];
    if (Constants.ENABLE_MULTIPLE_LAYERS) {
      this.tooltipDescriptors.push({key : 'ctrl', description : 'Apply to all layers'});
    }
    this.tooltipDescriptors.push({key : 'shift', description : 'Apply to all frames'});
    this.tooltipDescriptors.push({key : 'alt', description : 'Wrap canvas borders'});

    // Stroke's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;
  };

  /**
   * The move tool id is used by the ToolController and the BaseSelect and needs to be
   * easliy accessible
   */
  ns.Move.TOOL_ID = 'tool-move';

  pskl.utils.inherit(ns.Move, ns.BaseTool);

  /**
   * @override
   */
  ns.Move.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    this.startCol = col;
    this.startRow = row;
    this.currentFrame = frame;
    this.currentFrameClone = frame.clone();
  };

  ns.Move.prototype.moveToolAt = function(col, row, frame, overlay, event) {
    var colDiff = col - this.startCol;
    var rowDiff = row - this.startRow;
    this.shiftFrame(colDiff, rowDiff, frame, this.currentFrameClone, event);
  };

  ns.Move.prototype.shiftFrame = function (colDiff, rowDiff, frame, reference, event) {
    var color;
    var w = frame.getWidth();
    var h = frame.getHeight();
    for (var col = 0 ; col < w ; col++) {
      for (var row = 0 ; row < h ; row++) {
        var x = col - colDiff;
        var y = row - rowDiff;
        if (event.altKey) {
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
  ns.Move.prototype.releaseToolAt = function(col, row, frame, overlay, event) {
    var colDiff = col - this.startCol;
    var rowDiff = row - this.startRow;

    var ctrlKey = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
    pskl.tools.ToolsHelper.getTargetFrames(ctrlKey, event.shiftKey).forEach(function (f) {
      // for the current frame, the backup clone should be reused as reference
      // the current frame has been modified by the user action already
      var reference = this.currentFrame == f ? this.currentFrameClone : f.clone();
      this.shiftFrame(colDiff, rowDiff, f, reference, event);
    }.bind(this));

    this.raiseSaveStateEvent({
      colDiff : colDiff,
      rowDiff : rowDiff,
      ctrlKey : ctrlKey,
      altKey : event.altKey,
      shiftKey : event.shiftKey
    });
  };

  ns.Move.prototype.replay = function(frame, replayData) {
    var event = {
      shiftKey : replayData.shiftKey,
      altKey : replayData.altKey,
      ctrlKey : replayData.ctrlKey
    };
    pskl.tools.ToolsHelper.getTargetFrames(event.ctrlKey, event.shiftKey).forEach(function (frame) {
      this.shiftFrame(replayData.colDiff, replayData.rowDiff, frame, frame.clone(), event);
    }.bind(this));
  };

  ns.Move.prototype.supportsAlt = function() {
    return true;
  };
})();
