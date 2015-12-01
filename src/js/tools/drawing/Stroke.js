/**
 * @provide pskl.tools.drawing.Stroke
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.Stroke = function() {
    this.toolId = 'tool-stroke';
    this.helpText = 'Stroke tool';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.STROKE;
    this.tooltipDescriptors = [
      {key : 'shift', description : 'Hold shift to draw straight lines'}
    ];

    // Stroke's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;
  };

  pskl.utils.inherit(ns.Stroke, ns.BaseTool);

  ns.Stroke.prototype.supportsDynamicPenSize = function() {
    return true;
  };

  /**
   * @override
   */
  ns.Stroke.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    this.startCol = col;
    this.startRow = row;

    // When drawing a stroke we don't change the model instantly, since the
    // user can move his cursor to change the stroke direction and length
    // dynamically. Instead we draw the (preview) stroke in a fake canvas that
    // overlay the drawing canvas.
    // We wait for the releaseToolAt callback to impact both the
    // frame model and canvas rendering.

    // The fake canvas where we will draw the preview of the stroke:
    // Drawing the first point of the stroke in the fake overlay canvas:
    overlay.setPixel(col, row, this.getToolColor());
  };

  ns.Stroke.prototype.moveToolAt = function(col, row, frame, overlay, event) {
    overlay.clear();

    var penSize = pskl.app.penSizeService.getPenSize();
    var isStraight = event.shiftKey;
    var color = this.getToolColor();
    if (color == Constants.TRANSPARENT_COLOR) {
      // When mousemoving the stroke tool, we draw in the canvas overlay above the drawing canvas.
      // If the stroke color is transparent, we won't be
      // able to see it during the movement.
      // We set it to a semi-opaque white during the tool mousemove allowing to see colors below the stroke.
      // When the stroke tool will be released, It will draw a transparent stroke,
      // eg deleting the equivalent of a stroke.
      color = Constants.SELECTION_TRANSPARENT_COLOR;
    }

    this.draw_(col, row, color, overlay, penSize, isStraight);
  };

  /**
   * @override
   */
  ns.Stroke.prototype.releaseToolAt = function(col, row, frame, overlay, event) {
    var penSize = pskl.app.penSizeService.getPenSize();
    var isStraight = event.shiftKey;
    var color = this.getToolColor();

    // The user released the tool to draw a line. We will compute the pixel coordinate, impact
    // the model and draw them in the drawing canvas (not the fake overlay anymore)
    this.draw_(col, row, color, frame, penSize, isStraight);

    // For now, we are done with the stroke tool and don't need an overlay anymore:
    overlay.clear();

    this.raiseSaveStateEvent({
      col : col,
      row : row,
      startCol : this.startCol,
      startRow : this.startRow,
      color : color,
      penSize : penSize,
      isStraight : isStraight
    });
  };

  ns.Stroke.prototype.draw_ = function (col, row, color, targetFrame, penSize, isStraight) {
    if (isStraight) {
      var coords = this.getStraightLineCoordinates_(col, row);
      col = coords.col;
      row = coords.row;
    }

    var linePixels = this.getLinePixels_(this.startCol, col, this.startRow, row);
    pskl.PixelUtils.resizePixels(linePixels, penSize).forEach(function (point) {
      targetFrame.setPixel(point[0], point[1], color);
    });
  };

  ns.Stroke.prototype.replay = function(frame, replayData) {
    this.startCol = replayData.startCol;
    this.startRow = replayData.startRow;
    this.draw_(replayData.col, replayData.row, replayData.color, frame, replayData.penSize, replayData.isStraight);
  };

  /**
   * Convert col, row to be on the nearest straight line or 45 degrees diagonal.
   */
  ns.Stroke.prototype.getStraightLineCoordinates_ = function(col, row) {
    // coordinates translated using startCol, startRow as origin
    var tCol = col - this.startCol;
    var tRow = this.startRow - row;

    var dist = Math.sqrt(Math.pow(tCol, 2) + Math.pow(tRow, 2));

    var axisDistance = Math.round(dist);
    var diagDistance = Math.round(dist / Math.sqrt(2));

    var PI8 = Math.PI / 8;
    var angle = Math.atan2(tRow, tCol);
    if (angle < PI8 && angle >= -PI8) {
      row = this.startRow;
      col = this.startCol + axisDistance;
    } else if (angle >= PI8 && angle < 3 * PI8) {
      row = this.startRow - diagDistance;
      col = this.startCol + diagDistance;
    } else if (angle >= 3 * PI8 && angle < 5 * PI8) {
      row = this.startRow - axisDistance;
      col = this.startCol;
    } else if (angle >= 5 * PI8 && angle < 7 * PI8) {
      row = this.startRow - diagDistance;
      col = this.startCol - diagDistance;
    } else if (angle >= 7 * PI8 || angle < -7 * PI8) {
      row = this.startRow;
      col = this.startCol - axisDistance;
    } else if (angle >= -7 * PI8 && angle < -5 * PI8) {
      row = this.startRow + diagDistance;
      col = this.startCol - diagDistance;
    } else if (angle >= -5 * PI8 && angle < -3 * PI8) {
      row = this.startRow + axisDistance;
      col = this.startCol;
    } else if (angle >= -3 * PI8 && angle < -PI8) {
      row = this.startRow + diagDistance;
      col = this.startCol + diagDistance;
    }

    return {
      col : col,
      row : row
    };
  };
})();
