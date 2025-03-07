(function () {
  var ns = $.namespace('pskl.service');

  ns.PixelStatsService = function () {};

  ns.PixelStatsService.prototype.init = function () {
    $.subscribe(Events.PISKEL_RESET, this.reset.bind(this));
    $.subscribe(Events.PISKEL_SAVE_STATE, this.reset.bind(this));
    this.reset();
  };

  ns.PixelStatsService.prototype.reset = function () {
    this.cache = {};
  };

  ns.PixelStatsService.prototype.getPixelStats = function (layer, frameIndex) {
    var key =
      layer.getName() +
      '-' +
      (frameIndex || pskl.app.piskelController.getCurrentFrameIndex());

    if (!this.cache[key]) {
      var stats = this.calculatePixelStats(layer, frameIndex);
      this.cache[key] = stats;
    }

    return this.cache[key];
  };

  ns.PixelStatsService.prototype.calculatePixelStats = function (
    layer,
    frameIndex
  ) {
    var currentFrameIndex =
      frameIndex !== undefined ?
        frameIndex :
        pskl.app.piskelController.getCurrentFrameIndex();
    var frame = layer.getFrameAt(currentFrameIndex);
    var width = frame.getWidth();
    var height = frame.getHeight();
    var totalPixels = width * height;
    var colorCount = {};
    var nonTransparentCount = 0;

    frame.forEachPixel(function (color, col, row) {
      var colorStr = this.intToRGBA(color);
      if (colorStr !== 'transparent' && color !== null) {
        nonTransparentCount++;
        if (!colorCount[color]) {
          colorCount[color] = 0;
        }
        colorCount[color]++;
      }
    }.bind(this));

    var stats = {
      totalPixels: totalPixels,
      totalNonTransparent: nonTransparentCount,
      transparency: (
        ((totalPixels - nonTransparentCount) / totalPixels) *
        100
      ).toFixed(1),
      colorCount: colorCount,
      colorStats: [],
    };

    stats.colorStats = Object.keys(colorCount).map(
      function (color) {
        return {
          color: this.intToRGBA(color),
          count: colorCount[color],
          percentage: ((colorCount[color] / nonTransparentCount) * 100).toFixed(
            1
          ),
        };
      }.bind(this)
    );

    stats.colorStats.sort(function (a, b) {
      return b.count - a.count;
    });

    return stats;
  };

  ns.PixelStatsService.prototype.intToRGBA = function (colorInt) {
    if (colorInt == null) {
      return 'transparent';
    }

    if (colorInt === Constants.TRANSPARENT_COLOR ||
        colorInt === 'rgba(0, 0, 0, 0)' ||
        colorInt === 0) {
      return 'transparent';
    }

    if (typeof colorInt === 'string') {
      if (colorInt.indexOf('#') === 0 || colorInt.indexOf('rgb') === 0) {
        // Check for rgba with 0 alpha
        if (colorInt.indexOf('rgba') === 0) {
          var rgbaMatch = colorInt.match(/rgba\(.*,\s*([0-9.]+)\s*\)/);
          if (rgbaMatch && rgbaMatch[1] === '0') {
            return 'transparent';
          }
        }
        return colorInt;
      }
    }

    try {
      var int = parseInt(colorInt, 10);
      if (isNaN(int)) {
        return colorInt;
      }

      var a = ((int >> 24) & 0xff) / 255;
      var b = (int >> 16) & 0xff;
      var g = (int >> 8) & 0xff;
      var r = int & 0xff;

      if (a === 0) {
        return 'transparent';
      }

      return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(2) + ')';
    } catch (e) {
      console.error('Erreur de conversion de couleur:', e);
      return colorInt;
    }
  };
})();
