(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var URL_MAX_LENGTH = 60;

  ns.PngExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(ns.PngExportController, pskl.controller.settings.AbstractSettingController);

  ns.PngExportController.prototype.init = function () {
    this.pngFilePrefixInput = document.querySelector('.zip-prefix-name');
    this.pngFilePrefixInput.value = 'sprite_';

    this.splitByLayersCheckbox =  document.querySelector('.zip-split-layers-checkbox');

    var downloadButton = document.querySelector('.png-download-button');
    this.addEventListener(downloadButton, 'click', this.onPngDownloadButtonClick_);

    var zipButton = document.querySelector('.zip-generate-button');
    this.addEventListener(zipButton, 'click', this.onZipButtonClick_);
  };

  ns.PngExportController.prototype.onPngDownloadButtonClick_ = function (evt) {
    var fileName = this.getPiskelName_() + '.png';

    var outputCanvas = this.getFramesheetAsCanvas();

    var scalingFactor = pskl.UserSettings.get(pskl.UserSettings.EXPORT_SCALING);
    if (scalingFactor > 1) {
      var width = outputCanvas.width * scalingFactor;
      var height = outputCanvas.height * scalingFactor;
      outputCanvas = pskl.utils.ImageResizer.resize(outputCanvas, width, height, false);
    }

    pskl.utils.BlobUtils.canvasToBlob(outputCanvas, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    });
  };

  ns.PngExportController.prototype.onZipButtonClick_ = function () {
    var zip = new window.JSZip();

    if (this.splitByLayersCheckbox.checked) {
      this.splittedExport_(zip);
    } else {
      this.mergedExport_(zip);
    }

    var fileName = this.getPiskelName_() + '.zip';

    var blob = zip.generate({
      type : 'blob'
    });

    pskl.utils.FileUtils.downloadAsFile(blob, fileName);
  };

  ns.PngExportController.prototype.mergedExport_ = function (zip) {
    var paddingLength = ('' + this.piskelController.getFrameCount()).length;
    for (var i = 0; i < this.piskelController.getFrameCount(); i++) {
      var render = this.piskelController.renderFrameAt(i, true);
      var canvas = pskl.utils.CanvasUtils.createFromImage(render);
      var basename = this.pngFilePrefixInput.value;
      var id = pskl.utils.StringUtils.leftPad(i, paddingLength, '0');
      var filename = basename + id + '.png';
      zip.file(filename, pskl.utils.CanvasUtils.getBase64FromCanvas(canvas) + '\n', {base64: true});
    }
  };

  ns.PngExportController.prototype.splittedExport_ = function (zip) {
    var layers = this.piskelController.getLayers();
    var framePaddingLength = ('' + this.piskelController.getFrameCount()).length;
    var layerPaddingLength = ('' + layers.length).length;
    for (var j = 0; this.piskelController.hasLayerAt(j); j++) {
      var layer = this.piskelController.getLayerAt(j);
      var layerid = pskl.utils.StringUtils.leftPad(j, layerPaddingLength, '0');
      for (var i = 0; i < this.piskelController.getFrameCount(); i++) {
        var render = pskl.utils.LayerUtils.renderFrameAt(layer, i, true);
        var canvas = pskl.utils.CanvasUtils.createFromImage(render);
        var basename = this.pngFilePrefixInput.value;
        var frameid = pskl.utils.StringUtils.leftPad(i + 1, framePaddingLength, '0');
        var filename = 'l' + layerid + '_' + basename + frameid + '.png';
        zip.file(filename, pskl.utils.CanvasUtils.getBase64FromCanvas(canvas) + '\n', {base64: true});
      }
    }
  };

  ns.PngExportController.prototype.getPiskelName_ = function () {
    return this.piskelController.getPiskel().getDescriptor().name;
  };

  ns.PngExportController.prototype.getFramesheetAsCanvas = function () {
    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    return renderer.renderAsCanvas();
  };

  ns.PngExportController.prototype.updateStatus_ = function (imageUrl, error) {
    if (imageUrl) {
      var linkTpl = '<a class="image-link" href="{{link}}" target="_blank">{{shortLink}}</a>';
      var linkHtml = pskl.utils.Template.replace(linkTpl, {
        link : imageUrl,
        shortLink : this.shorten_(imageUrl, URL_MAX_LENGTH, '...')
      });
      this.uploadStatusContainerEl.innerHTML = 'Your image is now available at : ' + linkHtml;
    } else {
      // FIXME : Should display error message instead
    }
  };

  ns.PngExportController.prototype.shorten_ = function (url, maxLength, suffix) {
    if (url.length > maxLength) {
      url = url.substring(0, maxLength);
      url += suffix;
    }
    return url;
  };
})();
