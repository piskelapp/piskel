(function () {
  var ns = $.namespace('pskl.utils');

  ns.TooltipFormatter = {};


  ns.TooltipFormatter.formatForTool = function(shortcut, descriptors, helpText) {
    var tpl = pskl.utils.Template.get('drawingTool-tooltipContainer-template');
    return pskl.utils.Template.replace(tpl, {
      helptext : helpText,
      shortcut : shortcut,
      descriptors : this.formatToolDescriptors_(descriptors)
    });
  };


  ns.TooltipFormatter.formatToolDescriptors_ = function(descriptors) {
    descriptors = descriptors || [];
    return descriptors.reduce(function (p, descriptor) {
      return p += this.formatToolDescriptor_(descriptor);
    }.bind(this), '');
  };

  ns.TooltipFormatter.formatToolDescriptor_ = function(descriptor) {
    var tpl;
    if (descriptor.key) {
      tpl = pskl.utils.Template.get('drawingTool-tooltipDescriptor-template');
      descriptor.key = descriptor.key.toUpperCase();
      if (pskl.utils.UserAgent.isMac) {
        descriptor.key = descriptor.key.replace('CTRL', 'CMD');
      }
    } else {
      tpl = pskl.utils.Template.get('drawingTool-simpleTooltipDescriptor-template');
    }
    return pskl.utils.Template.replace(tpl, descriptor);
  };
})();