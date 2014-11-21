(function () {
  var ns = $.namespace('pskl.controller');

  ns.TransformationsController = function () {

    var toDescriptor = function (id, shortcut, instance) {
      return {id:id, shortcut:shortcut, instance:instance};
    };

    this.tools = [
      toDescriptor('flip', 'F', new pskl.tools.transform.Flip())
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
    var tool = pskl.utils.Array.find(this.tools, function (tool) {
      return tool.id === toolId;
    });
    if (tool) {
      tool.instance.apply(evt);
    }
  };

  /**
   * @private
   */
  ns.TransformationsController.prototype.createToolsDom_ = function() {
    var html = '';
    for(var i = 0 ; i < this.tools.length ; i++) {
      var tool = this.tools[i];
      html += this.toolIconRenderer.render(tool.instance, tool.shortcut);
    }
    this.toolsContainer.innerHTML = html;
  };
})();