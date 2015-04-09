(function () {
  var ns = $.namespace('pskl.service');

  ns.CurrentColorsService = function (piskelController) {
    this.piskelController = piskelController;
    // cache of current colors by history state
    this.cache = {};
    this.currentColors = [];

    this.cachedFrameProcessor = new pskl.model.frame.AsyncCachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.getFrameColors_.bind(this));

    this.colorSorter = new pskl.service.color.ColorSorter();
    this.paletteService = pskl.app.paletteService;
  };

  ns.CurrentColorsService.prototype.init = function () {
    $.subscribe(Events.HISTORY_STATE_SAVED, this.updateCurrentColors_.bind(this));
    $.subscribe(Events.HISTORY_STATE_LOADED, this.loadColorsFromCache_.bind(this));
  };

  ns.CurrentColorsService.prototype.getCurrentColors = function () {
    return this.currentColors;
  };

  ns.CurrentColorsService.prototype.setCurrentColors = function (colors) {
    var historyIndex = pskl.app.historyService.currentIndex;
    this.cache[historyIndex] = colors;
    if (colors.join('') !== this.currentColors.join('')) {
      this.currentColors = colors;
      $.publish(Events.CURRENT_COLORS_UPDATED);
    }
  };

  ns.CurrentColorsService.prototype.isCurrentColorsPaletteSelected_ = function () {
    var paletteId = pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE);
    var palette = this.paletteService.getPaletteById(paletteId);

    return palette.id === Constants.CURRENT_COLORS_PALETTE_ID;
  };

  ns.CurrentColorsService.prototype.loadColorsFromCache_ = function () {
    var historyIndex = pskl.app.historyService.currentIndex;
    var colors = this.cache[historyIndex];
    if (colors) {
      this.setCurrentColors(colors);
    } else {
      this.updateCurrentColors_();
    }
  };

  ns.CurrentColorsService.prototype.updateCurrentColors_ = function () {
    var layers = this.piskelController.getLayers();
    var frames = layers.map(function (l) {return l.getFrames();}).reduce(function (p, n) {return p.concat(n);});

    Q.all(
      frames.map(function (frame) {
        return this.cachedFrameProcessor.get(frame);
      }.bind(this))
    ).done(function (results) {
      console.log('ALL DONE');

      var colors = {};
      results.forEach(function (result) {
        Object.keys(result).forEach(function (color) {
          colors[color] = true;
        });
      })
      this.updateCurrentColorsReady_(colors);
    }.bind(this))
  };

  ns.CurrentColorsService.prototype.updateCurrentColorsReady_ = function (colors) {
    // Remove transparent color from used colors
    delete colors[Constants.TRANSPARENT_COLOR];

    // limit the array to the max colors to display
    var colorsArray = Object.keys(colors).slice(0, Constants.MAX_CURRENT_COLORS_DISPLAYED);
    var currentColors = this.colorSorter.sort(colorsArray);

    this.setCurrentColors(currentColors);
  };

  ns.CurrentColorsService.prototype.getFrameColors_ = function (frame, processorCallback) {
    var frameColorsWorker = new pskl.worker.framecolors.FrameColors(frame,
      function (event) {processorCallback(event.data.colors);},
      function () {},
      function (event) {processorCallback({});}
    );

    frameColorsWorker.process();
  };
})();