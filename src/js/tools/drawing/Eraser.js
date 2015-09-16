/**
 * @provide pskl.tools.drawing.Eraser
 *
 * @require Constants
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.Eraser = function() {
    this.superclass.constructor.call(this);
    this.toolId = 'tool-eraser';
    this.helpText = 'Eraser tool';
  };

  pskl.utils.inherit(ns.Eraser, ns.SimplePen);

  /**
   * @override
   */
  ns.Eraser.prototype.getToolColor = function() {
    return Constants.TRANSPARENT_COLOR;
  };
})();
