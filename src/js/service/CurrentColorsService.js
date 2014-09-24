(function () {
  var ns = $.namespace('pskl.service');

  ns.CurrentColorsService = function (piskelController) {
    this.piskelController = piskelController;
    this.currentColors = [];
    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.getFrameColors_.bind(this));

    this.framesColorsCache_ = {};
  };

  ns.CurrentColorsService.prototype.init = function () {
    $.subscribe(Events.PISKEL_RESET, this.onPiskelUpdated_.bind(this));
    $.subscribe(Events.TOOL_RELEASED, this.onPiskelUpdated_.bind(this));
  };

  ns.CurrentColorsService.prototype.getCurrentColors = function () {
    return this.currentColors;
  };

  ns.CurrentColorsService.prototype.getFrameColors_ = function (frame) {
    var frameColors = {};
    frame.forEachPixel(function (color, x, y) {
      var hexColor = this.toHexColor_(color);
      frameColors[hexColor] = true;
    }.bind(this));
    return frameColors;
  };


  ns.CurrentColorsService.prototype.onPiskelUpdated_ = function (evt) {
    var layers = this.piskelController.getLayers();
    var frames = layers.map(function (l) {return l.getFrames();}).reduce(function (p, n) {return p.concat(n);});
    var colors = {};
    frames.forEach(function (f) {
      var frameColors = this.cachedFrameProcessor.get(f);
      Object.keys(frameColors).slice(0, Constants.MAX_CURRENT_COLORS_DISPLAYED).forEach(function (color) {
        colors[color] = true;
      });
    }.bind(this));

    // Remove transparent color from used colors
    delete colors[Constants.TRANSPARENT_COLOR];

    // limit the array to the max colors to display
    this.currentColors = Object.keys(colors).slice(0, Constants.MAX_CURRENT_COLORS_DISPLAYED);

    this.colorsHslMap = {};

    this.currentColors.forEach(function (color) {
      this.colorsHslMap[color] = window.tinycolor(color).toHsl();
    }.bind(this));

    // sort by most frequent color
    this.currentColors = this.currentColors.sort();
    this.currentColors = this.currentColors.sort(this.sortColors_.bind(this));

    // TODO : only fire if there was a change
    $.publish(Events.CURRENT_COLORS_UPDATED);
  };

  var LOW_SAT = 0.1;
  var LOW_LUM = 0.1;
  var HI_LUM = 0.9;
  ns.CurrentColorsService.prototype.sortColors_ = function (c1, c2) {
    var hsl1 = this.colorsHslMap[c1];
    var hsl2 = this.colorsHslMap[c2];

    if (hsl1.l < LOW_LUM || hsl2.l < LOW_LUM) {
      return this.compareValues_(hsl1.l, hsl2.l);
    } else if (hsl1.l > HI_LUM || hsl2.l > HI_LUM) {
      return this.compareValues_(hsl2.l, hsl1.l);
    } else if (hsl1.s < LOW_SAT || hsl2.s < LOW_SAT) {
      return this.compareValues_(hsl1.s, hsl2.s);
    } else {
      var hDiff = Math.abs(hsl1.h - hsl2.h);
      var sDiff = Math.abs(hsl1.s - hsl2.s);
      var lDiff = Math.abs(hsl1.l - hsl2.l);
      if (hDiff < 10) {
        if (sDiff > lDiff) {
          return this.compareValues_(hsl1.s, hsl2.s);
        } else {
          return this.compareValues_(hsl1.l, hsl2.l);
        }
      } else {
        return this.compareValues_(hsl1.h, hsl2.h);
      }
    }
  };

  ns.CurrentColorsService.prototype.compareValues_ = function (v1, v2) {
    if (v1 > v2) {
      return 1;
    } else if (v1 < v2) {
      return -1;
    }
    return 0;
  };

  ns.CurrentColorsService.prototype.toHexColor_ = function (color) {
    if (color === Constants.TRANSPARENT_COLOR) {
      return color;
    } else {
      color = color.replace(/\s/g, '');
      var hexRe = (/^#([a-f0-9]{3}){1,2}$/i);
      var rgbRe = (/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/i);
      if (hexRe.test(color)) {
        return color.toUpperCase();
      } else if (rgbRe.test(color)) {
        var exec = rgbRe.exec(color);
        return pskl.utils.rgbToHex(exec[1] * 1, exec[2] * 1, exec[3] * 1);
      } else {
        console.error('Could not convert color to hex : ', color);
      }
    }
  };
})();