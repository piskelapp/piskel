(function () {
  var ns = $.namespace('pskl.service');

  ns.CurrentColorsService = function (piskelController) {
    this.piskelController = piskelController;
    this.currentColors = [];
    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.getFrameColors_.bind(this));

    this.colorSorter = new pskl.service.color.ColorSorter();

    this.framesColorsCache_ = {};
  };

  ns.CurrentColorsService.prototype.init = function () {
    $.subscribe(Events.PISKEL_RESET, this.onPiskelUpdated_.bind(this));
    $.subscribe(Events.TOOL_RELEASED, this.onPiskelUpdated_.bind(this));

    // this.updateTimer = window.setInterval(this.updateCurrentColors_.bind(this));
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
    var colorsArray = Object.keys(colors).slice(0, Constants.MAX_CURRENT_COLORS_DISPLAYED);
    this.currentColors = this.colorSorter.sort(colorsArray);
    console.log(this.currentColors);

    // TODO : only fire if there was a change
    $.publish(Events.CURRENT_COLORS_UPDATED);
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