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
  ns.Lighten.prototype.getToolColor = function() {
    var color = this.superclass.getToolColor.call();

    var usedPixels = this.isDarken_ ? this.usedPixels_.darken : this.usedPixels_.lighten;
    var key = this.col_ + '-' + this.row_;
    var doNotModify = this.isTransparent_ || (this.isSinglePass_ && usedPixels[key]);
    if (doNotModify) {
      color = window.tinycolor(this.pixelColor_);
    } else {
      var step = this.isSinglePass_ ? DEFAULT_STEP * 2 : DEFAULT_STEP;
      if (this.isDarken_) {
        color = window.tinycolor.darken(this.pixelColor_, step);
      } else {
        color = window.tinycolor.lighten(this.pixelColor_, step);
      }
    }
    if (color) {
      usedPixels[key] = true;
    }
    return color.toRgbString();
  };

  /**
   * @Override
   */
  ns.Lighten.prototype.applyToolAt = function(col, row, frame, overlay, event, mouseButton) {
    var overlayColor = overlay.getPixel(col, row);
    var frameColor = frame.getPixel(col, row);

    this.col_ = col;
    this.row_ = row;
    this.pixelColor_ = overlayColor === Constants.TRANSPARENT_COLOR ? frameColor : overlayColor;
    this.isDarken_ = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
    this.isTransparent_ = this.pixelColor_ === Constants.TRANSPARENT_COLOR;
    this.isSinglePass_ = event.shiftKey;

    this.superclass.applyToolAt.call(this, col, row, frame, overlay, event);
  };
})();
