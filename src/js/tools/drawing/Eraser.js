/**
 * @provide pskl.tools.drawing.Eraser
 *
 * @require Constants
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.tools.drawing");

  ns.Eraser = function() {
    this.superclass.constructor.call(this);
    this.toolId = "tool-eraser";
    this.helpText = "Eraser tool";
  };

  pskl.utils.inherit(ns.Eraser, ns.SimplePen);

  /**
   * @override
   */
  ns.Eraser.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    this.superclass.applyToolAt.call(this, col, row, Constants.TRANSPARENT_COLOR, frame, overlay, event);
  };
  /**
   * @override
   */
  ns.Eraser.prototype.releaseToolAt = function(col, row, color, frame, overlay, event) {
    this.superclass.releaseToolAt.call(this, col, row, Constants.TRANSPARENT_COLOR, frame, overlay, event);
  };
})();