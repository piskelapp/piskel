(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.PaletteApply = function () {
    this.toolId = 'tool-colorswap';
    this.helpText = 'Apply the currently selected palette\'s colors to a frame via their index numbers';
    this.tooltipDescriptors = [
      {key : 'ctrl', description : 'Apply to all layers'},
      {key : 'shift', description : 'Apply to all frames'}
    ];
  };

  pskl.utils.inherit(ns.PaletteApply, ns.AbstractTransformTool);

  ns.PaletteApply.prototype.applyToolOnFrame_ = function (frame, altKey) {

    var allLayers = pskl.utils.UserAgent.isMac ?  event.metaKey : event.ctrlKey;
    var allFrames = event.shiftKey;

    var currentPalette = pskl.app.palettesListController.getSelectedPaletteColors_();
    this.swapColors_(currentPalette, allLayers, allFrames);

  };

  ns.PaletteApply.prototype.swapColors_ = function(newPalette, allLayers, allFrames) {
    var currentFrameIndex = pskl.app.piskelController.getCurrentFrameIndex();
    var layers = allLayers ? pskl.app.piskelController.getLayers() : [pskl.app.piskelController.getCurrentLayer()];
    layers.forEach(function (layer) {
      var frames = allFrames ? layer.getFrames() : [layer.getFrameAt(currentFrameIndex)];
      frames.forEach(function (frame) {
        pskl.app.currentColorsService.applyCurrentPaletteToIndexedPixels(newPalette, frame, true);
      }.bind(this));
    }.bind(this));
  };

})();
