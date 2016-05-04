(function () {

  var ns = $.namespace('pskl.rendering');

  ns.PiskelRenderer = function (piskelController) {
    var frames = [];
    for (var i = 0 ; i < piskelController.getFrameCount() ; i++) {
      frames.push(piskelController.renderFrameAt(i, true));
    }
    this.piskelController = piskelController;
    this.frames = frames;
  };

  ns.PiskelRenderer.prototype.renderAsCanvas = function () {
    var canvas = this.createCanvas_();
    for (var i = 0 ; i < this.frames.length ; i++) {
      var frame = this.frames[i];
      this.drawFrameInCanvas_(frame, canvas, i * this.piskelController.getWidth(), 0);
    }
    return canvas;
  };

  ns.PiskelRenderer.prototype.drawFrameInCanvas_ = function (frame, canvas, offsetWidth, offsetHeight) {
    var context = canvas.getContext('2d');
    context.drawImage(frame, offsetWidth, offsetHeight, frame.width, frame.height);
  };

  ns.PiskelRenderer.prototype.createCanvas_ = function () {
    var count = this.frames.length;
    var width = count * this.piskelController.getWidth();
    var height = this.piskelController.getHeight();
    return pskl.utils.CanvasUtils.createCanvas(width, height);
  };
})();
