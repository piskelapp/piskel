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
  ns.DitheringTool.prototype.getToolColor = function() {
    var usePrimaryColor = (this.col_ + this.row_) % 2;
    usePrimaryColor =
      pskl.app.mouseStateService.isRightButtonPressed() ? !usePrimaryColor : usePrimaryColor;
    var ditheringColor = usePrimaryColor ?
      pskl.app.selectedColorsService.getPrimaryColor() :
      pskl.app.selectedColorsService.getSecondaryColor();
    return ditheringColor;
  };

  /**
   * @override
   */
  ns.DitheringTool.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    this.col_ = col;
    this.row_ = row;
    this.superclass.applyToolAt.call(this, col, row, frame, overlay, event);
  };
})();
