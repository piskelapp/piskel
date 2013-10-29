/**
 * @provide pskl.drawingtools.Circle
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.Circle = function() {
    this.toolId = "tool-circle";
    this.helpText = "Circle tool";

    // Circle's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;
  };

  pskl.utils.inherit(ns.Circle, ns.BaseTool);

  /**
   * @override
   */
  ns.Circle.prototype.applyToolAt = function(col, row, color, frame, overlay) {
    this.startCol = col;
    this.startRow = row;

    // Drawing the first point of the rectangle in the fake overlay canvas:
    overlay.setPixel(col, row, color);
  };

  ns.Circle.prototype.moveToolAt = function(col, row, color, frame, overlay) {
    overlay.clear();
    if(color == Constants.TRANSPARENT_COLOR) {
      color = Constants.SELECTION_TRANSPARENT_COLOR;
    }

    // draw in overlay
    this.drawCircle_(col, row, color, overlay);
  };

  /**
   * @override
   */
  ns.Circle.prototype.releaseToolAt = function(col, row, color, frame, overlay) {
    overlay.clear();
    if(frame.containsPixel(col, row)) { // cancel if outside of canvas
      // draw in frame to finalize
      this.drawCircle_(col, row, color, frame);
    }
  };

  ns.Circle.prototype.drawCircle_ = function (col, row, color, targetFrame) {
    var circlePoints = this.getCirclePixels_(this.startCol, this.startRow, col, row);
    for(var i = 0; i< circlePoints.length; i++) {
      // Change model:
      targetFrame.setPixel(circlePoints[i].col, circlePoints[i].row, color);
    }
  };

  ns.Circle.prototype.getCirclePixels_ = function (x0, y0, x1, y1) {
    var coords = pskl.PixelUtils.getOrderedRectangleCoordinates(x0, y0, x1, y1);
    var xC = (coords.x0 + coords.x1)/2;
    var yC = (coords.y0 + coords.y1)/2;

    var rX = coords.x1 - xC;
    var rY = coords.y1 - yC;

    var pixels = [];
    var x, y, angle;
    for (x = coords.x0 ; x < coords.x1 ; x++) {
      angle = Math.acos((x - xC)/rX);
      y = Math.round(rY * Math.sin(angle) + yC);
      pixels.push({"col": x, "row": y});
      pixels.push({"col": 2*xC - x, "row": 2*yC - y});
    }

    for (y = coords.y0 ; y < coords.y1 ; y++) {
      angle = Math.asin((y - yC)/rY);
      x = Math.round(rX * Math.cos(angle) + xC);
      pixels.push({"col": x, "row": y});
      pixels.push({"col": 2*xC - x, "row": 2*yC - y});
    }
    return pixels;
  };
})();
