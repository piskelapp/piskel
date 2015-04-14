(function () {
  var ns = $.namespace('pskl.rendering');

  /**
   * Render an array of frames
   * @param {Array.<pskl.model.Frame>} frames
   */
  ns.FramesheetRenderer = function (frames) {
    if (frames.length > 0) {
      this.frames = frames;
    } else {
      throw 'FramesheetRenderer : Invalid argument : frames is empty';
    }
  };

  ns.FramesheetRenderer.prototype.renderAsCanvas = function () {
    var canvas = this.createCanvas_();
    for (var i = 0 ; i < this.frames.length ; i++) {
      var frame = this.frames[i];
      this.drawFrameInCanvas_(frame, canvas, i * frame.getWidth(), 0);
    }
    return canvas;
  };

  ns.FramesheetRenderer.prototype.drawFrameInCanvas_ = function (frame, canvas, offsetWidth, offsetHeight) {
    var context = canvas.getContext('2d');
    frame.forEachPixel(function (color, x, y) {
      if (color != Constants.TRANSPARENT_COLOR) {
        context.fillStyle = color;
        context.fillRect(x + offsetWidth, y + offsetHeight, 1, 1);
      }
    });
  };

  ns.FramesheetRenderer.prototype.createCanvas_ = function () {
    var sampleFrame = this.frames[0];
    var count = this.frames.length;
    var width = count * sampleFrame.getWidth();
    var height = sampleFrame.getHeight();
    return pskl.utils.CanvasUtils.createCanvas(width, height);
  };
})();
