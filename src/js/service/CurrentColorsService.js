(function () {
  var ns = $.namespace('pskl.service');

  ns.CurrentColorsService = function (piskelController) {
    this.piskelController = piskelController;
    this.currentColors = [];
    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.getFrameColors_.bind(this));

    this.colorSorter = new pskl.service.color.ColorSorter();
    this.paletteService = pskl.app.paletteService;
  };

  ns.CurrentColorsService.prototype.init = function () {
    $.subscribe(Events.PISKEL_RESET, this.onPiskelUpdated_.bind(this));
    $.subscribe(Events.TOOL_RELEASED, this.onPiskelUpdated_.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
  };

  ns.CurrentColorsService.prototype.getCurrentColors = function () {
    return this.currentColors;
  };

  ns.CurrentColorsService.prototype.setCurrentColors = function (colors) {
    if (colors.join('') !== this.currentColors.join('')) {
      this.currentColors = colors;
      $.publish(Events.CURRENT_COLORS_UPDATED);
    }
  };

  ns.CurrentColorsService.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.SELECTED_PALETTE) {
      if (this.isCurrentColorsPaletteSelected_()) {
        this.updateCurrentColors_();
      }
    }
  };

  ns.CurrentColorsService.prototype.onPiskelUpdated_ = function (evt) {
    if (this.isCurrentColorsPaletteSelected_()) {
      this.updateCurrentColors_();
    }
  };

  ns.CurrentColorsService.prototype.isCurrentColorsPaletteSelected_ = function () {
    var paletteId = pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE);
    var palette = this.paletteService.getPaletteById(paletteId);

    return palette.id === Constants.CURRENT_COLORS_PALETTE_ID;
  };

  ns.CurrentColorsService.prototype.updateCurrentColors_ = function () {
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
    var colorsArray = Object.keys(colors).slice(0, Constants.MAX_CURRENT_COLORS_DISPLAYED);
    var currentColors = this.colorSorter.sort(colorsArray);

    this.setCurrentColors(currentColors);
  };

  ns.CurrentColorsService.prototype.getFrameColors_ = function (frame) {
    var frameColors = {};
    frame.forEachPixel(function (color, x, y) {
      var hexColor = this.toHexString_(color);
      frameColors[hexColor] = true;
    }.bind(this));
    return frameColors;
  };

  ns.CurrentColorsService.prototype.toHexString_ = function (color) {
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