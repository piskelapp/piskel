(function () {
  var ns = $.namespace('pskl.controller');

  ns.TransformationsController = function () {

  };

  ns.TransformationsController.prototype.init = function () {
    var container = document.querySelector('.transformations-container');
    container.addEventListener('click', this.onTransformationClick.bind(this));
  };


  ns.TransformationsController.prototype.onTransformationClick = function (evt) {
    var target = evt.target;
    if (target.dataset.transformationId === 'flip') {
      var allFrames = evt.shiftKey;
      var allLayers = evt.ctrlKey;
      if (evt.altKey) {
        this.flip('vertical', allFrames, allLayers);
      } else {
        this.flip('horizontal', allFrames, allLayers);
      }
    }
  };

  ns.TransformationsController.prototype.flipFrame_ = function (frame, axis) {
    var clone = frame.clone();
    var w = frame.getWidth();
    var h = frame.getHeight();
    clone.forEachPixel(function (color, x, y) {
      if (axis === 'horizontal') {
        x = w-x-1;
      } else if (axis === 'vertical') {
        y = h-y-1;
      }
      frame.pixels[x][y] = color;
    });
    frame.version++;
  };

  ns.TransformationsController.prototype.flip = function (axis, allFrames, allLayers) {
    var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
    var layers = allLayers ? pskl.app.piskelController.getLayers(): [pskl.app.piskelController.getCurrentLayer()];
    layers.forEach(function (layer) {
      var frames = allFrames ? layer.getFrames(): [layer.getFrameAt(currentFrameIndex)];
      frames.forEach(function (frame) {
        this.flipFrame_(frame, axis);
      }.bind(this));
    }.bind(this));
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };
})();