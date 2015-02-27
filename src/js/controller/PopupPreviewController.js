(function () {
  var ns = $.namespace('pskl.controller');

  ns.PopupPreviewController = function (piskelController) {
    this.popup = null;
    this.renderer = null;
  };

  ns.PopupPreviewController.prototype.init = function () {
    pskl.utils.Event.addEventListener('.open-popup-preview-button', 'click', this.onOpenPopupPreviewClick_, this);
    pskl.utils.Event.addEventListener(window, 'unload', this.onMainWindowUnload_, this);
  };

  ns.PopupPreviewController.prototype.isOpen = function () {
    return !!this.popup;
  };

  ns.PopupPreviewController.prototype.onOpenPopupPreviewClick_ = function () {
    if (!this.isOpen()) {
      this.popup = this.createPopup_();
      window.setTimeout(function () {
        var container = this.popup.document.querySelector('.preview-container');
        this.renderer = new pskl.rendering.frame.TiledFrameRenderer($(container));
      }.bind(this), 200);
    }
  };

  ns.PopupPreviewController.prototype.createPopup_ = function () {
    var popup = window.open('about:blank', '', 'width=320,height=320');
    popup.document.body.innerHTML = pskl.utils.Template.get('popup-preview-partial');
    return popup;
  };

  ns.PopupPreviewController.prototype.render = function (frame) {
    if (this.isOpen() && this.renderer) {
      this.renderer.render(frame);
    }
  };

  ns.PopupPreviewController.prototype.onMainWindowUnload_ = function () {
    if (this.isOpen()) {
      this.popup.close();
    }
  };
})();