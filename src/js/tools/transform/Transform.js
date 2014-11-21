(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Transform = function () {
    this.toolId = "tool-transform";
    this.helpText = "Transform tool";
    this.tooltipDescriptors = [];
  };

  pskl.utils.inherit(ns.Transform, pskl.tools.Tool);

  ns.Transform.prototype.apply = function (evt) {
    var allFrames = evt.shiftKey;
    var allLayers = evt.ctrlKey;
    this.applyTool_(evt.altKey, allFrames, allLayers);
  };

  ns.Transform.prototype.applyTool_ = function (altKey, allFrames, allLayers) {
    var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
    var layers = allLayers ? pskl.app.piskelController.getLayers(): [pskl.app.piskelController.getCurrentLayer()];
    layers.forEach(function (layer) {
      var frames = allFrames ? layer.getFrames(): [layer.getFrameAt(currentFrameIndex)];
      frames.forEach(function (frame) {
        this.applyToolOnFrame_(frame, altKey);
      }.bind(this));
    }.bind(this));
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };

})();