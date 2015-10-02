(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.AbstractTransformTool = function () {};

  pskl.utils.inherit(ns.AbstractTransformTool, pskl.tools.Tool);

  ns.AbstractTransformTool.prototype.apply = function (evt) {
    var allFrames = evt.shiftKey;
    var allLayers = evt.ctrlKey;

    this.applyTool_(evt.altKey, allFrames, allLayers);

    $.publish(Events.PISKEL_RESET);
    this.raiseSaveStateEvent_({
      altKey : evt.altKey,
      allFrames : allFrames,
      allLayers : allLayers
    });
  };

  ns.AbstractTransformTool.prototype.applyTool_ = function (altKey, allFrames, allLayers) {
    var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
    var layers = allLayers ? pskl.app.piskelController.getLayers() : [pskl.app.piskelController.getCurrentLayer()];
    layers.forEach(function (layer) {
      var frames = allFrames ? layer.getFrames() : [layer.getFrameAt(currentFrameIndex)];
      frames.forEach(function (frame) {
        this.applyToolOnFrame_(frame, altKey);
      }.bind(this));
    }.bind(this));
  };

  ns.AbstractTransformTool.prototype.raiseSaveStateEvent_ = function (replayData) {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.REPLAY,
      scope : this,
      replay : replayData
    });
  };

  ns.AbstractTransformTool.prototype.replay = function (frame, replayData) {
    this.applyTool_(replayData.altKey, replayData.allFrames, replayData.allLayers);
  };

})();
