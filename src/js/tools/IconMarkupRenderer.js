(function () {
  var ns = $.namespace('pskl.tools');

  ns.IconMarkupRenderer = function () {};

  ns.IconMarkupRenderer.prototype.render = function (tool, shortcut, tooltipPosition) {
    tooltipPosition = tooltipPosition || 'right';
    shortcut = shortcut ?  '(' + shortcut + ')' : '';
    var tpl = pskl.utils.Template.get('drawingTool-item-template');
    return pskl.utils.Template.replace(tpl, {
      cssclass : ['tool-icon', tool.toolId].join(' '),
      toolid : tool.toolId,
      title : this.getTooltipText(tool, shortcut),
      tooltipposition : tooltipPosition
    });
  };

  ns.IconMarkupRenderer.prototype.getTooltipText = function(tool, shortcut) {
    var descriptors = tool.tooltipDescriptors;
    var tpl = pskl.utils.Template.get('drawingTool-tooltipContainer-template');
    return pskl.utils.Template.replace(tpl, {
      helptext : tool.getHelpText(),
      shortcut : shortcut,
      descriptors : this.formatToolDescriptors_(descriptors)
    });
  };


  ns.IconMarkupRenderer.prototype.formatToolDescriptors_ = function(descriptors) {
    descriptors = descriptors || [];
    return descriptors.reduce(function (p, descriptor) {
      return p += this.formatToolDescriptor_(descriptor);
    }.bind(this), '');
  };

  ns.IconMarkupRenderer.prototype.formatToolDescriptor_ = function(descriptor) {
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