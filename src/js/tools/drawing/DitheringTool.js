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
  ns.DitheringTool.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    var usePrimaryColor = (col + row) % 2;
    usePrimaryColor =
      pskl.app.mouseStateService.isRightButtonPressed() ? !usePrimaryColor : usePrimaryColor;
    var ditheringColor = usePrimaryColor ?
      pskl.app.selectedColorsService.getPrimaryColor() :
      pskl.app.selectedColorsService.getSecondaryColor();

    this.draw(ditheringColor, col, row, frame, overlay);
  };
})();
