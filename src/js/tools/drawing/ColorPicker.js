/**
 * @provide pskl.tools.drawing.ColorPicker
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');

  ns.ColorPicker = function() {
    this.toolId = 'tool-colorpicker';
    this.helpText = 'Color picker';
    this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.COLORPICKER;
  };

  pskl.utils.inherit(ns.ColorPicker, ns.BaseTool);

  /**
   * @override
   */
  ns.ColorPicker.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    var targetCol = col;
    var targetRow = row;

    if (pskl.UserSettings.get('SEAMLESS_MODE')) {
      targetCol = ((col % frame.getWidth()) + frame.getWidth()) % frame.getWidth();
      targetRow = ((row % frame.getHeight()) + frame.getHeight()) % frame.getHeight();
    }

    if (frame.containsPixel(targetCol, targetRow)) {
      var sampledColor = pskl.utils.intToColor(frame.getPixel(targetCol, targetRow));
      if (pskl.app.mouseStateService.isLeftButtonPressed()) {
        $.publish(Events.SELECT_PRIMARY_COLOR, [sampledColor]);
      } else if (pskl.app.mouseStateService.isRightButtonPressed()) {
        $.publish(Events.SELECT_SECONDARY_COLOR, [sampledColor]);
      }
    }
  };
})();
