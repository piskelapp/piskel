/**
 * @provide pskl.tools.drawing.DitheringTool
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.DitheringTool = function() {
    ns.SimplePen.call(this);
    this.toolId = 'tool-dithering';
    this.helpText = 'Dithering tool';
  };
  pskl.utils.inherit(ns.DitheringTool, ns.SimplePen);

  /**
   * @override
   */
  ns.DitheringTool.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    var ditheringColor;
    var currentColors = pskl.app.selectedColorsService.getColors();
    // XOR on either row or col parity.
    if (((col % 2 == 0) && !(row % 2 == 0)) || (!(col % 2 == 0) && (row % 2 == 0))) {
      ditheringColor = currentColors[0];
    } else {
      ditheringColor = currentColors[1];
    }
    this.superclass.applyToolAt.call(this, col, row, ditheringColor, frame, overlay, event);
  };
})();
