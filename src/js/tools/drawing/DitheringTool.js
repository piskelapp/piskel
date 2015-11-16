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
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.DITHERING;
  };

  pskl.utils.inherit(ns.DitheringTool, ns.SimplePen);

  ns.DitheringTool.prototype.supportsDynamicPenSize = function() {
    return false;
  };

  /**
   * @override
   */
  ns.DitheringTool.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    this.previousCol = col;
    this.previousRow = row;

    var usePrimaryColor = (col + row) % 2;
    usePrimaryColor =
      pskl.app.mouseStateService.isRightButtonPressed() ? !usePrimaryColor : usePrimaryColor;
    var ditheringColor = usePrimaryColor ?
      pskl.app.selectedColorsService.getPrimaryColor() :
      pskl.app.selectedColorsService.getSecondaryColor();

    this.draw(ditheringColor, col, row, frame, overlay);
  };
})();
