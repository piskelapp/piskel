(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.ResizeController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.ResizeController.prototype.init = function () {
    this.resizeWidth = $('[name=resize-width]');
    this.resizeHeight = $('[name=resize-height]');

    this.resizeWidth.val(this.piskelController.getWidth());
    this.resizeHeight.val(this.piskelController.getHeight());

    this.cancelButton = $('.resize-cancel-button');
    this.cancelButton.click(this.onCancelButtonClicked_.bind(this));

    this.resizeForm = $("[name=resize-form]");
    this.resizeForm.submit(this.onResizeFormSubmit_.bind(this));
  };

  ns.ResizeController.prototype.onResizeFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();

    var width = parseInt(this.resizeWidth.val(), 10);
    var height = parseInt(this.resizeHeight.val(), 10);

    var layers = [];
    var fromLayers = this.piskelController.getLayers();
    for (var i = 0 ; i < fromLayers.length ; i++) {
      var frames = [];
      var fromFrames = fromLayers[i].getFrames();
      for (var j = 0 ; j < fromFrames.length ; j++) {
        var frame = new pskl.model.Frame(width, height);
        this.copyFromFrameToFrame(fromFrames[j], frame);
        frames.push(frame);
      }
      var layer = pskl.model.Layer.fromFrames(fromLayers[i].getName(), frames);
      layers.push(layer);
    }

    var piskel = pskl.model.Piskel.fromLayers(layers, this.piskelController.piskel.getDescriptor());
    pskl.app.piskelController.setPiskel(piskel);
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.ResizeController.prototype.copyFromFrameToFrame = function (from, to) {
    from.forEachPixel(function (color, x, y) {
      if (x < to.getWidth() && y < to.getHeight()) {
        to.setPixel(x, y, color);
      }
    });
  };

  ns.ResizeController.prototype.onCancelButtonClicked_ = function (evt) {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };
})();