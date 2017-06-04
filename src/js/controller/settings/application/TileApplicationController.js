(function () {
  var ns = $.namespace('pskl.controller.settings.application');

  ns.TileApplicationController = function (piskelController, applicationController) {
    this.piskelController = piskelController;
    this.applicationController = applicationController;
  };

  pskl.utils.inherit(ns.TileApplicationController, pskl.controller.settings.AbstractSettingController);

  ns.TileApplicationController.prototype.init = function () {
    // Seamless mode
    var seamlessMode = pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_MODE);
    var seamlessModeCheckbox = document.querySelector('.seamless-mode-checkbox');
    if (seamlessMode) {
      seamlessModeCheckbox.setAttribute('checked', seamlessMode);
    }
    this.addEventListener(seamlessModeCheckbox, 'change', this.onSeamlessModeChange_);

    // Seamless mask opacity
    var seamlessOpacityInput = document.querySelector('.seamless-opacity-input');
    seamlessOpacityInput.value = pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_OPACITY);
    this.addEventListener(seamlessOpacityInput, 'change', this.onSeamlessOpacityChange_);
    this.addEventListener(seamlessOpacityInput, 'input', this.onSeamlessOpacityChange_);
    this.updateSeamlessOpacityText_(seamlessOpacityInput.value);
  };

  ns.TileApplicationController.prototype.onSeamlessModeChange_ = function (evt) {
    pskl.UserSettings.set(pskl.UserSettings.SEAMLESS_MODE, evt.currentTarget.checked);
  };

  ns.TileApplicationController.prototype.onSeamlessOpacityChange_ = function (evt) {
    var target = evt.target;
    var opacity = parseFloat(target.value);
    if (!isNaN(opacity)) {
      pskl.UserSettings.set(pskl.UserSettings.SEAMLESS_OPACITY, opacity);
      this.updateSeamlessOpacityText_(opacity);
    } else {
      target.value = pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_OPACITY);
    }
  };

  ns.TileApplicationController.prototype.updateSeamlessOpacityText_ = function (opacity) {
    var seamlessOpacityText = document.querySelector('.seamless-opacity-text');
    seamlessOpacityText.innerHTML = (opacity * 1).toFixed(2);
  };
})();
