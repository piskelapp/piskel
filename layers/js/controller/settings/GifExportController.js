(function () {
  var ns = $.namespace("pskl.controller.settings");
  ns.GifExportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.GifExportController.prototype.init = function () {
    this.radioTemplate_ = pskl.utils.Template.get("export-gif-radio-template");

    this.previewContainerEl = document.querySelectorAll(".export-gif-preview div")[0];
    this.radioGroupEl = document.querySelectorAll(".gif-export-radio-group")[0];

    this.uploadFormJQ = $("[name=gif-export-upload-form]");    
    this.uploadFormJQ.submit(this.upload.bind(this));

    this.initRadioElements_();
  };

  ns.GifExportController.prototype.upload = function (evt) {
    evt.originalEvent.preventDefault();
    var selectedDpi = this.getSelectedDpi_(),
        fps = pskl.app.animationController.fps,
        dpi = selectedDpi;

    this.renderAsImageDataAnimatedGIF(dpi, fps, function (imageData) {
      this.updatePreview_(imageData);
      this.previewContainerEl.classList.add("preview-upload-ongoing");
      pskl.app.imageUploadService.upload(imageData, function (imageUrl) {
        this.updatePreview_(imageUrl);
        this.previewContainerEl.classList.remove("preview-upload-ongoing");
      }.bind(this));
    }.bind(this));
  };

  ns.GifExportController.prototype.updatePreview_ = function (src) {
    this.previewContainerEl.innerHTML = "<img style='max-width:240px;' src='"+src+"'/>";
  };

  ns.GifExportController.prototype.getSelectedDpi_ = function () {
    var radiosColl = this.uploadFormJQ.get(0).querySelectorAll("[name=gif-dpi]"),
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
      [10,true], //default
      [20],
    ];

    for (var i = 0 ; i < dpis.length ; i++) {
      var dpi = dpis[i];
      var radio = this.createRadioForDpi_(dpi);
      this.radioGroupEl.appendChild(radio);
    }
  };

  ns.GifExportController.prototype.createRadioForDpi_ = function (dpi) {
    var label = dpi[0]*this.piskelController.getWidth() + "x" + dpi[0]*this.piskelController.getHeight();
    var value = dpi[0];
    var radioHTML = pskl.utils.Template.replace(this.radioTemplate_, {value : value, label : label});
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