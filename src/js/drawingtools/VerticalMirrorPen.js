(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.VerticalMirrorPen = function() {
    this.superclass.constructor.call(this);

    this.toolId = "tool-vertical-mirror-pen";
    this.shortHelpText = "Vertical Mirror pen";

    this.helpText = [
      "<div class='tools-tooltip-container'>",
      "Vertical Mirror pen {{shortcut}}<br/>",
      this.getModifierHelpText('ctrl', 'Use horizontal axis'),
      this.getModifierHelpText('shift', 'Use horizontal and vertical axis'),
      "</div>"
    ].join("");
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

    var hasCtrlKey = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
    if (!hasCtrlKey) {
      this.superclass.applyToolAt.call(this, mirroredCol, row, color, frame, overlay);
    }

    if (event.shiftKey || hasCtrlKey) {
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
