/**
 * @provide pskl.drawingtools.Eraser
 *
 * @require Constants
 * @require pskl.utils
 */
(function() {
  var ns = $.namespace("pskl.drawingtools");

  ns.Lighten = function() {
    this.superclass.constructor.call(this);
    this.toolId = "tool-lighten";
    this.helpText = "Lighten (hold ctrl for Darken)";
    this.step = 3;
    this.resetUsedPixels_();
  };

  pskl.utils.inherit(ns.Lighten, ns.SimplePen);

  ns.Lighten.prototype.resetUsedPixels_ = function() {
    this.usedPixels_ = {
      darken : {},
      lighten : {}
    };
  };
  /**
   * @override
   */
  ns.Lighten.prototype.applyToolAt = function(col, row, color, frame, overlay, event, mouseButton) {
    var isDarken = event.ctrlKey || event.cmdKey;
    var isSinglePass = event.shiftKey;

    var usedPixels = isDarken ? this.usedPixels_.darken : this.usedPixels_.lighten;

    var key = col+'-'+row;
    if (isSinglePass && usedPixels[key]) {
      return;
    }

    var step = isSinglePass ? this.step * 2 : this.step;
    var pixelColor = frame.getPixel(col, row);
    if (isDarken) {
      color = window.tinycolor.darken(pixelColor, step);
    } else {
      color = window.tinycolor.lighten(pixelColor, step);
    }

    if (color) {
      usedPixels[key] = true;
      this.superclass.applyToolAt.call(this, col, row, color.toRgbString(), frame, overlay, event);
    }
  };

  ns.Lighten.prototype.releaseToolAt = function(col, row, color, frame, overlay, event) {
    this.resetUsedPixels_();
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };
})();