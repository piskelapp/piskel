(function () {
  var ns = $.namespace('pskl.tools');

  ns.IconMarkupRenderer = function () {};

  ns.IconMarkupRenderer.prototype.render = function (tool, shortcut, tooltipPosition) {
    tooltipPosition = tooltipPosition || 'right';
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
    return pskl.utils.TooltipFormatter.format(tool.getHelpText(), shortcut, descriptors);
  };
})();
