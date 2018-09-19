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
    this.lastRenderTime = 0;
    this.renderFlag = true;

    this.renderer = new pskl.rendering.frame.BackgroundImageFrameRenderer(this.container);
    this.popupPreviewController = new ns.PopupPreviewController(piskelController);
    this.previewActionsController = new ns.PreviewActionsController(this, container);
  };

  ns.PreviewController.prototype.init = function () {
    var width = Constants.ANIMATED_PREVIEW_WIDTH + Constants.RIGHT_COLUMN_PADDING_LEFT;
    document.querySelector('.right-column').style.width = width + 'px';

    $.subscribe(Events.FRAME_SIZE_CHANGED, this.onFrameSizeChange_.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
    $.subscribe(Events.PISKEL_SAVE_STATE, this.setRenderFlag_.bind(this, true));
    $.subscribe(Events.PISKEL_RESET, this.setRenderFlag_.bind(this, true));

    this.popupPreviewController.init();
    this.previewActionsController.init();

    this.updateZoom_();
    this.updateContainerDimensions_();
  };

  ns.PreviewController.prototype.openPopupPreview = function () {
    this.popupPreviewController.open();
  };

  ns.PreviewController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name === pskl.UserSettings.SEAMLESS_MODE) {
      this.onFrameSizeChange_();
    } else {
      this.updateZoom_();
      this.updateContainerDimensions_();
    }
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
    var containerRect = this.container.getBoundingClientRect();
    x = x - containerRect.left;
    y = y - containerRect.top;
    var zoom = this.getZoom();
    return {
      x : Math.floor(x / zoom),
      y : Math.floor(y / zoom)
    };
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
    var fps = this.piskelController.getFPS();
    if (fps === 0) {
      return this.piskelController.getCurrentFrameIndex();
    } else {
      var index = Math.floor(this.elapsedTime / (1000 / fps));
      var frameIndexes = this.piskelController.getVisibleFrameIndexes();
      if (frameIndexes.length <= index) {
        this.elapsedTime = 0;
        index = (frameIndexes.length) ? frameIndexes[0] : this.piskelController.getCurrentFrameIndex();
        return index;
      }
      return frameIndexes[index];
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
  };

  ns.PreviewController.prototype.updateContainerDimensions_ = function () {
    var isSeamless = pskl.UserSettings.get(pskl.UserSettings.SEAMLESS_MODE);
    this.renderer.setRepeated(isSeamless);

    var width;
    var height;

    if (isSeamless) {
      height = PREVIEW_SIZE;
      width = PREVIEW_SIZE;
    } else {
      var zoom = this.getZoom();
      var frame = this.piskelController.getCurrentFrame();
      height = frame.getHeight() * zoom;
      width = frame.getWidth() * zoom;
    }

    var containerEl = this.container;
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
})();
