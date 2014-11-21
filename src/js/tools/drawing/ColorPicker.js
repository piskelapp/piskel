/**
 * @provide pskl.tools.drawing.ColorPicker
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.tools.drawing");

  ns.ColorPicker = function() {
    this.toolId = "tool-colorpicker";
    this.helpText = "Color picker";
  };

  pskl.utils.inherit(ns.ColorPicker, ns.BaseTool);


  /**
   * @override
   */
  ns.ColorPicker.prototype.applyToolAt = function(col, row, color, frame, overlay, event) {
    if (frame.containsPixel(col, row)) {
      var sampledColor = frame.getPixel(col, row);
      if (event.button == Constants.LEFT_BUTTON) {
        $.publish(Events.SELECT_PRIMARY_COLOR, [sampledColor]);
      } else if (event.button == Constants.RIGHT_BUTTON) {
        $.publish(Events.SELECT_SECONDARY_COLOR, [sampledColor]);
      }
    }
  };
})();
