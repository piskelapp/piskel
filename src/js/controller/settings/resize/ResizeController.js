(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  ns.ResizeController = function (piskelController) {
    var resizeCanvasContainer = document.querySelector('.resize-canvas');
    this.resizeCanvasController = new ns.ResizeCanvasController(piskelController, resizeCanvasContainer);

    var resizeContentContainer = document.querySelector('.resize-content');
    this.resizeContentController = new ns.ResizeContentController(piskelController, resizeContentContainer);
  };

  ns.ResizeController.prototype.init = function () {
    this.resizeCanvasController.init();
    this.resizeContentController.init();
  };
})();