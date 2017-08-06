(function () {
  var ns = $.namespace('pskl.selection');

  ns.BaseSelection = function () {
    this.reset();
  };

  ns.BaseSelection.prototype.stringify = function () {
    return JSON.stringify({
      pixels: this.pixels,
      time: this.time
    });
  };

  ns.BaseSelection.prototype.parse = function (str) {
    var selectionData = JSON.parse(str);
    this.pixels = selectionData.pixels;
    this.time = selectionData.time;
  };

  ns.BaseSelection.prototype.reset = function () {
    this.pixels = [];
    this.hasPastedContent = false;
    this.time = -1;
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
    // Keep track of the selection time to compare between local selection and
    // paste event selections.
    this.time = Date.now();
  };
})();
