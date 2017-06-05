(function () {
  var ns = $.namespace('pskl.controller.settings.application');

  ns.GridApplicationController = function (piskelController, applicationController) {
    this.piskelController = piskelController;
    this.applicationController = applicationController;
    this.sizePicker = new pskl.widgets.SizePicker(this.onSizePickerChanged_.bind(this));
  };

  pskl.utils.inherit(ns.GridApplicationController, pskl.controller.settings.AbstractSettingController);

  ns.GridApplicationController.prototype.init = function () {
    var isEnabled = pskl.UserSettings.get(pskl.UserSettings.GRID_ENABLED);
    var enableGridCheckbox = document.querySelector('.enable-grid-checkbox');
    if (isEnabled) {
      enableGridCheckbox.setAttribute('checked', 'true');
    }
    this.addEventListener(enableGridCheckbox, 'change', this.onEnableGridChange_);

    // Grid size
    var gridWidth = pskl.UserSettings.get(pskl.UserSettings.GRID_WIDTH);
    this.sizePicker.init(document.querySelector('.grid-size-container'));
    this.sizePicker.setSize(gridWidth);
  };

  ns.GridApplicationController.prototype.destroy = function () {
    this.sizePicker.destroy();
    this.superclass.destroy.call(this);
  };

  ns.GridApplicationController.prototype.onSizePickerChanged_ = function (size) {
    pskl.UserSettings.set(pskl.UserSettings.GRID_WIDTH, size);
  };

  ns.GridApplicationController.prototype.onEnableGridChange_ = function (evt) {
    pskl.UserSettings.set(pskl.UserSettings.GRID_ENABLED, evt.currentTarget.checked);
  };
})();
