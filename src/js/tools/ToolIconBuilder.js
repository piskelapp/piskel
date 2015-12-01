(function () {
  var ns = $.namespace('pskl.tools');

  ns.ToolIconBuilder = function () {};

  ns.ToolIconBuilder.prototype.createIcon = function (tool, tooltipPosition) {
    tooltipPosition = tooltipPosition || 'right';
    var tpl = pskl.utils.Template.get('drawingTool-item-template');
    return pskl.utils.Template.replace(tpl, {
      cssclass : ['tool-icon', 'icon-' + tool.toolId].join(' '),
      toolid : tool.toolId,
      title : this.getTooltipText(tool),
      tooltipposition : tooltipPosition
    });
  };

  ns.ToolIconBuilder.prototype.getTooltipText = function(tool) {
    var descriptors = tool.tooltipDescriptors;
    return pskl.utils.TooltipFormatter.format(tool.getHelpText(), tool.shortcut, descriptors);
  };
})();
