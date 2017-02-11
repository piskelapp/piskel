(function () {
  var ns = $.namespace('pskl.controller.preview');

  // Preview is a square of PREVIEW_SIZE x PREVIEW_SIZE
  var PREVIEW_SIZE = 200;
  var RENDER_MINIMUM_DELAY = 300;

  ns.PreviewController = function (piskelController, container) {
    this.piskelController = piskelController;
    this.container = container;

    this.elapsedTime = 0;
    this.currentIndex = 0;

    this.onionSkinShortcut = pskl.service.keyboard.Shortcuts.MISC.ONION_SKIN;

    this.lastRenderTime = 0;
    this.renderFlag = true;

    this.fpsRangeInput = document.querySelector('#preview-fps');
    this.fpsCounterDisplay = document.querySelector('#display-fps');
    this.openPopupPreview = document.querySelector('.open-popup-preview-button');
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

    this.renderer = new pskl.rendering.frame.BackgroundImageFrameRenderer(this.container);
    this.popupPreviewController = new ns.PopupPreviewController(piskelController);
  };

  ns.PreviewController.prototype.init = function () {
    this.fpsRangeInput.addEventListener('change', this.onFpsRangeInputUpdate_.bind(this));
    this.fpsRangeInput.addEventListener('input', this.onFpsRangeInputUpdate_.bind(this));

    document.querySelector('.right-column').style.width = Constants.ANIMATED_PREVIEW_WIDTH + 'px';

    var addEvent = pskl.utils.Event.addEventListener;
    addEvent(this.toggleOnionSkinButton, 'click', this.toggleOnionSkin_, this);
    addEvent(this.openPopupPreview, 'click', this.onOpenPopupPreviewClick_, this);

    var registerShortcut = pskl.app.shortcutService.registerShortcut.bind(pskl.app.shortcutService);
    registerShortcut(this.onionSkinShortcut, this.toggleOnionSkin_.bind(this));

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

    $.subscribe(Events.FRAME_SIZE_CHANGED, this.onFrameSizeChange_.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
    $.subscribe(Events.PISKEL_SAVE_STATE, this.setRenderFlag_.bind(this, true));
    $.subscribe(Events.FPS_CHANGED, this.updateFPS_.bind(this));
    // On PISKEL_RESET, set the render flag and update the FPS input
    $.subscribe(Events.PISKEL_RESET, this.setRenderFlag_.bind(this, true));
    $.subscribe(Events.PISKEL_RESET, this.updateFPS_.bind(this));

    this.updatePreviewSizeButtons_();
    this.popupPreviewController.init();

    this.updateZoom_();
    this.updateOnionSkinPreview_();
    this.selectPreviewSizeButton_();
    this.updateFPS_();
    this.updateMaxFPS_();
    this.updateContainerDimensions_();
  };

  ns.PreviewController.prototype.updatePreviewSizeButtons_ = function () {
    var fullZoom = this.calculateZoom_();
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
      this.disablePreviewSizeWidget_('Disabled in seamless mode');
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

  ns.PreviewController.prototype.enablePreviewSizeWidget_ = function () {
    this.previewSizeDropdown.classList.remove('preview-drop-down-disabled');
  };

  ns.PreviewController.prototype.disablePreviewSizeWidget_ = function (reason) {
    // The .preview-disable-overlay is displayed on top of the preview size widget
    document.querySelector('.preview-disable-overlay').setAttribute('data-original-title', reason);
    this.previewSizeDropdown.classList.add('preview-drop-down-disabled');
  };

  ns.PreviewController.prototype.onOpenPopupPreviewClick_ = function () {
    this.popupPreviewController.open();
  };

  ns.PreviewController.prototype.onChangePreviewSize_ = function (size) {
    var previewSize = this.previewSizes[size];
    var isEnabled = !previewSize.button.classList.contains('preview-contextual-action-hidden');
    if (isEnabled) {
      pskl.UserSettings.set(pskl.UserSettings.PREVIEW_SIZE, size);
    }
  };

  ns.PreviewController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.ONION_SKIN) {
      this.updateOnionSkinPreview_();
    } else if (name == pskl.UserSettings.MAX_FPS) {
      this.updateMaxFPS_();
    } else if (name === pskl.UserSettings.SEAMLESS_MODE) {
      this.onFrameSizeChange_();
    } else {
      this.updateZoom_();
      this.selectPreviewSizeButton_();
      this.updateContainerDimensions_();
    }
  };

  ns.PreviewController.prototype.updateOnionSkinPreview_ = function () {
    var enabledClassname = 'preview-toggle-onion-skin-enabled';
    var isEnabled = pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN);

    // classList.toggle is not available on IE11.
    if (isEnabled) {
      this.toggleOnionSkinButton.classList.add(enabledClassname);
    } else {
      this.toggleOnionSkinButton.classList.remove(enabledClassname);
    }
  };

  ns.PreviewController.prototype.selectPreviewSizeButton_ = function () {
    var currentlySelected = document.querySelector('.size-button-selected');
    if (currentlySelected) {
      currentlySelected.classList.remove('size-button-selected');
    }

    var selectedSize = pskl.UserSettings.get(pskl.UserSettings.PREVIEW_SIZE);
    var previewSize = this.previewSizes[selectedSize];
    previewSize.button.classList.add('size-button-selected');
  };

  ns.PreviewController.prototype.updateMaxFPS_ = function () {
    var maxFps = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    this.fpsRangeInput.setAttribute('max', maxFps);
    this.piskelController.setFPS(Math.min(maxFps, this.piskelController.getFPS()));
  };

  ns.PreviewController.prototype.updateZoom_ = function () {
    var previewSize = pskl.UserSettings.get(pskl.UserSettings.PREVIEW_SIZE);

    var zoom;
    if (previewSize === 'original') {
      zoom = 1;
    } else if (previewSize === 'best') {
      zoom = Math.floor(this.calculateZoom_());
    } else if (previewSize === 'full') {
      zoom = this.calculateZoom_();
    }

    this.renderer.setZoom(zoom);
    this.setRenderFlag_(true);
  };

  ns.PreviewController.prototype.getZoom = function () {
    return this.calculateZoom_();
  };

  ns.PreviewController.prototype.getCoordinates = function(x, y) {
    var containerOffset = this.container.offset();
    x = x - containerOffset.left;
    y = y - containerOffset.top;
    var zoom = this.getZoom();
    return {
      x : Math.floor(x / zoom),
      y : Math.floor(y / zoom)
    };
  };

  /**
   * Event handler triggered on 'input' or 'change' events.
   */
  ns.PreviewController.prototype.onFpsRangeInputUpdate_ = function (evt) {
    var fps = parseInt(this.fpsRangeInput.value, 10);
    this.piskelController.setFPS(fps);
    // blur only on 'change' events, as blurring on 'input' breaks on Firefox
    if (evt.type === 'change') {
      this.fpsRangeInput.blur();
    }
  };

  ns.PreviewController.prototype.updateFPS_ = function () {
    var fps = this.piskelController.getFPS();
    if (fps !== this.fps) {
      this.fps = fps;
      // reset
      this.fpsRangeInput.value = 0;
      // set proper value
      this.fpsRangeInput.value = this.fps;
      this.fpsCounterDisplay.innerHTML = this.fps + ' FPS';
    }
  };

  ns.PreviewController.prototype.render = function (delta) {
    this.elapsedTime += delta;
    var index = this.getNextIndex_(delta);
    if (this.shouldRender_() || this.currentIndex != index) {
      this.currentIndex = index;
      var frame = pskl.utils.LayerUtils.mergeFrameAt(this.piskelController.getLayers(), index);
      this.renderer.render(frame);
      this.renderFlag = false;
      this.lastRenderTime = Date.now();

      this.popupPreviewController.render(frame);
    }
  };

  ns.PreviewController.prototype.getNextIndex_ = function (delta) {
    if (this.fps === 0) {
      return this.piskelController.getCurrentFrameIndex();
    } else {
      var index = Math.floor(this.elapsedTime / (1000 / this.fps));
      if (!this.piskelController.hasFrameAt(index)) {
        this.elapsedTime = 0;
        index = 0;
      }
      return index;
    }
  };

  /**
   * Calculate the preview zoom depending on the framesheet size
   */
  ns.PreviewController.prototype.calculateZoom_ = function () {
    var frame = this.piskelController.getCurrentFrame();
    var hZoom = PREVIEW_SIZE / frame.getHeight();
    var wZoom = PREVIEW_SIZE / frame.getWidth();

    return Math.min(hZoom, wZoom);
  };

  ns.PreviewController.prototype.onFrameSizeChange_ = function () {
    this.updateZoom_();
    this.updateContainerDimensions_();
    this.updatePreviewSizeButtons_();
  };

  ns.PreviewController.prototype.updateContainerDimensions_ = function () {
    var isSeamless = pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_MODE);
    this.renderer.setRepeated(isSeamless);

    var height, width;

    if (isSeamless) {
      height = PREVIEW_SIZE;
      width = PREVIEW_SIZE;
    } else {
      var zoom = this.getZoom();
      var frame = this.piskelController.getCurrentFrame();
      height = frame.getHeight() * zoom;
      width = frame.getWidth() * zoom;
    }

    var containerEl = this.container.get(0);
    containerEl.style.height = height + 'px';
    containerEl.style.width = width + 'px';

    var horizontalMargin = (PREVIEW_SIZE - height) / 2;
    containerEl.style.marginTop = horizontalMargin + 'px';
    containerEl.style.marginBottom = horizontalMargin + 'px';

    var verticalMargin = (PREVIEW_SIZE - width) / 2;
    containerEl.style.marginLeft = verticalMargin + 'px';
    containerEl.style.marginRight = verticalMargin + 'px';
  };

  ns.PreviewController.prototype.setRenderFlag_ = function (bool) {
    this.renderFlag = bool;
  };

  ns.PreviewController.prototype.shouldRender_ = function () {
    return (this.renderFlag || this.popupPreviewController.renderFlag) &&
            (Date.now() - this.lastRenderTime > RENDER_MINIMUM_DELAY);
  };

  ns.PreviewController.prototype.toggleOnionSkin_ = function () {
    var currentValue = pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN);
    pskl.UserSettings.set(pskl.UserSettings.ONION_SKIN, !currentValue);
  };
})();
