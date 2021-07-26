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

    this.tooltipDescriptors = [
      {key : 'ctrl', description : 'Use 25% dither'},
      {key : 'shift', description : 'Use 75% dither'},
    ];
  };

  pskl.utils.inherit(ns.DitheringTool, ns.SimplePen);

  ns.DitheringTool.prototype.supportsDynamicPenSize = function() {
    return true;
  };

  /**
   * @override
   */
  ns.DitheringTool.prototype.applyToolAt = function(col, row, frame, overlay, event) {
    this.previousCol = col;
    this.previousRow = row;

    var penSize = pskl.app.penSizeService.getPenSize();
    var points = pskl.PixelUtils.resizePixel(col, row, penSize);
    points.forEach(function (point) {
      this.applyToolOnPixel(point[0], point[1], frame, overlay, event);
    }.bind(this));
  };

  ns.DitheringTool.prototype.applyToolOnPixel = function(col, row, frame, overlay, event) {
    var usePrimaryColor = (col + row) % 2;

    if (pskl.utils.UserAgent.isMac ? event.metaKey : event.ctrlKey) {
      usePrimaryColor = col % 2 || row % 2;
    } else if (event.shiftKey) {
      usePrimaryColor = col % 2 && row % 2;
    }

    if (pskl.app.mouseStateService.isRightButtonPressed()) {
      usePrimaryColor = !usePrimaryColor;
    }

    var ditheringColor = usePrimaryColor ?
      pskl.app.selectedColorsService.getPrimaryColor() :
      pskl.app.selectedColorsService.getSecondaryColor();

    this.draw(ditheringColor, col, row, frame, overlay);
  };

})();
