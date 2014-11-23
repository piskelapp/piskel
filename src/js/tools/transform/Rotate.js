(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Rotate = function () {
    this.toolId = "tool-rotate";
    this.helpText = "Counter-clockwise rotation";
    this.tooltipDescriptors = [
      {key : 'alt', description : 'Clockwise rotation'},
      {key : 'ctrl', description : 'Apply to all layers'},
      {key : 'shift', description : 'Apply to all frames'}];
  };

  pskl.utils.inherit(ns.Rotate, ns.Transform);

  ns.Rotate.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var direction;

    if (altKey) {
      direction = pskl.utils.FrameTransform.CLOCKWISE;
    } else {
      direction = pskl.utils.FrameTransform.COUNTERCLOCKWISE;
    }

    pskl.utils.FrameTransform.rotate(frame, direction);
  };

})();