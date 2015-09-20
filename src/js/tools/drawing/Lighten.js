/**
 * @provide pskl.tools.drawing.Lighten
 *
 * @require Constants
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace('pskl.tools.drawing');
  var DEFAULT_STEP = 3;

  ns.Lighten = function() {
    this.superclass.constructor.call(this);
    this.toolId = 'tool-lighten';

    this.helpText = 'Lighten';

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
  ns.Lighten.prototype.applyToolAt = function(col, row, frame, overlay, event, mouseButton) {
    var modifiedColor = this.getModifiedColor_(col, row, frame, overlay, event);
    this.draw(modifiedColor, col, row, frame, overlay);
  };

  ns.Lighten.prototype.getModifiedColor_ = function(col, row, frame, overlay, event) {
    var overlayColor = overlay.getPixel(col, row);
    var frameColor = frame.getPixel(col, row);
    var pixelColor = overlayColor === Constants.TRANSPARENT_COLOR ? frameColor : overlayColor;
    var isDarken = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
    var isTransparent = pixelColor === Constants.TRANSPARENT_COLOR;
    var isSinglePass = event.shiftKey;

    var usedPixels = isDarken ? this.usedPixels_.darken : this.usedPixels_.lighten;
    var key = col + '-' + row;
    var doNotModify = isTransparent || (isSinglePass && usedPixels[key]);

    var color;
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
    usedPixels[key] = true;

    // Convert tinycolor color to string format.
    return color.toRgbString();
  };
})();
