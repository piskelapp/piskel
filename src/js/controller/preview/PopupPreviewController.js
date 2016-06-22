(function () {
  var ns = $.namespace('pskl.controller.preview');

  var POPUP_TITLE = 'Piskel - preview';

  ns.PopupPreviewController = function (piskelController, useMocked) {
    this.piskelController = piskelController;
    this.popup = null;
    this.renderFlag = false;
    this.useMocked = useMocked;
    this.currentIndex = 0;
  };

  ns.PopupPreviewController.prototype.init = function () {
    pskl.utils.Event.addEventListener(window, 'unload', this.onMainWindowUnload_, this);

    this.currentFrame_ = pskl.utils.LayerUtils.mergeFrameAt(this.piskelController.getLayers(), this.currentIndex);
    this.currentFrames_ = this.getCurrentFrames_(0);
  };

  ns.PopupPreviewController.prototype.isOpen = function () {
    return !!this.popup;
  };

  ns.PopupPreviewController.prototype.open = function () {
    if (!this.isOpen()) {
      this.popup = window.open('about:blank', '', 'width=320,height=320');
      window.setTimeout(this.onPopupLoaded.bind(this), 500);
    } else {
      this.popup.focus();
    }
  };

  ns.PopupPreviewController.prototype.onPopupLoaded = function () {
    this.popup.document.title = POPUP_TITLE;
    this.popup.document.body.innerHTML = pskl.utils.Template.get('popup-preview-partial');
    pskl.utils.Event.addEventListener(this.popup, 'resize', this.onWindowResize_, this);
    pskl.utils.Event.addEventListener(this.popup, 'unload', this.onPopupClosed_, this);
    var container = this.popup.document.querySelector('.preview-container');

    this.renderController_ = new pskl.controller.preview.Preview2D(this.piskelController, $(container), this.useMocked);
    this.renderController_.init();

    this.firstFrame = true;
    this.updateZoom_();
    this.renderFlag = true;
  };

  ns.PopupPreviewController.prototype.render = function (index, shouldUpdate) {
    if (this.isOpen() && this.renderController_) {
      this.currentIndex = index;
      this.renderController_.render(this.currentIndex, shouldUpdate);
    }
  };

  ns.PopupPreviewController.prototype.getCurrentFrames_ = function (index) {
    return this.piskelController.getPlanes().map(function (plane) {
      return pskl.utils.LayerUtils.mergeFrameAt(plane.getLayers(), index);
    }, this);
  };

  ns.PopupPreviewController.prototype.getNextIndex_ = function (delta) {
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

  ns.PopupPreviewController.prototype.onWindowResize_ = function (frame) {
    this.updateZoom_();
    this.renderFlag = true;
  };

  ns.PopupPreviewController.prototype.updateZoom_ = function () {
    var documentElement = this.popup.document.documentElement;
    var wZoom = documentElement.clientWidth / this.piskelController.getWidth();
    var hZoom = documentElement.clientHeight / this.piskelController.getHeight();
    var zoom = Math.min(wZoom, hZoom);

    this.renderController_.setZoom(zoom);

    var height = this.piskelController.getHeight() * zoom;
    var width = this.piskelController.getWidth() * zoom;

    var container = this.popup.document.querySelector('.preview-container');
    container.style.height = height + 'px';
    container.style.width = width + 'px';

    var horizontalMargin = (documentElement.clientHeight - height) / 2;
    container.style.marginTop = horizontalMargin + 'px';
    container.style.marginBottom = horizontalMargin + 'px';

    var verticalMargin = (documentElement.clientWidth - width) / 2;
    container.style.marginLeft = verticalMargin + 'px';
    container.style.marginRight = verticalMargin + 'px';

    this.renderController_.updateSize(width, height);
  };

  ns.PopupPreviewController.prototype.onPopupClosed_ = function () {
    var popup = this.popup;
    this.popup = null;
  };

  ns.PopupPreviewController.prototype.onMainWindowUnload_ = function () {
    if (this.isOpen()) {
      this.renderController_.remove();
      this.popup.close();
    }
  };

  ns.PopupPreviewController.prototype.useRenderer = function (name) {
    console.log(pskl.controller.preview);
    if (pskl.controller.preview[name]) {
      if (this.renderController_) {
        this.renderController_.remove();
      }

      this.renderController_ =  new pskl.controller.preview[name]
        (this.piskelController, this.container, this.isInTestMode_());
      this.renderController_.init();
    } else {
      console.error('No such renderer class : ' + name);
    }
  };
})();
