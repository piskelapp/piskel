(function () {
  var ns = $.namespace('pskl.selection');

  ns.BaseSelection = function () {
    this.reset();
  };

  ns.BaseSelection.prototype.reset = function () {
    this.pixels = [];
    this.hasPastedContent = false;
  };

  ns.BaseSelection.prototype.move = function (colDiff, rowDiff) {
    var movedPixels = [];

    for (var i = 0, l = this.pixels.length; i < l; i++) {
      var movedPixel = this.pixels[i];
      movedPixel.col += colDiff;
      movedPixel.row += rowDiff;
      movedPixels.push(movedPixel);
    }

    this.pixels = movedPixels;
  };

  ns.BaseSelection.prototype.fillSelectionFromFrame = function (targetFrame) {
    this.pixels.forEach(function (pixel) {
      var color = targetFrame.getPixel(pixel.col, pixel.row);
      pixel.color  = color || Constants.TRANSPARENT_COLOR;
    });

    this.hasPastedContent = true;
  };

  ns.BaseSelection.prototype.isInSelection = function (col, row) {
    return this.pixels.some(function (pixel) {
      return pixel.col === col && pixel.row === row;
    });
  };
})();
