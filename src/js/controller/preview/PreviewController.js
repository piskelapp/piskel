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

    /**
     * !! WARNING !! ALL THE INITIALISATION BELOW SHOULD BE MOVED TO INIT()
     * IT WILL STAY HERE UNTIL WE CAN REMOVE SETFPS (see comment below)
     */
    this.fpsRangeInput = document.querySelector('#preview-fps');
    this.fpsCounterDisplay = document.querySelector('#display-fps');
    this.openPopupPreview = document.querySelector('.open-popup-preview-button');
    this.previewSize = {
      original: {
        name: 'original',
        button: document.querySelector('.original-size-button'),
        shortcut: pskl.service.keyboard.Shortcuts.MISC.X1_PREVIEW,
        tooltip: 'Original size preview',
        enabled: true
      },
      best: {
        name: 'best',
        button: document.querySelector('.best-size-button'),
        shortcut: pskl.service.keyboard.Shortcuts.MISC.BEST_PREVIEW,
        tooltip: 'Round factor size preview',
        enabled: true
      },
      full: {
        name: 'full',
        button: document.querySelector('.full-size-button'),
        shortcut: pskl.service.keyboard.Shortcuts.MISC.FULL_PREVIEW,
        tooltip: 'Biggest factor size preview',
        enabled: true
      }
    };
    this.toggleOnionSkinButton = document.querySelector('.preview-toggle-onion-skin');

    /**
     * !! WARNING !! THIS SHOULD REMAIN HERE UNTIL, BECAUSE THE PREVIEW CONTROLLER
     * IS THE SOURCE OF TRUTH AT THE MOMENT WHEN IT COMES TO FPSs
     * IT WILL BE QUERIED BY OTHER OBJECTS SO DEFINE IT AS SOON AS POSSIBLE
     */
    this.setFPS(Constants.DEFAULT.FPS);

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

    for (var size in this.previewSize) {
      if (this.previewSize.hasOwnProperty(size)) {
        var wrapper = this.previewSize[size];
        addEvent(wrapper.button, 'click', this.onChangePreviewSize_, this, wrapper.name);
        registerShortcut(wrapper.shortcut, this.onChangePreviewSize_.bind(this, wrapper.name));
        var tooltip = pskl.utils.TooltipFormatter.format(wrapper.tooltip, wrapper.shortcut);
        wrapper.button.setAttribute('title', tooltip);
      }
    }

    $.subscribe(Events.FRAME_SIZE_CHANGED, this.onFrameSizeChange_.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
    $.subscribe(Events.PISKEL_SAVE_STATE, this.setRenderFlag_.bind(this, true));
    $.subscribe(Events.PISKEL_RESET, this.setRenderFlag_.bind(this, true));

    this.updatePreviewSizeButtons_();
    this.popupPreviewController.init();

    this.updateZoom_();
    this.updateOnionSkinPreview_();
    this.selectPreviewSizeButton_();
    this.updateMaxFPS_();
    this.updateContainerDimensions_();
  };

  ns.PreviewController.prototype.updatePreviewSizeButtons_ = function () {
    var fullZoom = this.calculateZoom_();
    var seamlessModeEnabled = pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_MODE);

    if (seamlessModeEnabled) {
      this.togglePreviewSizeButtonState_(this.previewSize.best, false);
      this.togglePreviewSizeButtonState_(this.previewSize.full, false);
      this.onChangePreviewSize_(this.previewSize.original.name);
    } else {
      if (Number.isInteger(fullZoom)) {
        this.togglePreviewSizeButtonState_(this.previewSize.full, false);
        if (pskl.UserSettings.get(pskl.UserSettings.PREVIEW_SIZE) === this.previewSize.full.name) {
          this.onChangePreviewSize_(this.previewSize.best.name);
        }
      } else if (fullZoom <= 1) {
        this.togglePreviewSizeButtonState_(this.previewSize.best, false);
        if (fullZoom < 1) {
          this.togglePreviewSizeButtonState_(this.previewSize.original, false);
          this.onChangePreviewSize_(this.previewSize.full.name);
        } else {
          this.onChangePreviewSize_(this.previewSize.original.name);
        }
      } else {
        this.togglePreviewSizeButtonState_(this.previewSize.original, true);
        this.togglePreviewSizeButtonState_(this.previewSize.best, true);
        this.togglePreviewSizeButtonState_(this.previewSize.full, true);
      }
    }
    this.previewSize.best.button.textContent = Math.floor(fullZoom) + 'x';
  };

  ns.PreviewController.prototype.togglePreviewSizeButtonState_ = function (wrapper, enable) {
    var disabledClassname = 'preview-contextual-action-disabled';
    wrapper.button.classList.toggle(disabledClassname, !enable);
    wrapper.enabled = enable;
  };

  ns.PreviewController.prototype.onOpenPopupPreviewClick_ = function () {
    this.popupPreviewController.open();
  };

  ns.PreviewController.prototype.onChangePreviewSize_ = function (choice) {
    if (this.previewSize[choice].enabled) {
      pskl.UserSettings.set(pskl.UserSettings.PREVIEW_SIZE, choice);
    }
  };

  ns.PreviewController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.ONION_SKIN) {
      this.updateOnionSkinPreview_();
    } else if (name == pskl.UserSettings.MAX_FPS) {
      this.updateMaxFPS_();
    } else if (name == pskl.UserSettings.SEAMLESS_MODE) {
      this.onChangePreviewSize_(this.previewSize.original.name);
      this.togglePreviewSizeButtonState_(this.previewSize.best, !value);
      this.togglePreviewSizeButtonState_(this.previewSize.full, !value);
    } else {
      this.updateZoom_();
      this.selectPreviewSizeButton_();
      this.updateContainerDimensions_();
    }
  };

  ns.PreviewController.prototype.updateOnionSkinPreview_ = function () {
    var enabledClassname = 'preview-toggle-onion-skin-enabled';
    var isEnabled = pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN);
    this.toggleOnionSkinButton.classList.toggle(enabledClassname, isEnabled);
  };

  ns.PreviewController.prototype.selectPreviewSizeButton_ = function () {
    var enabledClassname = 'size-button-selected';
    var currentlySelected = document.querySelector('.' + enabledClassname);
    if (currentlySelected) {
      currentlySelected.classList.remove(enabledClassname);
    }

    var previewSize = pskl.UserSettings.get(pskl.UserSettings.PREVIEW_SIZE);
    var button = this.previewSize[previewSize].button;
    button.classList.add(enabledClassname);
  };

  ns.PreviewController.prototype.updateMaxFPS_ = function () {
    var maxFps = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    this.fpsRangeInput.setAttribute('max', maxFps);
    this.setFPS(Math.min(this.fps, maxFps));
  };

  ns.PreviewController.prototype.updateZoom_ = function () {
    var chosenPreviewSize = pskl.UserSettings.get(pskl.UserSettings.PREVIEW_SIZE);

    var zoom;
    switch (chosenPreviewSize) {
      case this.previewSize.original.name:
        zoom = 1;
        break;
      case this.previewSize.best.name:
        zoom = this.calculateZoom_(true);
        break;
      case this.previewSize.full.name:
        zoom = this.calculateZoom_(false);
        break;
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
    this.setFPS(parseInt(this.fpsRangeInput.value, 10));
    // blur only on 'change' events, as blurring on 'input' breaks on Firefox
    if (evt.type === 'change') {
      this.fpsRangeInput.blur();
    }
  };

  ns.PreviewController.prototype.setFPS = function (fps) {
    if (typeof fps === 'number') {
      this.fps = fps;
      // reset
      this.fpsRangeInput.value = 0;
      // set proper value
      this.fpsRangeInput.value = this.fps;
      this.fpsCounterDisplay.innerHTML = this.fps + ' FPS';
    }
  };

  ns.PreviewController.prototype.getFPS = function () {
    return this.fps;
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
  ns.PreviewController.prototype.calculateZoom_ = function (noFloat) {
    var frame = this.piskelController.getCurrentFrame();
    var hZoom = PREVIEW_SIZE / frame.getHeight();
    var wZoom = PREVIEW_SIZE / frame.getWidth();

    if (noFloat) {
      hZoom = Math.floor(hZoom);
      wZoom = Math.floor(wZoom);
    }

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
