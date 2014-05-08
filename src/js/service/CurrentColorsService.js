(function () {
  var ns = $.namespace('pskl.service');

  ns.CurrentColorsService = function (piskelController) {
    this.piskelController = piskelController;
    this.currentColors = [];
    this.framesColorsCache_ = {};
  };

  ns.CurrentColorsService.prototype.init = function () {
    $.subscribe(Events.PISKEL_RESET, this.onPiskelUpdated_.bind(this));
    $.subscribe(Events.TOOL_RELEASED, this.onPiskelUpdated_.bind(this));
  };

  ns.CurrentColorsService.prototype.getCurrentColors = function () {
    return this.currentColors;
  };

  ns.CurrentColorsService.prototype.onPiskelUpdated_ = function (evt) {
    var layers = this.piskelController.getLayers();
    var frames = layers.map(function (l) {return l.getFrames();}).reduce(function (p, n) {return p.concat(n);});
    var colors = {};
    frames.forEach(function (f) {
      var frameHash = f.getHash();
      if (!this.framesColorsCache_[frameHash]) {
        var frameColors = {};
        f.forEachPixel(function (color, x, y) {
          frameColors[color] = true;
        });
        this.framesColorsCache_[frameHash] = frameColors;
      }
      Object.keys(this.framesColorsCache_[frameHash]).forEach(function (color) {
        colors[color] = true;
      });
    }.bind(this));
    delete colors[Constants.TRANSPARENT_COLOR];
    this.currentColors = Object.keys(colors);
    this.currentColors = this.currentColors.sort(function (c1, c2) {
      if (c1 < c2) {
        return -1;
      } else if (c1 > c2) {
        return 1;
      } else {
        return 0;
      }
    });

    // TODO : only fire if there was a change
    $.publish(Events.CURRENT_COLORS_UPDATED, colors);
  };
})();