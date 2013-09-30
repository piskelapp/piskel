(function () {
  var ns = $.namespace("pskl.controller.settings");

  ns.GifExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  /**
   * List of Resolutions applicable for Gif export
   * @static
   * @type {Array} array of Objects {dpi:{Number}, default:{Boolean}}
   */
  ns.GifExportController.RESOLUTIONS = [
    {
      'dpi' : 1
    },{
      'dpi' : 5
    },{
      'dpi' : 10,
      'default' : true
    },{
      'dpi' : 20
    }
  ];

  ns.GifExportController.prototype.init = function () {
    this.radioTemplate_ = pskl.utils.Template.get("export-gif-radio-template");

    this.previewContainerEl = document.querySelectorAll(".export-gif-preview div")[0];
    this.radioGroupEl = document.querySelectorAll(".gif-export-radio-group")[0];

    this.uploadForm = $("[name=gif-export-upload-form]");
    this.uploadForm.submit(this.onUploadFormSubmit_.bind(this));

    this.createRadioElements_();
  };

  ns.GifExportController.prototype.onUploadFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();
    var selectedDpi = this.getSelectedDpi_(),
        fps = this.piskelController.getFPS(),
        dpi = selectedDpi;

    this.renderAsImageDataAnimatedGIF(dpi, fps, this.onGifRenderingCompleted_.bind(this));
  };

  ns.GifExportController.prototype.onGifRenderingCompleted_ = function (imageData) {
    this.updatePreview_(imageData);
    this.previewContainerEl.classList.add("preview-upload-ongoing");
    pskl.app.imageUploadService.upload(imageData, this.onImageUploadCompleted_.bind(this));
  };

  ns.GifExportController.prototype.onImageUploadCompleted_ = function (imageUrl) {
    this.updatePreview_(imageUrl);
    this.previewContainerEl.classList.remove("preview-upload-ongoing");
  };

  ns.GifExportController.prototype.updatePreview_ = function (src) {
    this.previewContainerEl.innerHTML = "<img style='max-width:240px;' src='"+src+"'/>";
  };

  ns.GifExportController.prototype.getSelectedDpi_ = function () {
    var radiosColl = this.uploadForm.get(0).querySelectorAll("[name=gif-dpi]"),
        radios = Array.prototype.slice.call(radiosColl,0);
    var selectedRadios = radios.filter(function(radio) {return !!radio.checked;});

    if (selectedRadios.length == 1) {
      return selectedRadios[0].value;
    } else {
      throw "Unexpected error when retrieving selected dpi";
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
    var dpi = resolution.dpi;
    var label = dpi*this.piskelController.getWidth() + "x" + dpi*this.piskelController.getHeight();
    var value = dpi;

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

  ns.GifExportController.prototype.renderAsImageDataAnimatedGIF = function(dpi, fps, cb) {
    var gif = new window.GIF({
      workers: 2,
      quality: 10,
      width: this.piskelController.getWidth()*dpi,
      height: this.piskelController.getHeight()*dpi
    });

    for (var i = 0; i < this.piskelController.getFrameCount(); i++) {
      var frame = this.piskelController.getFrameAt(i);
      var renderer = new pskl.rendering.CanvasRenderer(frame, dpi);
      gif.addFrame(renderer.render(), {
        delay: 1000 / fps
      });
    }

    gif.on('finished', function(blob) {
      this.blobToBase64_(blob, cb);
    }.bind(this));

    gif.render();
  };
})();