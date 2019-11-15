(function () {
  var ns = $.namespace('pskl.service');

  ns.CurrentColorsService = function (piskelController) {
    this.piskelController = piskelController;
    // cache of current colors by history state
    this.cache = {};
    this.currentColors = [];
    this.currentFrameColors = [];

    this.cachedFrameProcessor = new pskl.model.frame.AsyncCachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.getFrameColors_.bind(this));

    this.throttledUpdateCurrentColors_ = pskl.utils.FunctionUtils.throttle(
      this.updateCurrentColors_.bind(this),
      1000
    );

    this.paletteService = pskl.app.paletteService;
  };

  ns.CurrentColorsService.prototype.init = function () {
    $.subscribe(Events.HISTORY_STATE_SAVED, this.throttledUpdateCurrentColors_);
    $.subscribe(Events.HISTORY_STATE_LOADED, this.loadColorsFromCache_.bind(this));
    $.subscribe(Events.CURRENT_FRAME_CHANGED, this.updateCurrentColors_.bind(this));
    $.subscribe(Events.CURRENT_LAYER_CHANGED, this.updateCurrentColors_.bind(this));
  };

  ns.CurrentColorsService.prototype.getCurrentColors = function () {
    return this.currentColors;
  };

  ns.CurrentColorsService.prototype.getCurrentFrameColors = function () {
    return this.currentFrameColors 
  };

  ns.CurrentColorsService.prototype.setCurrentColors = function (colors) {
    var historyIndex = pskl.app.historyService.currentIndex;
    this.cache[historyIndex] = colors;
    if (colors.join('') !== this.currentColors.join('')) {
      this.currentColors = colors;
      $.publish(Events.CURRENT_COLORS_UPDATED);
    }
  };

  // Current frame colors are tracked and updated for any future pixel indexing operations
  ns.CurrentColorsService.prototype.updateCurrentFrameColors = function () {
    var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
    var frame = pskl.app.piskelController.getCurrentLayer().getFrameAt(currentFrameIndex);

    // remove missing colors
    frame.colorPalette.forEach(function(color, index){
      if (!frame.getPixels().includes(pskl.utils.colorToInt(color))){
        frame.colorPalette.splice(index, 1)
      }
    })

    // add new colors
    frame.forEachPixel(function (color, col, row, frame) {
      if (color ===  0) return;
      if (!frame.colorPalette.includes(color)) {       
        frame.colorPalette.push(color)
      }
    })
  
    this.currentFrameColors = frame.colorPalette;
    $.publish(Events.CURRENT_COLORS_UPDATED);
  };

  ns.CurrentColorsService.prototype.applyCurrentPaletteToIndexedPixels = function (applicationPalette) {
    var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
    var frame = pskl.app.piskelController.getCurrentLayer().getFrameAt(currentFrameIndex);

    applicationPalette.forEach(function(color, index) {
      frame.forEachPixel(function (oldColor, col, row, frame) {
        if (oldColor === 0) return;
        var newPixelIndex = frame.colorPalette.indexOf(oldColor)
        if (newPixelIndex === index) {
          frame.setPixel(col, row, color);
        }
      }) 
    })
  }

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

  var batchAll = function (frames, job) {
    var batches = [];
    frames = frames.slice(0);
    while (frames.length) {
      batches.push(frames.splice(0, 10));
    }
    var result = Q([]);
    batches.forEach(function (batch) {
      result = result.then(function (results) {
        return Q.all(batch.map(job)).then(function (partials) {
          return results.concat(partials);
        });
      });
    });
    return result;
  };

  ns.CurrentColorsService.prototype.updateCurrentColors_ = function () {
    var layers = this.piskelController.getLayers();

    // Concatenate all frames in a single array.
    var frames = layers.map(function (l) {
      return l.getFrames();
    }).reduce(function (p, n) {
      return p.concat(n);
    });

    batchAll(frames, function (frame) {
      return this.cachedFrameProcessor.get(frame);
    }.bind(this))
    .then(function (results) {
      var colors = {};
      results.forEach(function (result) {
        Object.keys(result).forEach(function (color) {
          colors[color] = true;
        });
      });
      // Remove transparent color from used colors
      delete colors[pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR)];

      var hexColors = Object.keys(colors).map(function (color) {
        return pskl.utils.intToHex(color);
      });
      this.setCurrentColors(hexColors);
      this.updateCurrentFrameColors();
    }.bind(this));
  };

  ns.CurrentColorsService.prototype.isCurrentColorsPaletteSelected_ = function () {
    var paletteId = pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE);
    var palette = this.paletteService.getPaletteById(paletteId);

    return palette && palette.id === Constants.CURRENT_COLORS_PALETTE_ID;
  };

  ns.CurrentColorsService.prototype.loadColorsFromCache_ = function () {
    var historyIndex = pskl.app.historyService.currentIndex;
    var colors = this.cache[historyIndex];
    if (colors) {
      this.setCurrentColors(colors);
    }
  };

  ns.CurrentColorsService.prototype.getFrameColors_ = function (frame, processorCallback) {
    var frameColorsWorker = new pskl.worker.framecolors.FrameColors(frame,
      function (event) {
        processorCallback(event.data.colors);
      },
      function () {},
      function (event) {processorCallback({});}
    );

    frameColorsWorker.process();
  };
})();
