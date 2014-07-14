(function () {
  var ns = $.namespace("pskl.controller.settings");

  ns.ImageExportController = function (piskelController) {
    this.piskelController = piskelController;
    this.pngExportController = new ns.PngExportController(piskelController);
    this.gifExportController = new ns.GifExportController(piskelController);
  };

  ns.ImageExportController.prototype.init = function () {
    this.pngExportController.init();
    this.gifExportController.init();
  };
})();