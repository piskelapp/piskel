(function () {
  var ns = $.namespace('pskl.controller');

  // Preview is a square of PREVIEW_SIZE x PREVIEW_SIZE
  var PREVIEW_SIZE = 200;

  ns.AnimatedPreviewController = function (piskelController, container) {
    this.piskelController = piskelController;
    this.container = container;

    this.elapsedTime = 0;
    this.currentIndex = 0;

    this.renderFlag = true;

    this.fpsRangeInput = $('#preview-fps');
    this.fpsCounterDisplay = $('#display-fps');

    this.setFPS(Constants.DEFAULT.FPS);

    var frame = this.piskelController.getCurrentFrame();

    this.renderer = new pskl.rendering.frame.TiledFrameRenderer(this.container);
    this.popupPreviewController = new pskl.controller.PopupPreviewController();
  };

  ns.AnimatedPreviewController.prototype.init = function () {
    // the oninput event won't work on IE10 unfortunately, but at least will provide a
    // consistent behavior across all other browsers that support the input type range
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=853670
    this.fpsRangeInput.on('input change', this.onFPSSliderChange.bind(this));
    document.querySelector('.right-column').style.width = Constants.ANIMATED_PREVIEW_WIDTH + 'px';

    this.toggleOnionSkinEl = document.querySelector('.preview-toggle-onion-skin');
    this.toggleOnionSkinEl.addEventListener('click', this.toggleOnionSkin_.bind(this));

    pskl.app.shortcutService.addShortcut('alt+O', this.toggleOnionSkin_.bind(this));

    $.subscribe(Events.FRAME_SIZE_CHANGED, this.onFrameSizeChange_.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));

    $.subscribe(Events.PISKEL_SAVE_STATE, this.setRenderFlag_.bind(this, true));
    $.subscribe(Events.PISKEL_RESET, this.setRenderFlag_.bind(this, true));

    this.popupPreviewController.init();

    this.updateZoom_();
    this.updateOnionSkinPreview_();
    this.updateMaxFPS_();
    this.updateContainerDimensions_();
  };

  ns.AnimatedPreviewController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.ONION_SKIN) {
      this.updateOnionSkinPreview_();
    } else if (name == pskl.UserSettings.MAX_FPS) {
      this.updateMaxFPS_();
    } else {
      this.updateZoom_();
      this.updateContainerDimensions_();
    }
  };

  ns.AnimatedPreviewController.prototype.updateOnionSkinPreview_ = function () {
    var enabledClassname = 'preview-toggle-onion-skin-enabled';
    if (pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN)) {
      this.toggleOnionSkinEl.classList.add(enabledClassname);
    } else {
      this.toggleOnionSkinEl.classList.remove(enabledClassname);
    }
  };

  ns.AnimatedPreviewController.prototype.updateMaxFPS_ = function () {
    var maxFps = pskl.UserSettings.get(pskl.UserSettings.MAX_FPS);
    this.fpsRangeInput.get(0).setAttribute('max', maxFps);
    this.setFPS(Math.min(this.fps, maxFps));
  };

  ns.AnimatedPreviewController.prototype.updateZoom_ = function () {
    var isTiled = pskl.UserSettings.get(pskl.UserSettings.TILED_PREVIEW);
    var zoom = isTiled ? 1 : this.calculateZoom_();
    this.renderer.setZoom(zoom);
  };

  ns.AnimatedPreviewController.prototype.getZoom = function () {
    return this.calculateZoom_();
  };

  ns.AnimatedPreviewController.prototype.getCoordinates = function(x, y) {
    var containerOffset = this.container.offset();
    x = x - containerOffset.left;
    y = y - containerOffset.top;
    var zoom = this.getZoom();
    return {
      x : Math.floor(x / zoom),
      y : Math.floor(y / zoom)
    };
  };

  ns.AnimatedPreviewController.prototype.onFPSSliderChange = function (evt) {
    this.setFPS(parseInt(this.fpsRangeInput[0].value, 10));

  };

  ns.AnimatedPreviewController.prototype.setFPS = function (fps) {
    if (typeof fps === 'number') {
      this.fps = fps;
      // reset
      this.fpsRangeInput.get(0).value = 0;
      // set proper value
      this.fpsRangeInput.get(0).value = this.fps;
      this.fpsRangeInput.blur();
      this.fpsCounterDisplay.html(this.fps + ' FPS');
    }
  };

  ns.AnimatedPreviewController.prototype.getFPS = function () {
    return this.fps;
  };

  ns.AnimatedPreviewController.prototype.render = function (delta) {
    this.elapsedTime += delta;
    var index = this.getNextIndex_(delta);
    if (this.renderFlag || this.currentIndex != index) {
      this.currentIndex = index;
      var frame = this.piskelController.getFrameAt(this.currentIndex);
      this.renderer.render(frame);
      this.popupPreviewController.render(frame);
      this.renderFlag = false;
    }
  };

  ns.AnimatedPreviewController.prototype.getNextIndex_ = function (delta) {
    if (this.fps === 0) {
      return this.piskelController.getCurrentFrameIndex();
    } else {
      var index = Math.floor(this.elapsedTime / (1000/this.fps));
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
  ns.AnimatedPreviewController.prototype.calculateZoom_ = function () {
    var frame = this.piskelController.getCurrentFrame();
    var hZoom = PREVIEW_SIZE / frame.getHeight(),
        wZoom = PREVIEW_SIZE / frame.getWidth();

    return Math.min(hZoom, wZoom);
  };

  ns.AnimatedPreviewController.prototype.onFrameSizeChange_ = function () {
    this.updateZoom_();
    this.updateContainerDimensions_();
  };

  ns.AnimatedPreviewController.prototype.updateContainerDimensions_ = function () {
    var containerEl = this.container.get(0);
    var isTiled = pskl.UserSettings.get(pskl.UserSettings.TILED_PREVIEW);
    var height, width;

    if (isTiled) {
      height = PREVIEW_SIZE;
      width = PREVIEW_SIZE;
    } else {
      var zoom = this.getZoom();
      var frame = this.piskelController.getCurrentFrame();
      height = frame.getHeight() * zoom;
      width = frame.getWidth() * zoom;
    }

    containerEl.style.height = height + 'px';
    containerEl.style.width = width + 'px';

    var horizontalMargin = (PREVIEW_SIZE - height) / 2;
    containerEl.style.marginTop = horizontalMargin + 'px';
    containerEl.style.marginBottom = horizontalMargin + 'px';

    var verticalMargin = (PREVIEW_SIZE - width) / 2;
    containerEl.style.marginLeft = verticalMargin + 'px';
    containerEl.style.marginRight = verticalMargin + 'px';
  };

  ns.AnimatedPreviewController.prototype.setRenderFlag_ = function (bool) {
    this.renderFlag = bool;
  };

  ns.AnimatedPreviewController.prototype.toggleOnionSkin_ = function () {
    var currentValue = pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN);
    pskl.UserSettings.set(pskl.UserSettings.ONION_SKIN, !currentValue);
  };
})();