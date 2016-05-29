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

  ns.PiskelRenderer.prototype.renderAsCanvas = function (columns) {
    columns = columns || this.frames.length;
    var rows = Math.ceil(this.frames.length / columns);

    var canvas = this.createCanvas_(columns, rows);

    for (var i = 0 ; i < this.frames.length ; i++) {
      var frame = this.frames[i];
      var posX = (i % columns) * this.piskelController.getWidth();
      var posY = Math.floor(i / columns) * this.piskelController.getHeight();
      this.drawFrameInCanvas_(frame, canvas, posX, posY);
    }
    return canvas;
  };

  ns.PiskelRenderer.prototype.drawFrameInCanvas_ = function (frame, canvas, offsetWidth, offsetHeight) {
    var context = canvas.getContext('2d');
    context.drawImage(frame, offsetWidth, offsetHeight, frame.width, frame.height);
  };

  ns.PiskelRenderer.prototype.createCanvas_ = function (columns, rows) {
    var width = columns * this.piskelController.getWidth();
    var height = rows * this.piskelController.getHeight();
    return pskl.utils.CanvasUtils.createCanvas(width, height);
  };
})();
