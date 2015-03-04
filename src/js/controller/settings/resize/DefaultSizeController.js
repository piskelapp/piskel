(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  ns.DefaultSizeController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(ns.DefaultSizeController, pskl.controller.settings.AbstractSettingController);

  ns.DefaultSizeController.prototype.init = function () {
    this.container = document.querySelector('.settings-default-size');

    var defaultSize = pskl.UserSettings.get(pskl.UserSettings.DEFAULT_SIZE);

    this.widthInput = this.container.querySelector('[name="default-width"]');
    this.heightInput = this.container.querySelector('[name="default-height"]');

    this.widthInput.value = defaultSize.width;
    this.heightInput.value = defaultSize.height;

    this.defaultSizeForm = this.container.querySelector('form');
    this.addEventListener(this.defaultSizeForm, 'submit', this.onFormSubmit_);
  };

  ns.DefaultSizeController.prototype.onFormSubmit_ = function (evt) {
    evt.preventDefault();

    var defaultSize = pskl.UserSettings.get(pskl.UserSettings.DEFAULT_SIZE);

    var width = this.toNumber_(this.widthInput.value, defaultSize.width);
    var height = this.toNumber_(this.heightInput.value, defaultSize.height);

    pskl.UserSettings.set(pskl.UserSettings.DEFAULT_SIZE, {
      width : width,
      height : height
    });
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.DefaultSizeController.prototype.toNumber_ = function (strValue, defaultValue) {
    var value = parseInt(strValue, 10);
    if (value === 0 || isNaN(value)) {
      value = defaultValue;
    }
    return value;
  };
})();