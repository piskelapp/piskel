(function () {
  var ns = $.namespace('pskl.utils');

  ns.TooltipFormatter = {};

  ns.TooltipFormatter.format = function(helpText, shortcut, descriptors) {
    var tpl = pskl.utils.Template.get('tooltip-container-template');
    shortcut = shortcut ? '(' + shortcut.getDisplayKey() + ')' : '';
    return pskl.utils.Template.replace(tpl, {
      helptext : helpText,
      shortcut : shortcut,
      descriptors : this.formatDescriptors_(descriptors)
    });
  };

  ns.TooltipFormatter.formatDescriptors_ = function(descriptors) {
    descriptors = descriptors || [];
    return descriptors.reduce(function (p, descriptor) {
      return p += this.formatDescriptor_(descriptor);
    }.bind(this), '');
  };

  ns.TooltipFormatter.formatDescriptor_ = function(descriptor) {
    var tpl;
    if (descriptor.key) {
      tpl = pskl.utils.Template.get('tooltip-modifier-descriptor-template');
      descriptor.key = descriptor.key.toUpperCase();
      if (pskl.utils.UserAgent.isMac) {
        descriptor.key = descriptor.key.replace('CTRL', 'CMD');
      }
    } else {
      tpl = pskl.utils.Template.get('tooltip-simple-descriptor-template');
    }
    return pskl.utils.Template.replace(tpl, descriptor);
  };
})();
