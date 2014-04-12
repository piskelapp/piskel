(function () {
  var ns = $.namespace("pskl.controller.settings");

  var URL_MAX_LENGTH = 60;

  ns.GifExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  /**
   * List of Resolutions applicable for Gif export
   * @static
   * @type {Array} array of Objects {zoom:{Number}, default:{Boolean}}
   */
  ns.GifExportController.RESOLUTIONS = [
    {
      'zoom' : 1
    },{
      'zoom' : 5
    },{
      'zoom' : 10,
      'default' : true
    },{
      'zoom' : 20
    }
  ];

  ns.GifExportController.prototype.init = function () {
    this.radioTemplate_ = pskl.utils.Template.get("gif-export-radio-template");

    this.uploadStatusContainerEl = document.querySelector(".gif-upload-status");

    this.previewContainerEl = document.querySelector(".gif-export-preview");
    this.radioGroupEl = document.querySelector(".gif-export-radio-group");

    this.uploadForm = $("[name=gif-export-upload-form]");
    this.uploadForm.submit(this.onUploadFormSubmit_.bind(this));

    this.exportProgressStatusEl = document.querySelector('.gif-export-progress-status');
    this.exportProgressBarEl = document.querySelector('.gif-export-progress-bar');

    this.createRadioElements_();
  };

  ns.GifExportController.prototype.onUploadFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();
    var selectedZoom = this.getSelectedZoom_(),
        fps = this.piskelController.getFPS(),
        zoom = selectedZoom;

    this.renderAsImageDataAnimatedGIF(zoom, fps, this.onGifRenderingCompleted_.bind(this));
  };

  ns.GifExportController.prototype.onGifRenderingCompleted_ = function (imageData) {
    this.updatePreview_(imageData);
    this.previewContainerEl.classList.add("preview-upload-ongoing");
    pskl.app.imageUploadService.upload(imageData, this.onImageUploadCompleted_.bind(this));
  };

  ns.GifExportController.prototype.onImageUploadCompleted_ = function (imageUrl) {
    this.updatePreview_(imageUrl);
    this.updateStatus_(imageUrl);
    this.previewContainerEl.classList.remove("preview-upload-ongoing");

  };

  ns.GifExportController.prototype.updatePreview_ = function (src) {
    this.previewContainerEl.innerHTML = "<div><img style='max-width:240px;' src='"+src+"'/></div>";
  };

  ns.GifExportController.prototype.getSelectedZoom_ = function () {
    var radiosColl = this.uploadForm.get(0).querySelectorAll("[name=gif-zoom-level]"),
        radios = Array.prototype.slice.call(radiosColl,0);
    var selectedRadios = radios.filter(function(radio) {return !!radio.checked;});

    if (selectedRadios.length == 1) {
      return selectedRadios[0].value;
    } else {
      throw "Unexpected error when retrieving selected zoom";
    }
  };

  ns.GifExportController.prototype.createRadioElements_ = function () {
    var resolutions = ns.GifExportController.RESOLUTIONS;
    for (var i = 0 ; i < resolutions.length ; i++) {
      var radio = this.createRadioForResolution_(resolutions[i]);
      this.radioGroupEl.appendChild(radio);
    }
  };

  ns.GifExportController.prototype.createRadioForResolution_ = function (resolution) {
    var zoom = resolution.zoom;
    var label = zoom*this.piskelController.getWidth() + "x" + zoom*this.piskelController.getHeight();
    var value = zoom;

    var radioHTML = pskl.utils.Template.replace(this.radioTemplate_, {value : value, label : label});
    var radioEl = pskl.utils.Template.createFromHTML(radioHTML);

    if (resolution['default']) {
      var input = radioEl.getElementsByTagName("input")[0];
      input.setAttribute("checked", "checked");
    }

    return radioEl;
  };

  ns.GifExportController.prototype.blobToBase64_ = function(blob, cb) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      cb(dataUrl);
    };
    reader.readAsDataURL(blob);
  };

  ns.GifExportController.prototype.renderAsImageDataAnimatedGIF = function(zoom, fps, cb) {
    var gif = new window.GIF({
      workers: 2,
      quality: 10,
      width: this.piskelController.getWidth()*zoom,
      height: this.piskelController.getHeight()*zoom
    });

    for (var i = 0; i < this.piskelController.getFrameCount(); i++) {
      var frame = this.piskelController.getFrameAt(i);
      var canvasRenderer = new pskl.rendering.CanvasRenderer(frame, zoom);
      var canvas = canvasRenderer.render();
      gif.addFrame(canvas.getContext('2d'), {
        delay: 1000 / fps
      });
    }

    gif.on('progress', function(percentage) {
      this.updateProgressStatus_((percentage*100).toFixed(2));
    }.bind(this));

    gif.on('finished', function(blob) {
      this.hideProgressStatus_();
      // this.blobToBase64_(blob, cb);
    }.bind(this));

    gif.render();
  };

  ns.GifExportController.prototype.updateProgressStatus_ = function (percentage) {
    this.exportProgressStatusEl.innerHTML = percentage + '%';
    this.exportProgressBarEl.style.width = percentage + "%";

  };

  ns.GifExportController.prototype.hideProgressStatus_ = function () {
    this.exportProgressStatusEl.innerHTML = '';
    this.exportProgressBarEl.style.width = "0";
  };

  // FIXME : HORRIBLE COPY/PASTA

  ns.GifExportController.prototype.updateStatus_ = function (imageUrl, error) {
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

  ns.GifExportController.prototype.shorten_ = function (url, maxLength, suffix) {
    if (url.length > maxLength) {
      url = url.substring(0, maxLength);
      url += suffix;
    }
    return url;
  };
})();