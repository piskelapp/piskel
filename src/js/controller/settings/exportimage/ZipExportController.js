(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  ns.ZipExportController = function (piskelController, exportController) {
    this.piskelController = piskelController;
    this.exportController = exportController;
  };

  pskl.utils.inherit(ns.ZipExportController, pskl.controller.settings.AbstractSettingController);

  ns.ZipExportController.prototype.init = function () {
    this.pngFilePrefixInput = document.querySelector('.zip-prefix-name');
    this.pngFilePrefixInput.value = 'sprite_';

    this.splitByLayersCheckbox =  document.querySelector('.zip-split-layers-checkbox');

    var zipButton = document.querySelector('.zip-generate-button');
    this.addEventListener(zipButton, 'click', this.onZipButtonClick_);
  };

  ns.ZipExportController.prototype.onZipButtonClick_ = function () {
    var zip = new window.JSZip();

    this.piskelController.getPlanes().forEach(function (plane) {
      if (this.splitByLayersCheckbox.checked) {
        this.splittedExport_(zip, plane);
      } else {
        this.mergedExport_(zip, plane);
      }
    }, this);

    var fileName = this.getPiskelName_() + '.zip';

    var blob = zip.generate({
      type : 'blob'
    });

    pskl.utils.FileUtils.downloadAsFile(blob, fileName);
  };

  ns.ZipExportController.prototype.mergedExport_ = function (zip, plane) {
    var paddingLength = ('' + plane.getFrameCount()).length;
    var zoom = this.exportController.getExportZoom();
    for (var i = 0; i < plane.getFrameCount(); i++) {
      var render = this.piskelController.renderPlaneFrameAt(plane, i, true);
      var canvas = pskl.utils.ImageResizer.scale(render, zoom);
      var basename = this.pngFilePrefixInput.value;
      var id = pskl.utils.StringUtils.leftPad(i, paddingLength, '0');
      var filename = plane.getName() + '_' + basename + id + '.png';
      zip.file(filename, pskl.utils.CanvasUtils.getBase64FromCanvas(canvas) + '\n', {base64: true});
    }
  };

  ns.ZipExportController.prototype.splittedExport_ = function (zip, plane) {
    var layers = plane.getLayers();
    var framePaddingLength = ('' + plane.getFrameCount()).length;
    var layerPaddingLength = ('' + layers.length).length;
    var zoom = this.exportController.getExportZoom();
    for (var j = 0; plane.hasLayerAt(j); j++) {
      var layer = plane.getLayerAt(j);
      var layerid = pskl.utils.StringUtils.leftPad(j, layerPaddingLength, '0');
      for (var i = 0; i < plane.getFrameCount(); i++) {
        var render = pskl.utils.LayerUtils.renderFrameAt(layer, i, true);
        var canvas = pskl.utils.ImageResizer.scale(render, zoom);
        var basename = this.pngFilePrefixInput.value;
        var frameid = pskl.utils.StringUtils.leftPad(i + 1, framePaddingLength, '0');
        var filename = plane.getName() + '_' + 'l' + layerid + '_' + basename + frameid + '.png';
        zip.file(filename, pskl.utils.CanvasUtils.getBase64FromCanvas(canvas) + '\n', {base64: true});
      }
    }
  };

  ns.ZipExportController.prototype.getPiskelName_ = function () {
    return this.piskelController.getPiskel().getDescriptor().name;
  };
})();
