(function () {
  var ns = $.namespace("pskl.controller.settings.resize");

  ns.DefaultSizeController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(
    ns.DefaultSizeController,
    pskl.controller.settings.AbstractSettingController
  );

  /**
   * Returns the default size from the user settings. The stored value is sanitized
   * since it may have been saved by an older version without any size limit.
   */
  ns.DefaultSizeController.getDefaultSize = function () {
    var defaultSize = pskl.UserSettings.get(pskl.UserSettings.DEFAULT_SIZE);
    return pskl.utils.ResizeUtils.sanitizeSize(
      defaultSize.width,
      defaultSize.height,
      { width: Constants.DEFAULT.WIDTH, height: Constants.DEFAULT.HEIGHT }
    );
  };

  ns.DefaultSizeController.prototype.init = function () {
    this.container = document.querySelector(".settings-default-size");

    var defaultSize = ns.DefaultSizeController.getDefaultSize();

    this.widthInput = this.container.querySelector('[name="default-width"]');
    this.heightInput = this.container.querySelector('[name="default-height"]');

    this.widthInput.value = defaultSize.width;
    this.heightInput.value = defaultSize.height;

    this.defaultSizeForm = this.container.querySelector("form");
    this.addEventListener(this.defaultSizeForm, "submit", this.onFormSubmit_);
  };

  ns.DefaultSizeController.prototype.onFormSubmit_ = function (evt) {
    evt.preventDefault();

    var size = pskl.utils.ResizeUtils.sanitizeSize(
      this.widthInput.value,
      this.heightInput.value,
      ns.DefaultSizeController.getDefaultSize()
    );

    pskl.UserSettings.set(pskl.UserSettings.DEFAULT_SIZE, size);
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };
})();
