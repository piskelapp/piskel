(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Flip = function () {
    this.toolId = 'tool-flip';
    this.helpText = 'Flip vertically';

    this.tooltipDescriptors = [{key : 'alt', description : 'Flip horizontally'}];
    if (Constants.ENABLE_MULTIPLE_LAYERS) {
      this.tooltipDescriptors.push({key : 'ctrl', description : 'Apply to all layers'});
    }
    this.tooltipDescriptors.push({key : 'shift', description : 'Apply to all frames'});
  };

  pskl.utils.inherit(ns.Flip, ns.AbstractTransformTool);

  ns.Flip.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var axis;

    if (altKey) {
      axis = ns.TransformUtils.HORIZONTAL;
    } else {
      axis = ns.TransformUtils.VERTICAL;
    }

    ns.TransformUtils.flip(frame, axis);
  };

})();
