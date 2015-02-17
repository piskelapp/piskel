(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  ns.ResizeContentController = function (piskelController, container) {
    this.superclass.constructor.call(this, piskelController, container);
  };

  pskl.utils.inherit(ns.ResizeContentController, ns.AbstractResizeController);

  ns.ResizeContentController.prototype.init = function () {
    this.superclass.init.call(this);
  };

  ns.ResizeContentController.prototype.resizeFrame_ = function (frame) {
    var width = parseInt(this.widthInput.value, 10);
    var height = parseInt(this.heightInput.value, 10);
    return pskl.utils.FrameUtils.resize(frame, width, height, false);
  };
})();