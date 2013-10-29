(function () {

  var ns = $.namespace("pskl.rendering");

  ns.SpritesheetRenderer = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.SpritesheetRenderer.prototype.render = function () {
    var canvas = this.createCanvas_();
    for (var i = 0 ; i < this.piskelController.getFrameCount() ; i++) {
      var frame = this.piskelController.getFrameAt(i);
      this.drawFrameInCanvas_(frame, canvas, i * this.piskelController.getWidth(), 0);
    }
    return canvas;
  };

  /**
   * TODO(juliandescottes): Mutualize with code already present in FrameRenderer
   */
  ns.SpritesheetRenderer.prototype.drawFrameInCanvas_ = function (frame, canvas, offsetWidth, offsetHeight) {
    var context = canvas.getContext('2d');
    for(var col = 0, width = frame.getWidth(); col < width; col++) {
      for(var row = 0, height = frame.getHeight(); row < height; row++) {
        var color = frame.getPixel(col, row);
        if(color != Constants.TRANSPARENT_COLOR) {
          context.fillStyle = color;
          context.fillRect(col + offsetWidth, row + offsetHeight, 1, 1);
        }
      }
    }
  };

  ns.SpritesheetRenderer.prototype.createCanvas_ = function () {
    var frameCount = this.piskelController.getFrameCount();
    if (frameCount > 0){
      var width = frameCount * this.piskelController.getWidth();
      var height = this.piskelController.getHeight();
      return pskl.CanvasUtils.createCanvas(width, height);
    } else {
      throw "Cannot render empty Spritesheet";
    }
  };
})();