(function () {
  var ns = $.namespace('pskl.controller.settings.preferences');

  ns.MiscPreferencesController = function (piskelController, preferencesController) {
    this.piskelController = piskelController;
    this.preferencesController = preferencesController;
  };

  pskl.utils.inherit(ns.MiscPreferencesController, pskl.controller.settings.AbstractSettingController);

  ns.MiscPreferencesController.prototype.init = function () {

    this.backgroundContainer = document.querySelector('.background-picker-wrapper');
    this.addEventListener(this.backgroundContainer, 'click', this.onBackgroundClick_);

    // Highlight selected background :
    var background = pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND);
    var selectedBackground = this.backgroundContainer.querySelector('[data-background=' + background + ']');
    if (selectedBackground) {
      selectedBackground.classList.add('selected');
    }

    // Max FPS
    var maxFpsInput = document.querySelector('.max-fps-input');
    maxFpsInput.value = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    this.addEventListener(maxFpsInput, 'change', this.onMaxFpsChange_);

    // Color format
    var colorFormat = pskl.UserSettings.get(pskl.UserSettings.COLOR_FORMAT);
    var colorFormatSelect = document.querySelector('.color-format-select');
    var selectedColorFormatOption = colorFormatSelect.querySelector('option[value="' + colorFormat + '"]');
    if (selectedColorFormatOption) {
      selectedColorFormatOption.setAttribute('selected', 'selected');
    }
    this.addEventListener(colorFormatSelect, 'change', this.onColorFormatChange_);

    // Layer preview opacity
    var layerOpacityInput = document.querySelector('.layer-opacity-input');
    layerOpacityInput.value = pskl.UserSettings.get(pskl.UserSettings.LAYER_OPACITY);
    this.addEventListener(layerOpacityInput, 'change', this.onLayerOpacityChange_);
    this.addEventListener(layerOpacityInput, 'input', this.onLayerOpacityChange_);
    this.updateLayerOpacityText_(layerOpacityInput.value);
  };

  ns.MiscPreferencesController.prototype.onBackgroundClick_ = function (evt) {
    var target = evt.target;
    var background = target.dataset.background;
    if (background) {
      pskl.UserSettings.set(pskl.UserSettings.CANVAS_BACKGROUND, background);
      var selected = this.backgroundContainer.querySelector('.selected');
      if (selected) {
        selected.classList.remove('selected');
      }
      target.classList.add('selected');
    }
  };

  ns.MiscPreferencesController.prototype.onColorFormatChange_ = function (evt) {
    pskl.UserSettings.set(pskl.UserSettings.COLOR_FORMAT, evt.target.value);
  };

  ns.MiscPreferencesController.prototype.onMaxFpsChange_ = function (evt) {
    var target = evt.target;
    var fps = parseInt(target.value, 10);
    if (fps && !isNaN(fps)) {
      pskl.UserSettings.set(pskl.UserSettings.MAX_FPS, fps);
    } else {
      target.value = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    }
  };

  ns.MiscPreferencesController.prototype.onLayerOpacityChange_ = function (evt) {
    var target = evt.target;
    var opacity = parseFloat(target.value);
    if (!isNaN(opacity)) {
      pskl.UserSettings.set(pskl.UserSettings.LAYER_OPACITY, opacity);
      pskl.UserSettings.set(pskl.UserSettings.LAYER_PREVIEW, opacity !== 0);
      this.updateLayerOpacityText_(opacity);
    } else {
      target.value = pskl.UserSettings.get(pskl.UserSettings.LAYER_OPACITY);
    }
  };

  ns.MiscPreferencesController.prototype.updateLayerOpacityText_ = function (opacity) {
    var layerOpacityText = document.querySelector('.layer-opacity-text');
    layerOpacityText.innerHTML = (opacity * 1).toFixed(2);
  };
})();
