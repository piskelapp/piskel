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
    // Use primary selected color on cell with either an odd col or row.
    // Use secondary color otherwise.
    // When using the right mouse button, invert the above behavior to allow quick corrections.
    var usePrimaryColor = (col + row) % 2;
    var invertColors = event.button === Constants.RIGHT_BUTTON;
    usePrimaryColor = invertColors ? !usePrimaryColor : usePrimaryColor;

    var selectedColors = pskl.app.selectedColorsService.getColors();
    var ditheringColor = usePrimaryColor ? selectedColors[0] : selectedColors[1];
    this.superclass.applyToolAt.call(this, col, row, ditheringColor, frame, overlay, event);
  };
})();
