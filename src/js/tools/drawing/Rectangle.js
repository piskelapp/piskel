/**
 * @provide pskl.tools.drawing.Rectangle
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.Rectangle = function() {
    ns.ShapeTool.call(this);

    this.toolId = 'tool-rectangle';
    this.helpText = 'Rectangle tool';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.RECTANGLE;
  };

  pskl.utils.inherit(ns.Rectangle, ns.ShapeTool);

  /**
   * @override
   */
  ns.Rectangle.prototype.draw = function (col, row, color, targetFrame, penSize) {
    var strokePoints = pskl.PixelUtils.getBoundRectanglePixels(this.startCol, this.startRow, col, row);

    var applyDraw = function (p) {
      targetFrame.setPixel(p[0], p[1], color);
    }.bind(this);

    for (var i = 0 ; i < strokePoints.length ; i++) {
      // Change model:
      var pixels = pskl.app.penSizeService.getPixelsForPenSize(strokePoints[i].col, strokePoints[i].row, penSize);
      pixels.forEach(applyDraw);
    }
  };
})();
