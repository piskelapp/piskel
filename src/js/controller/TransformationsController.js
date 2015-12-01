(function () {
  var ns = $.namespace('pskl.controller');

  ns.TransformationsController = function () {
    this.tools = [
      new pskl.tools.transform.Flip(),
      new pskl.tools.transform.Rotate(),
      new pskl.tools.transform.Clone()
    ];

    this.toolIconBuilder = new pskl.tools.ToolIconBuilder();
  };

  ns.TransformationsController.prototype.init = function () {
    var container = document.querySelector('.transformations-container');
    this.toolsContainer = container.querySelector('.tools-wrapper');
    container.addEventListener('click', this.onTransformationClick_.bind(this));
    this.createToolsDom_();
  };

  ns.TransformationsController.prototype.applyTool = function (toolId, evt) {
    this.tools.forEach(function (tool) {
      if (tool.toolId === toolId) {
        $.publish(Events.TRANSFORMATION_EVENT, [toolId, evt]);
        tool.applyTransformation(evt);
      }
    }.bind(this));
  };

  ns.TransformationsController.prototype.onTransformationClick_ = function (evt) {
    var toolId = evt.target.dataset.toolId;
    this.applyTool(toolId, evt);
  };

  ns.TransformationsController.prototype.createToolsDom_ = function() {
    var html = this.tools.reduce(function (p, tool) {
      return p + this.toolIconBuilder.createIcon(tool, 'left');
    }.bind(this), '');
    this.toolsContainer.innerHTML = html;
  };
})();
