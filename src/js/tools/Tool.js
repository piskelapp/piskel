(function () {
  var ns = $.namespace('pskl.tools');

  ns.Tool = function () {
    this.toolId = "tool";
    this.helpText = "Abstract tool";
    this.tooltipDescriptors = [];
  };

  ns.Tool.prototype.getHelpText = function() {
    return this.helpText;
  };

  ns.Tool.prototype.getId = function() {
    return this.toolId;
  };
})();