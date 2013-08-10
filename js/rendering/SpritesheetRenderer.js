(function () {

  var ns = $.namespace("pskl.rendering");

  ns.SpritesheetRenderer = function (framesheet) {
    this.framesheet = framesheet;
  };

  ns.SpritesheetRenderer.prototype.renderAsImageDataSpritesheetPNG = function () {
    var canvas = this.createCanvas_();
    for (var i = 0 ; i < this.framesheet.getFrameCount() ; i++) {
      var frame = this.framesheet.getFrameByIndex(i);
      this.drawFrameInCanvas_(frame, canvas, i * this.framesheet.getWidth(), 0);
    }
    return canvas.toDataURL("image/png");
  };

  ns.SpritesheetRenderer.prototype.blobToBase64_ = function(blob, cb) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      cb(dataUrl);
    };
    reader.readAsDataURL(blob);
  };

  ns.SpritesheetRenderer.prototype.renderAsImageDataAnimatedGIF = function(fps, cb) {
    var dpi = 10;
    var gif = new window.GIF({
      workers: 2,
      quality: 10,
      width: 320,
      height: 320
    });

    for (var i = 0; i < this.framesheet.frames.length; i++) {
      var frame = this.framesheet.frames[i];
      var renderer = new pskl.rendering.CanvasRenderer(frame, dpi);
      gif.addFrame(renderer.render(), {
        delay: 1000 / fps
      });
    }

    gif.on('finished', function(blob) {
      this.blobToBase64_(blob, cb);
    }.bind(this));

    gif.render();
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
    var frameCount = this.framesheet.getFrameCount();
    if (frameCount > 0){
      var width = frameCount * this.framesheet.getWidth();
      var height = this.framesheet.getHeight();
      return pskl.CanvasUtils.createCanvas(width, height);
    } else {
      throw "Cannot render empty Spritesheet";
    }
  };
})();