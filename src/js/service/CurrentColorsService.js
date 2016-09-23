(function () {
  var ns = $.namespace('pskl.service');

  ns.CurrentColorsService = function (piskelController) {
    this.piskelController = piskelController;
    // cache of current colors by history state
    this.cache = {};
    this.currentColors = [];

    this.cachedFrameProcessor = new pskl.model.frame.AsyncCachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.getFrameColors_.bind(this));

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

  var frameCache = {};
  ns.CurrentColorsService.prototype.updateCurrentColors_ = function () {
    var layers = this.piskelController.getLayers();
    var frames = layers.map(function (l) {return l.getFrames();}).reduce(function (p, n) {return p.concat(n);});
    var job = function (frame) {
      return this.cachedFrameProcessor.get(frame);
    }.bind(this);

    var colors = {};
    var framesToBatch = [];

    var removeColorsIfNotInCurrent = function(hash, color) {
      if (!frameCache[hash][color]) {
        delete colors[color];
      }
    };

    for (var i = 0, length = frames.length; i < length; ++i) {
      var frame = frames[i];
      var hash = frame.getHash();

      if (frameCache[hash]) {
        colors = Object.assign(colors, frameCache[hash]);

        var hashParts = hash.split('-');
        var hashVersion = parseInt(hashParts.pop());

        if (hashVersion > 0) {
          var lastColors = frameCache[hashParts.join('-') + '-' + (hashVersion - 1)];

          if (lastColors) {
            Object.keys(lastColors).forEach(removeColorsIfNotInCurrent.bind(this, hash));
          }
        }
      } else {
        framesToBatch.push(frame);
      }
    }

    var batchAllThen = function (colors, results) {
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
    }.bind(this, colors);

    if (framesToBatch.length === 0) {
      batchAllThen([colors]);
    } else {
      batchAll(framesToBatch, job).then(batchAllThen);
    }
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
        frameCache[frame.getHash()] = event.data.colors;
        processorCallback(event.data.colors);
      },
      function () {},
      function (event) {processorCallback({});}
    );

    frameColorsWorker.process();
  };
})();
