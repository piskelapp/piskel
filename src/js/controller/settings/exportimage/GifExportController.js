(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var URL_MAX_LENGTH = 30;
  var MAX_GIF_COLORS = 256;
  var MAX_EXPORT_ZOOM = 20;
  var DEFAULT_EXPORT_ZOOM = 10;
  var MAGIC_PINK = '#FF00FF';

  ns.GifExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(ns.GifExportController, pskl.controller.settings.AbstractSettingController);

  /**
   * List of Resolutions applicable for Gif export
   * @static
   * @type {Array} array of Objects {zoom:{Number}, default:{Boolean}}
   */
  ns.GifExportController.RESOLUTIONS = [];
  for (var i = 1 ; i <= MAX_EXPORT_ZOOM ; i++) {
    ns.GifExportController.RESOLUTIONS.push({
      zoom : i
    });
  }

  ns.GifExportController.prototype.init = function () {

    this.uploadStatusContainerEl = document.querySelector('.gif-upload-status');
    this.previewContainerEl = document.querySelector('.gif-export-preview');
    this.widthInput = document.querySelector('.export-gif-resize-width');
    this.heightInput = document.querySelector('.export-gif-resize-height');
    this.uploadButton = document.querySelector('.gif-upload-button');
    this.downloadButton = document.querySelector('.gif-download-button');

    this.sizeInputWidget = new pskl.widgets.SizeInput(
      this.widthInput, this.heightInput,
      this.piskelController.getWidth(), this.piskelController.getHeight());

    this.addEventListener(this.uploadButton, 'click', this.onUploadButtonClick_);
    this.addEventListener(this.downloadButton, 'click', this.onDownloadButtonClick_);
  };

  ns.GifExportController.prototype.destroy = function () {
    this.sizeInputWidget.destroy();
    this.superclass.destroy.call(this);
  };

  ns.GifExportController.prototype.onUploadButtonClick_ = function (evt) {
    evt.preventDefault();
    var zoom = this.getZoom_();
    var fps = this.piskelController.getFPS();

    this.renderAsImageDataAnimatedGIF(zoom, fps, this.uploadImageData_.bind(this));
  };

  ns.GifExportController.prototype.onDownloadButtonClick_ = function (evt) {
    var zoom = this.getZoom_();
    var fps = this.piskelController.getFPS();

    this.renderAsImageDataAnimatedGIF(zoom, fps, this.downloadImageData_.bind(this));
  };

  ns.GifExportController.prototype.downloadImageData_ = function (imageData) {
    var fileName = this.piskelController.getPiskel().getDescriptor().name + '.gif';
    pskl.utils.BlobUtils.dataToBlob(imageData, 'image/gif', function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    });
  };

  ns.GifExportController.prototype.uploadImageData_ = function (imageData) {
    this.updatePreview_(imageData);
    this.previewContainerEl.classList.add('preview-upload-ongoing');

    pskl.app.imageUploadService.upload(imageData,
      this.onImageUploadCompleted_.bind(this),
      this.onImageUploadFailed_.bind(this));
  };

  ns.GifExportController.prototype.onImageUploadCompleted_ = function (imageUrl) {
    this.updatePreview_(imageUrl);
    this.updateStatus_(imageUrl);
    this.previewContainerEl.classList.remove('preview-upload-ongoing');
  };

  ns.GifExportController.prototype.onImageUploadFailed_ = function (event, xhr) {
    if (xhr.status === 500) {
      $.publish(Events.SHOW_NOTIFICATION, [{
        'content': 'Upload failed : ' + xhr.responseText,
        'hideDelay' : 5000
      }]);
    }
  };

  ns.GifExportController.prototype.updatePreview_ = function (src) {
    this.previewContainerEl.innerHTML = '<div><img style="max-width:32px;"src="' + src + '"/></div>';
  };

  ns.GifExportController.prototype.getZoom_ = function () {
    return parseInt(this.widthInput.value, 10) / this.piskelController.getWidth();
  };

  ns.GifExportController.prototype.renderAsImageDataAnimatedGIF = function(zoom, fps, cb) {
    var currentColors = pskl.app.currentColorsService.getCurrentColors();

    var preserveColors = currentColors.length < MAX_GIF_COLORS;
    var transparentColor = this.getTransparentColor(currentColors);

    var gif = new window.GIF({
      workers: 5,
      quality: 1,
      width: this.piskelController.getWidth() * zoom,
      height: this.piskelController.getHeight() * zoom,
      preserveColors : preserveColors,
      transparent : parseInt(transparentColor.substring(1), 16)
    });

    for (var i = 0 ; i < this.piskelController.getFrameCount() ; i++) {
      var frame = this.piskelController.getFrameAt(i);
      var canvasRenderer = new pskl.rendering.CanvasRenderer(frame, zoom);
      canvasRenderer.drawTransparentAs(transparentColor);
      var canvas = canvasRenderer.render();
      gif.addFrame(canvas.getContext('2d'), {
        delay: 1000 / fps
      });
    }

    $.publish(Events.SHOW_PROGRESS, [{'name': 'Building animated GIF ...'}]);
    gif.on('progress', function(percentage) {
      $.publish(Events.UPDATE_PROGRESS, [{'progress': (percentage * 100).toFixed(1)}]);
    }.bind(this));

    gif.on('finished', function(blob) {
      $.publish(Events.HIDE_PROGRESS);
      pskl.utils.FileUtils.readFile(blob, cb);
    }.bind(this));

    gif.render();
  };

  ns.GifExportController.prototype.getTransparentColor = function(currentColors) {
    var transparentColor = pskl.utils.ColorUtils.getUnusedColor(currentColors);

    if (!transparentColor) {
      console.error('Unable to find unused color to use as transparent color in the current sprite');
      transparentColor = MAGIC_PINK;
    }

    return transparentColor;
  };

  // FIXME : JD : HORRIBLE COPY/PASTA (JD later : where???)
  ns.GifExportController.prototype.updateStatus_ = function (imageUrl, error) {
    if (imageUrl) {
      var linkTpl = '<a class="image-link" href="${link}" target="_blank">${shortLink}</a>';
      var linkHtml = pskl.utils.Template.replace(linkTpl, {
        link : imageUrl,
        shortLink : this.shorten_(imageUrl, URL_MAX_LENGTH, '...')
      });
      this.uploadStatusContainerEl.innerHTML = 'Your image is now available at : ' + linkHtml;
    } else {
      // FIXME : Should display error message instead
    }
  };

  ns.GifExportController.prototype.shorten_ = function (url, maxLength, suffix) {
    if (url.length > maxLength) {
      var index = Math.round((maxLength - suffix.length) / 2);
      var part1 = url.substring(0, index);
      var part2 = url.substring(url.length - index, url.length);
      url = part1 + suffix + part2;
    }
    return url;
  };
})();
