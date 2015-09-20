(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.VerticalMirrorPen = function() {
    this.superclass.constructor.call(this);

    this.toolId = 'tool-vertical-mirror-pen';
    this.helpText = 'Vertical Mirror pen';

    this.tooltipDescriptors = [
      {key : 'ctrl', description : 'Use horizontal axis'},
      {key : 'shift', description : 'Use horizontal and vertical axis'}
    ];
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
  ns.VerticalMirrorPen.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    var color = this.getToolColor();
    this.draw(color, col, row, frame, overlay);

    this.backupPreviousPositions_();

    var mirroredCol = this.getSymmetricCol_(col, frame);
    var mirroredRow = this.getSymmetricRow_(row, frame);

    var hasCtrlKey = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
    if (!hasCtrlKey) {
      this.draw(color, mirroredCol, row, frame, overlay);
    }

    if (event.shiftKey || hasCtrlKey) {
      this.draw(color, col, mirroredRow, frame, overlay);
    }

    if (event.shiftKey) {
      this.draw(color, mirroredCol, mirroredRow, frame, overlay);
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
