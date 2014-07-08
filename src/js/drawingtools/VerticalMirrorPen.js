(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.VerticalMirrorPen = function() {
    this.superclass.constructor.call(this);

    this.toolId = "tool-vertical-mirror-pen";
    this.helpText = "Vertical Mirror pen (CTRL for Horizontal, SHIFT for both)";
  };

  pskl.utils.inherit(ns.VerticalMirrorPen, ns.SimplePen);

  ns.VerticalMirrorPen.prototype.backupPreviousPositions_ = function () {
    this.backupPreviousCol = this.previousCol;
    this.backupPreviousRow = this.previousRow;
  };

  ns.VerticalMirrorPen.prototype.restorePreviousPositions_ = function () {
    this.previousCol = this.backupPreviousCol;
    this.previousRow = this.backupPreviousRow;
  };

  /**
   * @override
   */
  ns.VerticalMirrorPen.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    this.superclass.applyToolAt.call(this, col, row, color, frame, overlay);
    this.backupPreviousPositions_();

    var mirroredCol = this.getSymmetricCol_(col, frame);
    var mirroredRow = this.getSymmetricRow_(row, frame);

    if (!event.ctrlKey) {
      this.superclass.applyToolAt.call(this, mirroredCol, row, color, frame, overlay);
    }

    if (event.shiftKey || event.ctrlKey) {
      this.superclass.applyToolAt.call(this, col, mirroredRow, color, frame, overlay);
    }

    if (event.shiftKey) {
      this.superclass.applyToolAt.call(this, mirroredCol, mirroredRow, color, frame, overlay);
    }


    this.restorePreviousPositions_();
  };

  ns.VerticalMirrorPen.prototype.getSymmetricCol_ = function(col, frame) {
    return frame.getWidth() - col - 1;
  };

  ns.VerticalMirrorPen.prototype.getSymmetricRow_ = function(row, frame) {
    return frame.getHeight() - row - 1;
  };
})();
