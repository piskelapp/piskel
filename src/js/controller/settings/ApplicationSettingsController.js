(function () {
  var ns = $.namespace("pskl.controller.settings");

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
    var selectedOption = gridSelect.querySelector('option[value="'+gridWidth+'"]');
    if (selectedOption) {
      selectedOption.setAttribute('selected', 'selected');
    }

    this.addEventListener(gridSelect, 'change', this.onGridWidthChange_);

    // Tiled preview
    var tiledPreview = pskl.UserSettings.get(pskl.UserSettings.TILED_PREVIEW);
    var tiledPreviewCheckbox = document.querySelector('.tiled-preview-checkbox');
    if (tiledPreview) {
      tiledPreviewCheckbox.setAttribute('checked', tiledPreview);
    }
    this.addEventListener(tiledPreviewCheckbox, 'change', this.onTiledPreviewChange_);

    // Max FPS
    var maxFpsInput = document.querySelector('.max-fps-input');
    maxFpsInput.value = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    this.addEventListener(maxFpsInput, 'change', this.onMaxFpsChange_);

    // Form
    this.applicationSettingsForm = document.querySelector('[name="application-settings-form"]');
    this.addEventListener(this.applicationSettingsForm, 'submit', this.onFormSubmit_);
  };

  ns.ApplicationSettingsController.prototype.onGridWidthChange_ = function (evt) {
    var width = parseInt(evt.target.value, 10);
    pskl.UserSettings.set(pskl.UserSettings.GRID_WIDTH, width);
  };

  ns.ApplicationSettingsController.prototype.onTiledPreviewChange_ = function (evt) {
    pskl.UserSettings.set(pskl.UserSettings.TILED_PREVIEW, evt.currentTarget.checked);
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

  ns.ApplicationSettingsController.prototype.onFormSubmit_ = function (evt) {
    evt.preventDefault();
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

})();