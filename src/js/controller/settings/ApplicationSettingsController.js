(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.ApplicationSettingsController = function () {};

  pskl.utils.inherit(ns.ApplicationSettingsController, pskl.controller.settings.AbstractSettingController);

  ns.ApplicationSettingsController.prototype.init = function() {
    this.backgroundContainer = document.querySelector('.background-picker-wrapper');
    this.addEventListener(this.backgroundContainer, 'click', this.onBackgroundClick_);

    // Highlight selected background :
    var background = pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND);
    var selectedBackground = this.backgroundContainer.querySelector('[data-background=' + background + ']');
    if (selectedBackground) {
      selectedBackground.classList.add('selected');
    }

    // Grid display and size
    var gridWidth = pskl.UserSettings.get(pskl.UserSettings.GRID_WIDTH);
    var gridSelect = document.querySelector('.grid-width-select');
    var selectedOption = gridSelect.querySelector('option[value="' + gridWidth + '"]');
    if (selectedOption) {
      selectedOption.setAttribute('selected', 'selected');
    }

    this.addEventListener(gridSelect, 'change', this.onGridWidthChange_);

    // Seamless mode
    var seamlessMode = pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_MODE);
    var seamlessModeCheckbox = document.querySelector('.seamless-mode-checkbox');
    if (seamlessMode) {
      seamlessModeCheckbox.setAttribute('checked', seamlessMode);
    }
    this.addEventListener(seamlessModeCheckbox, 'change', this.onSeamlessModeChange_);

    // Max FPS
    var maxFpsInput = document.querySelector('.max-fps-input');
    maxFpsInput.value = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    this.addEventListener(maxFpsInput, 'change', this.onMaxFpsChange_);

    // Plane preview opacity
    var planeOpacityInput = document.querySelector('.plane-opacity-input');
    planeOpacityInput.value = pskl.UserSettings.get(pskl.UserSettings.PLANE_OPACITY);
    this.addEventListener(planeOpacityInput, 'change', this.onPlaneOpacityChange_);
    this.updatePlaneOpacityText_(planeOpacityInput.value);

    // Layer preview opacity
    var layerOpacityInput = document.querySelector('.layer-opacity-input');
    layerOpacityInput.value = pskl.UserSettings.get(pskl.UserSettings.LAYER_OPACITY);
    this.addEventListener(layerOpacityInput, 'change', this.onLayerOpacityChange_);
    this.updateLayerOpacityText_(layerOpacityInput.value);

    // Form
    this.applicationSettingsForm = document.querySelector('[name="application-settings-form"]');
    this.addEventListener(this.applicationSettingsForm, 'submit', this.onFormSubmit_);
  };

  ns.ApplicationSettingsController.prototype.onGridWidthChange_ = function (evt) {
    var width = parseInt(evt.target.value, 10);
    pskl.UserSettings.set(pskl.UserSettings.GRID_WIDTH, width);
  };

  ns.ApplicationSettingsController.prototype.onSeamlessModeChange_ = function (evt) {
    pskl.UserSettings.set(pskl.UserSettings.SEAMLESS_MODE, evt.currentTarget.checked);
  };

  ns.ApplicationSettingsController.prototype.onBackgroundClick_ = function (evt) {
    var target = evt.target;
    var background = target.dataset.background;
    if (background) {
      pskl.UserSettings.set(pskl.UserSettings.CANVAS_BACKGROUND, background);
      var selected = this.backgroundContainer.querySelector('.selected');
      if (selected) {
        selected.classList.remove('selected');
      }
      target.classList.add('selected');
    }
  };

  ns.ApplicationSettingsController.prototype.onMaxFpsChange_ = function (evt) {
    var target = evt.target;
    var fps = parseInt(target.value, 10);
    if (fps && !isNaN(fps)) {
      pskl.UserSettings.set(pskl.UserSettings.MAX_FPS, fps);
    } else {
      target.value = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    }
  };

  ns.ApplicationSettingsController.prototype.onPlaneOpacityChange_ = function (evt) {
    var target = evt.target;
    var opacity = parseFloat(target.value);
    if (!isNaN(opacity)) {
      pskl.UserSettings.set(pskl.UserSettings.PLANE_OPACITY, opacity);
      pskl.UserSettings.set(pskl.UserSettings.PLANE_PREVIEW, opacity !== 0);
      this.updatePlaneOpacityText_(opacity);
    } else {
      target.value = pskl.UserSettings.get(pskl.UserSettings.PLANE_OPACITY);
    }
  };

  ns.ApplicationSettingsController.prototype.onLayerOpacityChange_ = function (evt) {
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

  ns.ApplicationSettingsController.prototype.updatePlaneOpacityText_ = function (opacity) {
    var planeOpacityText = document.querySelector('.plane-opacity-text');
    planeOpacityText.innerHTML = opacity;
  };

  ns.ApplicationSettingsController.prototype.updateLayerOpacityText_ = function (opacity) {
    var layerOpacityText = document.querySelector('.layer-opacity-text');
    layerOpacityText.innerHTML = opacity;
  };

  ns.ApplicationSettingsController.prototype.onFormSubmit_ = function (evt) {
    evt.preventDefault();
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };
})();
