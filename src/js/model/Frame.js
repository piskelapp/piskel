(function () {
  var ns = $.namespace("pskl.model");
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

  ns.Frame.fromPixelGrid = function (pixels) {
    if (pixels.length && pixels[0].length) {
      var w = pixels.length, h = pixels[0].length;
      var frame = new pskl.model.Frame(w, h);
      frame.setPixels(pixels);
      return frame;
    } else {
      throw 'Bad arguments in pskl.model.Frame.fromPixelGrid : ' + pixels;
    }
  };

  ns.Frame.createEmptyPixelGrid_ = function (width, height) {
    var pixels = []; //new Array(width);
    for (var columnIndex=0; columnIndex < width; columnIndex++) {
      var columnArray = [];
      for(var heightIndex = 0; heightIndex < height; heightIndex++) {
        columnArray.push(Constants.TRANSPARENT_COLOR);
      }
      pixels[columnIndex] = columnArray;
    }
    return pixels;
  };

  ns.Frame.createEmptyFromFrame = function (frame) {
    return new ns.Frame(frame.getWidth(), frame.getHeight());
  };

  ns.Frame.prototype.clone = function () {
    var clone = new ns.Frame(this.width, this.height);
    clone.setPixels(this.getPixels());
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
    var pixels = ns.Frame.createEmptyPixelGrid_(this.getWidth(), this.getHeight());
    this.setPixels(pixels);
  };

  /**
   * Clone a set of pixels. Should be static utility method
   * @private
   */
  ns.Frame.prototype.clonePixels_ = function (pixels) {
    var clonedPixels = [];
    for (var col = 0 ; col < pixels.length ; col++) {
      clonedPixels[col] = pixels[col].slice(0 , pixels[col].length);
    }
    return clonedPixels;
  };

  ns.Frame.prototype.getHash = function () {
    return [this.id, this.version].join('-');
  };

  ns.Frame.prototype.setPixel = function (x, y, color) {
    if (this.containsPixel(x, y)) {
      var p = this.pixels[x][y];
      if (p !== color) {
        this.pixels[x][y] = color;
        this.version++;
      }
    }
  };

  ns.Frame.prototype.getPixel = function (x, y) {
    if (this.containsPixel(x, y)) {
      return this.pixels[x][y];
    } else {
      return null;
    }
  };

  ns.Frame.prototype.forEachPixel = function (callback) {
    var width = this.getWidth();
    var height = this.getHeight();
    for (var x = 0 ; x < width ; x++) {
      for (var y = 0 ; y < height ; y++) {
        callback(this.pixels[x][y], x, y, this);
      }
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