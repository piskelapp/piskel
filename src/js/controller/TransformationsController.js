(function () {
  var ns = $.namespace('pskl.controller');

  ns.TransformationsController = function () {

    var toDescriptor = function (id, shortcut, instance) {
      return {id:id, shortcut:shortcut, instance:instance};
    };

    this.tools = [
      toDescriptor('flip', 'F', new pskl.tools.transform.Flip()),
      toDescriptor('rotate', 'V', new pskl.tools.transform.Rotate())
    ];

    this.toolIconRenderer = new pskl.tools.IconMarkupRenderer();
  };

  ns.TransformationsController.prototype.init = function () {
    var container = document.querySelector('.transformations-container');
    this.toolsContainer = container.querySelector('.tools-wrapper');
    container.addEventListener('click', this.onTransformationClick.bind(this));
    this.createToolsDom_();
  };


  ns.TransformationsController.prototype.onTransformationClick = function (evt) {
    var toolId = evt.target.dataset.toolId;
    this.tools.forEach(function (tool) {
      if (tool.instance.toolId === toolId) {
        tool.instance.apply(evt);
      }
    }.bind(this));
  };

  ns.TransformationsController.prototype.createToolsDom_ = function() {
    var html = this.tools.reduce(function (p, tool) {
      return p + this.toolIconRenderer.render(tool.instance, tool.shortcut);
    }.bind(this), '');
    this.toolsContainer.innerHTML = html;
  };
})();