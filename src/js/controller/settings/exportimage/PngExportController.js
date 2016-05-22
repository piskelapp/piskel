(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  ns.PngExportController = function (piskelController, exportController) {
    this.piskelController = piskelController;
    this.exportController = exportController;
  };

  pskl.utils.inherit(ns.PngExportController, pskl.controller.settings.AbstractSettingController);

  ns.PngExportController.prototype.init = function () {
    var downloadButton = document.querySelector('.png-download-button');
    this.addEventListener(downloadButton, 'click', this.onPngDownloadButtonClick_);
  };

  ns.PngExportController.prototype.onPngDownloadButtonClick_ = function (evt) {
    var fileName = this.getPiskelName_() + '.png';

    var outputCanvas = this.getFramesheetAsCanvas();

    var zoom = this.exportController.getExportZoom();
    if (zoom != 1) {
      var width = outputCanvas.width * zoom;
      var height = outputCanvas.height * zoom;
      outputCanvas = pskl.utils.ImageResizer.resize(outputCanvas, width, height, false);
    }

    pskl.utils.BlobUtils.canvasToBlob(outputCanvas, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    });
  };

  ns.PngExportController.prototype.getPiskelName_ = function () {
    return this.piskelController.getPiskel().getDescriptor().name;
  };

  ns.PngExportController.prototype.getFramesheetAsCanvas = function () {
    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    return renderer.renderAsCanvas();
  };
})();
