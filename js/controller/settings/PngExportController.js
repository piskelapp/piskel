(function () {
  var ns = $.namespace("pskl.controller.settings");

  var URL_MAX_LENGTH = 60;

  ns.PngExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.PngExportController.prototype.init = function () {
    this.previewContainerEl = document.querySelectorAll(".png-export-preview")[0];
    this.uploadStatusContainerEl = document.querySelectorAll(".png-upload-status")[0];

    this.uploadForm = $("[name=png-export-upload-form]");
    this.uploadForm.submit(this.onUploadFormSubmit_.bind(this));

    this.updatePreview_(this.getFramesheetAsBase64Png());
  };

  ns.PngExportController.prototype.onUploadFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();

    this.previewContainerEl.classList.add("preview-upload-ongoing");
    pskl.app.imageUploadService.upload(this.getFramesheetAsBase64Png(), this.onImageUploadCompleted_.bind(this));
  };

  ns.PngExportController.prototype.getFramesheetAsBase64Png = function () {
    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    var framesheetCanvas = renderer.renderAsCanvas();
    return framesheetCanvas.toDataURL("image/png");
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

  ns.PngExportController.prototype.updatePreview_ = function (src) {
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