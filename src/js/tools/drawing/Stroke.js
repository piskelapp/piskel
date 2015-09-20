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

    // Stroke's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;
  };

  pskl.utils.inherit(ns.Stroke, ns.BaseTool);

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

    // When the user moussemove (before releasing), we dynamically compute the
    // pixel to draw the line and draw this line in the overlay canvas:
    var strokePoints = this.getLinePixels_(this.startCol, col, this.startRow, row);

    // Drawing current stroke:
    var color = this.getToolColor();
    for (var i = 0; i < strokePoints.length; i++) {

      if (color == Constants.TRANSPARENT_COLOR) {
        // When mousemoving the stroke tool, we draw in the canvas overlay above the drawing canvas.
        // If the stroke color is transparent, we won't be
        // able to see it during the movement.
        // We set it to a semi-opaque white during the tool mousemove allowing to see colors below the stroke.
        // When the stroke tool will be released, It will draw a transparent stroke,
        // eg deleting the equivalent of a stroke.
        color = Constants.SELECTION_TRANSPARENT_COLOR;
      }
      overlay.setPixel(strokePoints[i].col, strokePoints[i].row, color);
    }
  };

  /**
   * @override
   */
  ns.Stroke.prototype.releaseToolAt = function(col, row, frame, overlay, event) {
    var color = this.getToolColor();
    // The user released the tool to draw a line. We will compute the pixel coordinate, impact
    // the model and draw them in the drawing canvas (not the fake overlay anymore)
    var strokePoints = this.getLinePixels_(this.startCol, col, this.startRow, row);
    for (var i = 0; i < strokePoints.length; i++) {
      // Change model:
      frame.setPixel(strokePoints[i].col, strokePoints[i].row, color);
    }
    // For now, we are done with the stroke tool and don't need an overlay anymore:
    overlay.clear();

    this.raiseSaveStateEvent({
      pixels : strokePoints,
      color : color
    });
  };

  ns.Stroke.prototype.replay = function(frame, replayData) {
    replayData.pixels.forEach(function (pixel) {
      frame.setPixel(pixel.col, pixel.row, replayData.color);
    });
  };
})();
