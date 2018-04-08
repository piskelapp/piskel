(function () {
  var ns = $.namespace('pskl.controller.preview');

  var POPUP_TITLE = 'Piskel - preview';

  ns.PopupPreviewController = function (piskelController) {
    this.piskelController = piskelController;
    this.popup = null;
    this.renderer = null;
    this.renderFlag = false;
  };

  ns.PopupPreviewController.prototype.init = function () {
    pskl.utils.Event.addEventListener(window, 'unload', this.onMainWindowUnload_, this);
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
    this.renderer = new pskl.rendering.frame.BackgroundImageFrameRenderer(container);
    this.updateZoom_();
    this.renderFlag = true;
  };

  ns.PopupPreviewController.prototype.render = function (frame) {
    if (this.isOpen() && this.renderer) {
      this.renderer.render(frame);
      this.renderFlag = false;
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

    this.renderer.setZoom(zoom);

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
  };

  ns.PopupPreviewController.prototype.onPopupClosed_ = function () {
    var popup = this.popup;
    this.popup = null;
  };

  ns.PopupPreviewController.prototype.onMainWindowUnload_ = function () {
    if (this.isOpen()) {
      this.popup.close();
    }
  };
})();
