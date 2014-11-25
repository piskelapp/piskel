/**
 * @provide pskl.tools.drawing.Eraser
 *
 * @require Constants
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.tools.drawing");
  var DEFAULT_STEP = 3;

  ns.Lighten = function() {
    this.superclass.constructor.call(this);
    this.toolId = "tool-lighten";

    this.helpText = "Lighten";

    this.tooltipDescriptors = [
      {key : 'ctrl', description : 'Darken'},
      {key : 'shift', description : 'Apply only once per pixel'}
    ];

    this.usedPixels_ = {
      darken : {},
      lighten : {}
    };
  };

  pskl.utils.inherit(ns.Lighten, ns.SimplePen);

  /**
   * @Override
   */
  ns.Lighten.prototype.resetUsedPixels_ = function() {
    this.usedPixels_ = {
      darken : {},
      lighten : {}
    };
    this.superclass.resetUsedPixels_.call(this);
  };

  /**
   * @Override
   */
  ns.Lighten.prototype.applyToolAt = function(col, row, color, frame, overlay, event, mouseButton) {
    var overlayColor = overlay.getPixel(col, row);
    var frameColor = frame.getPixel(col, row);
    var pixelColor = overlayColor === Constants.TRANSPARENT_COLOR ? frameColor : overlayColor;

    var isDarken = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
    var isSinglePass = event.shiftKey;

    var isTransparent = pixelColor === Constants.TRANSPARENT_COLOR;
    var usedPixels = isDarken ? this.usedPixels_.darken : this.usedPixels_.lighten;
    var key = col+'-'+row;

    var doNotModify = isTransparent || (isSinglePass && usedPixels[key]);
    if (doNotModify) {
      color = window.tinycolor(pixelColor);
    } else {
      var step = isSinglePass ? DEFAULT_STEP * 2 : DEFAULT_STEP;
      if (isDarken) {
        color = window.tinycolor.darken(pixelColor, step);
      } else {
        color = window.tinycolor.lighten(pixelColor, step);
      }
    }
    if (color) {
      usedPixels[key] = true;
      this.superclass.applyToolAt.call(this, col, row, color.toRgbString(), frame, overlay, event);
    }

  };
})();