(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Flip = function () {
    this.toolId = "tool-flip";
    this.helpText = "Flip tool";
    this.tooltipDescriptors = [];
  };

  pskl.utils.inherit(ns.Flip, pskl.tools.Tool);

  ns.Flip.prototype.apply = function (evt) {
    var allFrames = evt.shiftKey;
    var allLayers = evt.ctrlKey;
    if (evt.altKey) {
      this.flip('vertical', allFrames, allLayers);
    } else {
      this.flip('horizontal', allFrames, allLayers);
    }
  };

  ns.Flip.prototype.flipFrame_ = function (frame, axis) {
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

  ns.Flip.prototype.flip = function (axis, allFrames, allLayers) {
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