/**
 * @provide pskl.tools.drawing.Eraser
 *
 * @require Constants
 * @require pskl.utils
 */
(function () {
  var ns = $.namespace('pskl.tools.drawing');

  ns.Eraser = function () {
    this.superclass.constructor.call(this);

    this.toolId = 'tool-eraser';
    this.helpText = 'Eraser tool';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.ERASER;
    this.cursorImageOffset = [16, 34];
  };

  pskl.utils.inherit(ns.Eraser, ns.SimplePen);

  /**
   * @override
   */
  ns.Eraser.prototype.getToolColor = function () {
    return Constants.TRANSPARENT_COLOR;
  };
})();
