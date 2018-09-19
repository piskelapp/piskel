(function () {
  var ns = $.namespace('pskl.controller.preview');

  ns.PreviewActionsController = function (previewController, container) {
    this.previewController = previewController;
    this.piskelController = previewController.piskelController;
    this.container = container;

    this.onionSkinShortcut = pskl.service.keyboard.Shortcuts.MISC.ONION_SKIN;
    this.toggleGridShortcut = pskl.service.keyboard.Shortcuts.MISC.TOGGLE_GRID;

    this.fpsRangeInput = document.querySelector('#preview-fps');
    this.fpsCounterDisplay = document.querySelector('#display-fps');
    this.openPopupPreview = document.querySelector('.open-popup-preview-button');
    this.toggleGridButton = document.querySelector('.toggle-grid-button');
    this.previewSizeDropdown = document.querySelector('.preview-drop-down');
    this.previewSizes = {
      original: {
        button: document.querySelector('.original-size-button'),
        shortcut: pskl.service.keyboard.Shortcuts.MISC.X1_PREVIEW,
        tooltip: 'Original size preview'
      },
      best: {
        button: document.querySelector('.best-size-button'),
        shortcut: pskl.service.keyboard.Shortcuts.MISC.BEST_PREVIEW,
        tooltip: 'Best size preview'
      },
      full: {
        button: document.querySelector('.full-size-button'),
        shortcut: pskl.service.keyboard.Shortcuts.MISC.FULL_PREVIEW,
        tooltip: 'Full size preview'
      }
    };
    this.toggleOnionSkinButton = document.querySelector('.preview-toggle-onion-skin');
  };

  ns.PreviewActionsController.prototype.init = function () {
    this.fpsRangeInput.addEventListener('change', this.onFpsRangeInputUpdate_.bind(this));
    this.fpsRangeInput.addEventListener('input', this.onFpsRangeInputUpdate_.bind(this));

    var addEvent = pskl.utils.Event.addEventListener;
    addEvent(this.toggleOnionSkinButton, 'click', this.toggleOnionSkin_, this);
    addEvent(this.openPopupPreview, 'click', this.onOpenPopupPreviewClick_, this);
    addEvent(this.toggleGridButton, 'click', this.toggleGrid_, this);

    var registerShortcut = pskl.app.shortcutService.registerShortcut.bind(pskl.app.shortcutService);
    registerShortcut(this.onionSkinShortcut, this.toggleOnionSkin_.bind(this));
    registerShortcut(this.toggleGridShortcut, this.toggleGrid_.bind(this));

    var onionSkinTooltip = pskl.utils.TooltipFormatter.format('Toggle onion skin', this.onionSkinShortcut);
    this.toggleOnionSkinButton.setAttribute('title', onionSkinTooltip);

    for (var size in this.previewSizes) {
      if (this.previewSizes.hasOwnProperty(size)) {
        var previewSize = this.previewSizes[size];
        addEvent(previewSize.button, 'click', this.onChangePreviewSize_, this, size);
        registerShortcut(previewSize.shortcut, this.onChangePreviewSize_.bind(this, size));
        var tooltip = pskl.utils.TooltipFormatter.format(previewSize.tooltip, previewSize.shortcut);
        previewSize.button.setAttribute('title', tooltip);
      }
    }

    $.subscribe(Events.FRAME_SIZE_CHANGED, this.updatePreviewSizeButtons_.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
    $.subscribe(Events.FPS_CHANGED, this.updateFPS_.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.updateFPS_.bind(this));

    this.updatePreviewSizeButtons_();
    this.updateOnionSkinPreview_();
    this.selectPreviewSizeButton_();
    this.updateFPS_();
    this.updateMaxFPS_();
    this.updateToggleGridButton_();
  };

  ns.PreviewActionsController.prototype.updateToggleGridButton_ = function () {
    var gridEnabled = pskl.UserSettings.get(pskl.UserSettings.GRID_ENABLED);
    this.toggleGridButton.classList.toggle('icon-minimap-grid-white', !gridEnabled);
    this.toggleGridButton.classList.toggle('icon-minimap-grid-gold', gridEnabled);
    this.toggleGridButton.classList.toggle('preview-contextual-action-enabled', gridEnabled);
  };

  ns.PreviewActionsController.prototype.toggleGrid_ = function () {
    var gridEnabled = pskl.UserSettings.get(pskl.UserSettings.GRID_ENABLED);
    pskl.UserSettings.set(pskl.UserSettings.GRID_ENABLED, !gridEnabled);
  };

  ns.PreviewActionsController.prototype.updatePreviewSizeButtons_ = function () {
    var fullZoom = this.previewController.getZoom();
    var bestZoom = Math.floor(fullZoom);
    var seamlessModeEnabled = pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_MODE);

    var validSizes;
    if (fullZoom < 1) {
      this.disablePreviewSizeWidget_('No other option available');
      validSizes = ['full'];
    } else if (fullZoom === 1) {
      this.disablePreviewSizeWidget_('No other option available');
      validSizes = ['original'];
    } else if (seamlessModeEnabled) {
      this.disablePreviewSizeWidget_('Disabled in tile mode');
      validSizes = ['original'];
    } else {
      this.enablePreviewSizeWidget_();
      if (fullZoom === bestZoom) {
        // If the full zoom is the same as the best zoom, display the best option only as
        // it gives the exact factor information.
        validSizes = ['original', 'best'];
      } else if (bestZoom === 1) {
        // If best zoom is 1x, remove it as it is redundant with the original option.
        validSizes = ['full', 'original'];
      } else {
        validSizes = ['full', 'original', 'best'];
      }
    }

    // Update buttons content and status.
    this.previewSizes.best.button.textContent = Math.floor(fullZoom) + 'x';
    for (var size in this.previewSizes) {
      if (this.previewSizes.hasOwnProperty(size)) {
        var previewSize = this.previewSizes[size];
        var isSizeEnabled = validSizes.indexOf(size) != -1;

        // classList.toggle is not available on IE11.
        if (isSizeEnabled) {
          previewSize.button.classList.remove('preview-contextual-action-hidden');
        } else {
          previewSize.button.classList.add('preview-contextual-action-hidden');
        }
      }
    }

    // Update the selected preview size if the currently selected size is not valid.
    var selectedSize = pskl.UserSettings.get(pskl.UserSettings.PREVIEW_SIZE);
    if (validSizes.indexOf(selectedSize) === -1) {
      this.onChangePreviewSize_(validSizes[0]);
    }
  };

  ns.PreviewActionsController.prototype.enablePreviewSizeWidget_ = function () {
    this.previewSizeDropdown.classList.remove('preview-drop-down-disabled');
  };

  ns.PreviewActionsController.prototype.disablePreviewSizeWidget_ = function (reason) {
    // The .preview-disable-overlay is displayed on top of the preview size widget
    document.querySelector('.preview-disable-overlay').setAttribute('data-original-title', reason);
    this.previewSizeDropdown.classList.add('preview-drop-down-disabled');
  };

  ns.PreviewActionsController.prototype.onOpenPopupPreviewClick_ = function () {
    this.previewController.openPopupPreview();
  };

  ns.PreviewActionsController.prototype.onChangePreviewSize_ = function (size) {
    var previewSize = this.previewSizes[size];
    var isEnabled = !previewSize.button.classList.contains('preview-contextual-action-hidden');
    if (isEnabled) {
      pskl.UserSettings.set(pskl.UserSettings.PREVIEW_SIZE, size);
    }
  };

  ns.PreviewActionsController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.ONION_SKIN) {
      this.updateOnionSkinPreview_();
    } else if (name == pskl.UserSettings.MAX_FPS) {
      this.updateMaxFPS_();
    } else if (name === pskl.UserSettings.SEAMLESS_MODE) {
      this.updatePreviewSizeButtons_();
    } else if (name === pskl.UserSettings.GRID_ENABLED) {
      this.updateToggleGridButton_();
    } else {
      this.selectPreviewSizeButton_();
    }
  };

  ns.PreviewActionsController.prototype.updateOnionSkinPreview_ = function () {
    var enabledClassname = 'preview-toggle-onion-skin-enabled';
    var isEnabled = pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN);

    // classList.toggle is not available on IE11.
    if (isEnabled) {
      this.toggleOnionSkinButton.classList.add(enabledClassname);
    } else {
      this.toggleOnionSkinButton.classList.remove(enabledClassname);
    }
  };

  ns.PreviewActionsController.prototype.selectPreviewSizeButton_ = function () {
    var currentlySelected = document.querySelector('.size-button-selected');
    if (currentlySelected) {
      currentlySelected.classList.remove('size-button-selected');
    }

    var selectedSize = pskl.UserSettings.get(pskl.UserSettings.PREVIEW_SIZE);
    var previewSize = this.previewSizes[selectedSize];
    previewSize.button.classList.add('size-button-selected');
  };

  ns.PreviewActionsController.prototype.updateMaxFPS_ = function () {
    var maxFps = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    this.fpsRangeInput.setAttribute('max', maxFps);
    this.piskelController.setFPS(Math.min(maxFps, this.piskelController.getFPS()));
  };

  /**
   * Event handler triggered on 'input' or 'change' events.
   */
  ns.PreviewActionsController.prototype.onFpsRangeInputUpdate_ = function (evt) {
    var fps = parseInt(this.fpsRangeInput.value, 10);
    this.piskelController.setFPS(fps);
    // blur only on 'change' events, as blurring on 'input' breaks on Firefox
    if (evt.type === 'change') {
      this.fpsRangeInput.blur();
    }
  };

  ns.PreviewActionsController.prototype.updateFPS_ = function () {
    var fps = this.piskelController.getFPS();
    if (fps !== this.fpsRangeInput.value) {
      // reset
      this.fpsRangeInput.value = 0;
      // set proper value
      this.fpsRangeInput.value = fps;
      this.fpsCounterDisplay.innerHTML = fps + ' FPS';
    }
  };

  ns.PreviewActionsController.prototype.toggleOnionSkin_ = function () {
    var currentValue = pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN);
    pskl.UserSettings.set(pskl.UserSettings.ONION_SKIN, !currentValue);
  };
})();
