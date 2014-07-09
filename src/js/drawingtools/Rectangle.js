/**
 * @provide pskl.drawingtools.Rectangle
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.Rectangle = function() {
    ns.ShapeTool.call(this);

    this.toolId = "tool-rectangle";

    this.shortHelpText = "Rectangle tool";
    this.helpText = [
      "<div class='tools-tooltip-container'>",
      "Rectangle tool {{shortcut}}<br/>",
      this.getModifierHelpText('shift', 'Keep 1 to 1 ratio'),
      "</div>"
    ].join("");
  };

  pskl.utils.inherit(ns.Rectangle, ns.ShapeTool);

  ns.Rectangle.prototype.draw_ = function (col, row, color, targetFrame) {
    var strokePoints = pskl.PixelUtils.getBoundRectanglePixels(this.startCol, this.startRow, col, row);
    for(var i = 0; i< strokePoints.length; i++) {
      // Change model:
      targetFrame.setPixel(strokePoints[i].col, strokePoints[i].row, color);
    }
  };
})();
