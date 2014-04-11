(function () {
  var ns = $.namespace('pskl.drawingtools');
  /**
   * Abstract shape tool class, parent to all shape tools (rectangle, circle).
   * Shape tools should override only the draw_ method
   */
  ns.ShapeTool = function() {
    // Shapes's first point coordinates (set in applyToolAt)
    this.startCol = null;
    this.startRow = null;
  };

  pskl.utils.inherit(ns.ShapeTool, ns.BaseTool);

  /**
   * @override
   */
  ns.ShapeTool.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    $.publish(Events.DRAG_START, [col, row]);
    this.startCol = col;
    this.startRow = row;

    // Drawing the first point of the rectangle in the fake overlay canvas:
    overlay.setPixel(col, row, color);
  };

  ns.ShapeTool.prototype.moveToolAt = function(col, row, color, frame, overlay, event) {
    var coords = this.getCoordinates_(col, row, event);
    $.publish(Events.CURSOR_MOVED, [coords.col, coords.row]);

    overlay.clear();
    if(color == Constants.TRANSPARENT_COLOR) {
      color = Constants.SELECTION_TRANSPARENT_COLOR;
    }

    // draw in overlay
    this.draw_(coords.col, coords.row, color, overlay);
  };

  /**
   * @override
   */
  ns.ShapeTool.prototype.releaseToolAt = function(col, row, color, frame, overlay, event) {
    overlay.clear();
    if (event.shiftKey) {
      var scaled = this.getScaledCoordinates_(col, row);
      col = scaled.col;
      row = scaled.row;
    }
    var coords = this.getCoordinates_(col, row, event);
    this.draw_(coords.col, coords.row, color, frame);
    $.publish(Events.DRAG_END, [col, row]);
  };

  /**
   * Transform the current coordinates based on the original event
   * @param {Number} col current col/x coordinate in the frame
   * @param {Number} row current row/y coordinate in the frame
   * @param {Event} event current event (can be mousemove, mouseup ...)
   * @return {Object} {row : Number, col : Number}
   */
  ns.ShapeTool.prototype.getCoordinates_ = function(col, row, event) {
    if (event.shiftKey) {
      return this.getScaledCoordinates_(col, row);
    } else {
      return {col : col, row : row};
    }
  };

  /**
   * Transform the coordinates to preserve a square 1:1 ratio from the origin of the shape
   * @param {Number} col current col/x coordinate in the frame
   * @param {Number} row current row/y coordinate in the frame
   * @return {Object} {row : Number, col : Number}
   */
  ns.ShapeTool.prototype.getScaledCoordinates_ = function(col, row) {
    var sign;
    if (Math.abs(this.startCol - col) > Math.abs(this.startRow - row)) {
      sign = row > this.startRow ? 1 : -1;
      row = this.startRow + (sign * Math.abs(this.startCol - col));
    } else {
      sign = col > this.startCol ? 1 : -1;
      col = this.startCol + (sign * Math.abs(this.startRow - row));
    }
    return {
      col : col,
      row : row
    };
  };

  ns.ShapeTool.prototype.draw_ = Constants.ABSTRACT_FUNCTION;

})();