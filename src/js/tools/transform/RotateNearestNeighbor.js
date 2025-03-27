(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.RotateNearestNeighbor = function () {
    this.toolId = 'tool-rotate-nearest-neighbor';
    this.helpText = 'Rotate selection using nearest neighbor interpolation';
    this.angle = 15; // Default rotation step in degrees
    this.tooltipDescriptors = [
      {key : 'alt', description : 'Clockwise rotation'},
      {key : 'ctrl', description : 'Apply to all layers'},
      {key : 'shift', description : 'Apply to all frames'}];
  };

  pskl.utils.inherit(ns.RotateNearestNeighbor, ns.AbstractTransformTool);

  ns.RotateNearestNeighbor.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var direction;

    if (altKey) {
      direction = ns.TransformUtils.CLOCKWISE;
    } else {
      direction = ns.TransformUtils.COUNTERCLOCKWISE;
    }

    ns.TransformUtils.RotateNearestNeighbor(frame, direction);
  };

})();
