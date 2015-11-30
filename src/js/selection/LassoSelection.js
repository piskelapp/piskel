(function () {
  var ns = $.namespace('pskl.selection');

  var OUTSIDE = -1;
  var INSIDE = 1;
  var VISITED = 2;

  ns.LassoSelection = function (pixels, frame) {
    // transform the selected pixels array to a Map to get a faster lookup
    this.pixelsMap = {};
    pixels.forEach(function (pixel) {
      this.setPixelInMap_(pixel, INSIDE);
    }.bind(this));

    this.pixels = this.getLassoPixels_(frame);
  };

  pskl.utils.inherit(ns.LassoSelection, ns.BaseSelection);

  ns.LassoSelection.prototype.getLassoPixels_ = function (frame) {
    var lassoPixels = [];

    frame.forEachPixel(function (color, pixelCol, pixelRow) {
      var pixel = {col : pixelCol, row : pixelRow};
      if (this.isInSelection_(pixel, frame)) {
        lassoPixels.push(pixel);
      }
    }.bind(this));

    return lassoPixels;
  };

  ns.LassoSelection.prototype.isInSelection_ = function (pixel, frame) {
    var alreadyVisited = this.getPixelInMap_(pixel);
    if (!alreadyVisited) {
      this.visitPixel_(pixel, frame);
    }

    return this.getPixelInMap_(pixel) == INSIDE;
  };

  ns.LassoSelection.prototype.visitPixel_ = function (pixel, frame) {
    var frameBorderReached = false;
    var visitedPixels = pskl.PixelUtils.visitConnectedPixels(pixel, frame, function (connectedPixel) {
      var alreadyVisited = this.getPixelInMap_(connectedPixel);
      if (alreadyVisited) {
        return false;
      }

      if (!frame.containsPixel(connectedPixel.col, connectedPixel.row)) {
        frameBorderReached = true;
        return false;
      }

      this.setPixelInMap_(connectedPixel, VISITED);
      return true;
    }.bind(this));

    visitedPixels.forEach(function (visitedPixel) {
      this.setPixelInMap_(visitedPixel, frameBorderReached ? OUTSIDE : INSIDE);
    }.bind(this));
  };

  ns.LassoSelection.prototype.setPixelInMap_ = function (pixel, value) {
    this.pixelsMap[pixel.col] = this.pixelsMap[pixel.col] || {};
    this.pixelsMap[pixel.col][pixel.row] = value;
  };

  ns.LassoSelection.prototype.getPixelInMap_ = function (pixel) {
    return this.pixelsMap[pixel.col] && this.pixelsMap[pixel.col][pixel.row];
  };

})();
