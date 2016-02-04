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

  ns.FramesheetRenderer.prototype.renderAsCanvas = function (framesPerRows) {
    var canvas = this.createCanvas_(framesPerRows);
    for (var i = 0 ; i < this.frames.length ; i++) {
      var frame = this.frames[i];
      this.drawFrameInCanvas_(frame, canvas, (i % framesPerRows) * frame.getWidth(), Math.floor(i / framesPerRows) * frame.getHeight());
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

  ns.FramesheetRenderer.prototype.createCanvas_ = function (framesPerRows) {
    var sampleFrame = this.frames[0];
    var count = this.frames.length;
    var width = Math.min(framesPerRows, count) * sampleFrame.getWidth();
    var height = Math.max(1, Math.ceil(count / framesPerRows)) * sampleFrame.getHeight();
    return pskl.utils.CanvasUtils.createCanvas(width, height);
  };
})();
