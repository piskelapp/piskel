(function () {
  var ns = $.namespace("pskl.controller.settings");
  ns.GifExportController = function (framesheet) {
    this.framesheet = framesheet;
  };

  ns.GifExportController.prototype.init = function () {
    this.initRadioElements_();

    this.previewContainer = document.querySelectorAll(".export-gif-preview div")[0];
    this.uploadForm = $("[name=gif-export-upload-form]");
    
    this.uploadForm.submit(this.upload.bind(this));
  };

  ns.GifExportController.prototype.upload = function (evt) {
    evt.originalEvent.preventDefault();
    var selectedDpi = this.getSelectedDpi_(),
        fps = pskl.app.animationController.fps,
        dpi = selectedDpi;

    this.renderAsImageDataAnimatedGIF(dpi, fps, function (imageData) {
      this.updatePreview_(imageData);
      this.previewContainer.classList.add("preview-upload-ongoing");
      pskl.app.imageUploadService.upload(imageData, function (imageUrl) {
        this.updatePreview_(imageUrl);
        this.previewContainer.classList.remove("preview-upload-ongoing");
      }.bind(this));
    }.bind(this));
  };

  ns.GifExportController.prototype.updatePreview_ = function (src) {
    this.previewContainer.innerHTML = "<img style='max-width:240px;' src='"+src+"'/>";
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

  ns.GifExportController.prototype.initRadioElements_ = function () {
    var dpis = [
      [1],
      [5],
      [10,true] //default
    ];

    var radioTpl = $("#export-gif-radio-template").get(0);
    for (var i = 0 ; i < dpis.length ; i++) {
      var dpi = dpis[i];
      var radio = this.createRadioForDpi_(dpi, radioTpl.innerHTML);
      radioTpl.parentNode.insertBefore(radio, radioTpl);
    }
  };

  ns.GifExportController.prototype.createRadioForDpi_ = function (dpi, template) {
    var label = dpi[0]*this.framesheet.getWidth() + "x" + dpi[0]*this.framesheet.getHeight();
    var value = dpi[0];
    var radioHTML = pskl.utils.Template.replace(template, {value : value, label : label});
    var radio = pskl.utils.Template.createFromHTML(radioHTML);
    
    if (dpi[1]) {
      radio.getElementsByTagName("input")[0].setAttribute("checked", "checked");
    }

    return radio;
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
      width: this.framesheet.getWidth()*dpi,
      height: this.framesheet.getHeight()*dpi
    });

    for (var i = 0; i < this.framesheet.frames.length; i++) {
      var frame = this.framesheet.frames[i];
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