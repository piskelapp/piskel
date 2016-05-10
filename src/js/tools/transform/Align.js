(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Align = function () {
    this.toolId = 'tool-align';
    this.helpText = 'Align selection to the center';
    this.tooltipDescriptors = [
      {key : 'ctrl', description : 'Apply to all layers'},
      {key : 'shift', description : 'Apply to all frames'}
    ];
  };

  pskl.utils.inherit(ns.Align, ns.AbstractTransformTool);

  ns.Align.prototype.applyToolOnFrame_ = function (frame, altKey) {
    ns.TransformUtils.align(frame);
  };

})();
