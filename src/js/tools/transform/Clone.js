(function () {
  var ns = $.namespace('pskl.tools.transform');

   ns.Clone = function () {
    this.toolId = "tool-clone";
    this.helpText = "Clone current layer to all frames";
    this.tooltipDescriptors = [];
   };

  pskl.utils.inherit(ns.Clone, ns.Transform);

   ns.Clone.prototype.apply = function (evt) {
    var ref = pskl.app.piskelController.getCurrentFrame();
    var layer = pskl.app.piskelController.getCurrentLayer();
    layer.getFrames().forEach(function (frame) {
      if (frame !==  ref) {
        frame.setPixels(ref.getPixels());
      }
    });
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
   };
})();