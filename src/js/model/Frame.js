(function () {
  var ns = $.namespace('pskl.model');
  var __idCounter = 0;
  ns.Frame = function (width, height) {
    if (width && height) {
      this.width = width;
      this.height = height;
      this.id = __idCounter++;
      this.version = 0;
      this.pixels = ns.Frame.createEmptyPixelGrid_(width, height);
      this.stateIndex = 0;
    } else {
      throw 'Bad arguments in pskl.model.Frame constructor : ' + width + ', ' + height;
    }
  };

  ns.Frame.fromPixelGrid = function (pixels, width, height) {
    if (pixels.length) {
      var w;
      var h;
      var buffer;

      if (pixels[0].length) {
        w = pixels.length;
        h = pixels[0].length;
        buffer = [];
        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            if (typeof pixels[x][y] == 'string') {
              buffer[y * w + x] = pskl.utils.colorToInt(pixels[x][y]);
            } else {
              buffer[y * w + x] = pixels[x][y];
            }
          }
        }
      } else if (width && height) {
        w = width;
        h = height;
        buffer = pixels;
      } else {
        throw 'Bad arguments in pskl.model.frame.fromPixelGrid, missing width and height';
      }

      var frame = new pskl.model.Frame(w, h);
      frame.setPixels(buffer);
      return frame;
    } else {
      throw 'Bad arguments in pskl.model.Frame.fromPixelGrid';
    }
  };

  var _emptyPixelGridCache = {};
  ns.Frame.createEmptyPixelGrid_ = function (width, height) {
    var pixels;
    var key = width + '-' + height;
    if (_emptyPixelGridCache[key]) {
      pixels = _emptyPixelGridCache[key];
    } else {
      pixels = _emptyPixelGridCache[key] = new Uint32Array(width * height);
      var transparentColorInt = pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
      pixels.fill(transparentColorInt);
    }

    return new Uint32Array(pixels);
  };

  ns.Frame.createEmptyFromFrame = function (frame) {
    return new ns.Frame(frame.getWidth(), frame.getHeight());
  };

  ns.Frame.prototype.clone = function () {
    var clone = new ns.Frame(this.width, this.height);
    clone.setPixels(this.pixels);
    return clone;
  };

  /**
   * Returns a copy of the pixels used by the frame
   */
  ns.Frame.prototype.getPixels = function () {
    return this.clonePixels_(this.pixels);
  };

  /**
   * Copies the passed pixels into the frame.
   */
  ns.Frame.prototype.setPixels = function (pixels) {
    this.pixels = this.clonePixels_(pixels);
    this.version++;
  };

  ns.Frame.prototype.clear = function () {
    this.pixels = ns.Frame.createEmptyPixelGrid_(this.getWidth(), this.getHeight());
    this.version++;
  };

  /**
   * Clone a set of pixels. Should be static utility method
   * @private
   */
  ns.Frame.prototype.clonePixels_ = function (pixels) {
    return new Uint32Array(pixels);
  };

  ns.Frame.prototype.getHash = function () {
    return [this.id, this.version].join('-');
  };

  ns.Frame.prototype.setPixel = function (x, y, color) {
    if (this.containsPixel(x, y)) {
      var index = y * this.width + x;
      var p = this.pixels[index];
      color = pskl.utils.colorToInt(color);

      if (p !== color) {
        this.pixels[index] = color || pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
        this.version++;
      }
    }
  };

  ns.Frame.prototype.getPixel = function (x, y) {
    if (this.containsPixel(x, y)) {
      return this.pixels[y * this.width + x];
    } else {
      return null;
    }
  };

  ns.Frame.prototype.forEachPixel = function (callback) {
    var width = this.getWidth();
    var height = this.getHeight();
    var length = width * height;
    for (var i = 0; i < length ; i++) {
      callback(this.pixels[i], i % width, Math.floor(i / width), this);
    }
  };

  ns.Frame.prototype.getWidth = function () {
    return this.width;
  };

  ns.Frame.prototype.getHeight = function () {
    return this.height;
  };

  ns.Frame.prototype.containsPixel = function (col, row) {
    return col >= 0 && row >= 0 && col < this.width && row < this.height;
  };

  ns.Frame.prototype.isSameSize = function (otherFrame) {
    return this.getHeight() == otherFrame.getHeight() && this.getWidth() == otherFrame.getWidth();
  };
})();
