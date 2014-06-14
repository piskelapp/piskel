(function () {
  var ns = $.namespace("pskl.controller.settings");

  var URL_MAX_LENGTH = 60;

  ns.PngExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.PngExportController.prototype.init = function () {
    this.previewContainerEl = document.querySelectorAll(".png-export-preview")[0];
    this.uploadStatusContainerEl = document.querySelectorAll(".png-upload-status")[0];

    document.querySelector(".png-upload-button").addEventListener('click', this.onPngUploadButtonClick_.bind(this));
    document.querySelector(".png-download-button").addEventListener('click', this.onPngDownloadButtonClick_.bind(this));

    document.querySelector(".zip-generate-button").addEventListener('click', this.onZipButtonClick_.bind(this));

    this.setPreviewSrc_(this.getFramesheetAsCanvas().toDataURL("image/png"));
  };

  ns.PngExportController.prototype.onPngDownloadButtonClick_ = function (evt) {
    var fileName = this.getPiskelName_() + '.png';
    pskl.utils.ImageToBlob.canvasToBlob(this.getFramesheetAsCanvas(), function(blob) {
      pskl.utils.FileUtils.downloadAsFile(fileName, blob);
    });
  };

  ns.PngExportController.prototype.onPngUploadButtonClick_ = function (evt) {
    this.previewContainerEl.classList.add("preview-upload-ongoing");
    pskl.app.imageUploadService.upload(this.getFramesheetAsCanvas().toDataURL("image/png"), this.onImageUploadCompleted_.bind(this));
  };

  ns.PngExportController.prototype.onZipButtonClick_ = function () {
    var zip = new window.JSZip();

    for (var i = 0; i < this.piskelController.getFrameCount(); i++) {
      var frame = this.piskelController.getFrameAt(i);
      var canvas = this.getFrameAsCanvas_(frame);
      var filename = "sprite_" + (i+1) + ".png";
      zip.file(filename, pskl.CanvasUtils.getBase64FromCanvas(canvas) + '\n', {base64: true});
    }

    var fileName = this.getPiskelName_() + '.zip';

    var fileContent = zip.generate({type:"blob"});
    pskl.utils.FileUtils.downloadAsFile(fileName, fileContent);
  };

  ns.PngExportController.prototype.getFrameAsCanvas_ = function (frame) {
    var canvasRenderer = new pskl.rendering.CanvasRenderer(frame, 1);
    canvasRenderer.drawTransparentAs(Constants.TRANSPARENT_COLOR);
    return canvasRenderer.render();
  };

  ns.PngExportController.prototype.getPiskelName_ = function () {
    return this.piskelController.getPiskel().getDescriptor().name;
  };

  ns.PngExportController.prototype.getFramesheetAsCanvas = function () {
    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    return renderer.renderAsCanvas();
  };

  ns.PngExportController.prototype.onImageUploadCompleted_ = function (imageUrl) {
    this.updatePreview_(imageUrl);
    this.updateStatus_(imageUrl);
    this.previewContainerEl.classList.remove("preview-upload-ongoing");
  };

  ns.PngExportController.prototype.updateStatus_ = function (imageUrl, error) {
    if (imageUrl) {
      var linkTpl = "<a class='image-link' href='{{link}}' target='_blank'>{{shortLink}}</a>";
      var linkHtml = pskl.utils.Template.replace(linkTpl, {
        link : imageUrl,
        shortLink : this.shorten_(imageUrl, URL_MAX_LENGTH, '...')
      });
      this.uploadStatusContainerEl.innerHTML = 'Your image is now available at : ' + linkHtml;
    } else {
      // FIXME : Should display error message instead
    }
  };

  ns.PngExportController.prototype.setPreviewSrc_ = function (src) {
    this.previewContainerEl.innerHTML = "<img class='light-picker-background' style='max-width:240px;' src='"+src+"'/>";
  };

  ns.PngExportController.prototype.shorten_ = function (url, maxLength, suffix) {
    if (url.length > maxLength) {
      url = url.substring(0, maxLength);
      url += suffix;
    }
    return url;
  };
})();