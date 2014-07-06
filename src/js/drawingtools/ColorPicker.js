/**
 * @provide pskl.drawingtools.ColorPicker
 *
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

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
      if (event.ctrlKey) {
        pskl.app.piskelController.getPiskel().getLayers().forEach(function (l) {
          l.getFrames().forEach(function (f) {
            f.forEachPixel(function (pixelColor,x,y) {
              if (pixelColor === sampledColor) {
                f.setPixel(x, y, pskl.app.paletteController.getPrimaryColor());
              }
            });
          });
        });
      } else {
        if (event.button == Constants.LEFT_BUTTON) {
          $.publish(Events.SELECT_PRIMARY_COLOR, [sampledColor]);
        } else if (event.button == Constants.RIGHT_BUTTON) {
          $.publish(Events.SELECT_SECONDARY_COLOR, [sampledColor]);
        }
      }
    }
  };
})();
