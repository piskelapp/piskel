(function () {
  var ns = $.namespace('pskl.service');

  ns.CurrentColorsService = function (piskelController) {
    this.piskelController = piskelController;
    this.currentColors = [];
    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.frameToColors_.bind(this));

    this.framesColorsCache_ = {};
  };

  ns.CurrentColorsService.prototype.init = function () {
    $.subscribe(Events.PISKEL_RESET, this.onPiskelUpdated_.bind(this));
    $.subscribe(Events.TOOL_RELEASED, this.onPiskelUpdated_.bind(this));
  };

  ns.CurrentColorsService.prototype.getCurrentColors = function () {
    return this.currentColors;
  };

  ns.CurrentColorsService.prototype.frameToColors_ = function (frame) {
    var frameColors = {};
    frame.forEachPixel(function (color, x, y) {
      frameColors[color] = (frameColors[color] || 0) + 1;
    });
    return frameColors;
  };


  ns.CurrentColorsService.prototype.onPiskelUpdated_ = function (evt) {
    var layers = this.piskelController.getLayers();
    var frames = layers.map(function (l) {return l.getFrames();}).reduce(function (p, n) {return p.concat(n);});
    var colors = {};
    frames.forEach(function (f) {
      var frameColors = this.cachedFrameProcessor.get(f);
      Object.keys(frameColors).slice(0, Constants.MAX_CURRENT_COLORS_DISPLAYED).forEach(function (color) {
        colors[color] = (colors[color] || 0) + frameColors[color];
      });
    }.bind(this));

    // Remove transparent color from used colors
    delete colors[Constants.TRANSPARENT_COLOR];

    // limit the array to the max colors to display
    this.currentColors = Object.keys(colors).slice(0, Constants.MAX_CURRENT_COLORS_DISPLAYED);

    // sort by most frequent color
    this.currentColors = this.currentColors.sort(function (c1, c2) {
      return colors[c2] - colors[c1];
    });

    // TODO : only fire if there was a change
    $.publish(Events.CURRENT_COLORS_UPDATED, colors);
  };
})();