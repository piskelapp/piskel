(function () {
  var ns = $.namespace('pskl.controller');
  var SHOW_MORE_CLASS = 'show-more';

  ns.TransformationsController = function () {
    this.tools = [
      new pskl.tools.transform.Flip(),
      new pskl.tools.transform.Rotate(),
      new pskl.tools.transform.Clone(),
      new pskl.tools.transform.Center(),
      new pskl.tools.transform.Crop(),
      new pskl.tools.transform.PaletteApply(),
    ];

    this.toolIconBuilder = new pskl.tools.ToolIconBuilder();
  };

  ns.TransformationsController.prototype.init = function () {
    this.container = document.querySelector('.transformations-container');
    this.container.addEventListener('click', this.onTransformationClick_.bind(this));

    this.showMoreLink = this.container.querySelector('.transformations-show-more-link');
    this.showMoreLink.addEventListener('click', this.toggleShowMoreTools_.bind(this));

    this.createToolsDom_();
    this.updateShowMoreLink_();

    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
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
    if (toolId) {
      this.applyTool(toolId, evt);
    }
  };

  ns.TransformationsController.prototype.toggleShowMoreTools_ = function (evt) {
    var showMore = pskl.UserSettings.get(pskl.UserSettings.TRANSFORM_SHOW_MORE);
    pskl.UserSettings.set(pskl.UserSettings.TRANSFORM_SHOW_MORE, !showMore);
  };

  ns.TransformationsController.prototype.onUserSettingsChange_ = function (evt, settingName) {
    if (settingName == pskl.UserSettings.TRANSFORM_SHOW_MORE) {
      this.updateShowMoreLink_();
    }
  };

  ns.TransformationsController.prototype.updateShowMoreLink_ = function () {
    var showMoreEnabled = pskl.UserSettings.get(pskl.UserSettings.TRANSFORM_SHOW_MORE);
    this.container.classList.toggle(SHOW_MORE_CLASS, showMoreEnabled);

    // Hide the link in case there are 4 or less tools available.
    this.showMoreLink.classList.toggle('hidden', this.tools.length < 5);
  };

  ns.TransformationsController.prototype.createToolsDom_ = function() {
    var html = this.tools.reduce(function (p, tool) {
      return p + this.toolIconBuilder.createIcon(tool, 'left');
    }.bind(this), '');
    var toolsContainer = this.container.querySelector('.tools-wrapper');
    toolsContainer.innerHTML = html;
  };
})();
