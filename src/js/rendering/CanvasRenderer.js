(function () {

  var ns = $.namespace("pskl.rendering");
  ns.CanvasRenderer = function (frame, zoom) {
    this.frame = frame;
    this.zoom = zoom;
    this.transparentColor_ = 'white';
  };

  /**
   * Decide which color should be used to represent transparent pixels
   * Default : white
   * @param  {String} color the color to use either as '#ABCDEF' or 'red' or 'rgb(x,y,z)' or 'rgba(x,y,z,a)'
   */
  ns.CanvasRenderer.prototype.drawTransparentAs = function (color) {
    this.transparentColor_ = color;
  };

  ns.CanvasRenderer.prototype.render = function  () {
    var canvas = this.createCanvas_();
    var context = canvas.getContext('2d');

    for(var x = 0, width = this.frame.getWidth(); x < width; x++) {
      for(var y = 0, height = this.frame.getHeight(); y < height; y++) {
        var color = this.frame.getPixel(x, y);
        var w = 1;
        while (color === this.frame.getPixel(x, y+w)) {
          w++;
        }
        this.renderLine_(color, x, y, w, context);
        y = y + w - 1;
      }
    }

    var scaledCanvas = this.createCanvas_(this.zoom);
    var scaledContext = scaledCanvas.getContext('2d');
    pskl.utils.CanvasUtils.disableImageSmoothing(scaledCanvas);
    scaledContext.scale(this.zoom, this.zoom);
    scaledContext.drawImage(canvas, 0, 0);

    return scaledCanvas;
  };

  ns.CanvasRenderer.prototype.renderPixel_ = function (color, x, y, context) {
    if(color == Constants.TRANSPARENT_COLOR) {
      color = this.transparentColor_;
    }
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
  };

  ns.CanvasRenderer.prototype.renderLine_ = function (color, x, y, width, context) {
    if(color == Constants.TRANSPARENT_COLOR) {
      color = this.transparentColor_;
    }
    context.fillStyle = color;
    context.fillRect(x, y, 1, width);
  };

  ns.CanvasRenderer.prototype.createCanvas_ = function (zoom) {
    zoom = zoom || 1;
    var width = this.frame.getWidth() * zoom;
    var height = this.frame.getHeight() * zoom;
    return pskl.utils.CanvasUtils.createCanvas(width, height);
  };
})();