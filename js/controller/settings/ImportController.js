(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.ImportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.ImportController.prototype.init = function () {
    this.fileUploadInput = $("[name=file-upload-input]");
    this.urlInput = $("[name=url-input]");
    this.importForm = $("[name=import-form]");
    this.importForm.submit(this.onImportFormSubmit_.bind(this));
  };

  ns.ImportController.prototype.reset_ = function () {
    this.importForm.get(0).reset();
  };

  ns.ImportController.prototype.onImportFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();
    var importType = this.getSelectedRadioValue_();
    if (importType === 'FILE') {
      this.importFromFile_();
    } else if (importType === 'URL') {
      this.importFromUrl_();
    }
  };

  ns.ImportController.prototype.getSelectedRadioValue_ = function () {
    var radios = this.getRadios_();
    var selectedRadios = radios.filter(function(radio) {
      return !!radio.checked;
    });

    if (selectedRadios.length == 1) {
      return selectedRadios[0].value;
    } else {
      throw "Unexpected error when retrieving selected radio";
    }
  };

  ns.ImportController.prototype.importFromFile_ = function () {
    var files = this.fileUploadInput.get(0).files;
    if (files.length == 1) {
      var file = files[0];
      if (this.isImage_(file)) {
        this.readImageFile_(file);
      } else {
        this.reset_();
        throw "File is not an image : " + file.type;
      }
    }
  };

  ns.ImportController.prototype.importFromUrl_ = function () {
    var url = this.urlInput.get(0).value;
    if (this.isUrl_(url)) {
      this.processImageSource_(url);
    } else {
      this.reset_();
      throw "Not a url : " + url;
    }
  };

  /**
   * TODO : implement it properly
   * @param  {String}  url potential url to test
   * @return {Boolean} true if url looks like a URL
   */
  ns.ImportController.prototype.isUrl_ = function (url) {
    if (typeof url === 'string') {
      return (/^http/).test(url);
    } else {
      return false;
    }
  };

  ns.ImportController.prototype.getRadios_ = function () {
    var radiosColl = this.importForm.get(0).querySelectorAll("[name=upload-source-type]"),
    radios = Array.prototype.slice.call(radiosColl,0);
    return radios;
  };

  ns.ImportController.prototype.readImageFile_ = function (imageFile) {
    pskl.utils.FileUtils.readFile(imageFile, this.processImageSource_.bind(this));
  };

  /**
   * Create an image from the given source (url or data-url), and onload forward to onImageLoaded
   * TODO : should be a generic utility method, should take a callback
   * @param  {String} imageSource url or data-url, will be used as src for the image
   */
  ns.ImportController.prototype.processImageSource_ = function (imageSource) {
    var image = new Image();
    image.onload = this.onImageLoaded_.bind(this);
    image.crossOrigin = '';
    image.src = imageSource;
  };

  ns.ImportController.prototype.onImageLoaded_ = function (evt) {
    var image = evt.target;

    var w = image.width, h = image.height;
    var canvas = pskl.CanvasUtils.createCanvas(w, h);
    var context = canvas.getContext('2d');

    context.drawImage(image, 0,0,w,h,0,0,w,h);
    var imgData = context.getImageData(0,0,w,h).data;
    // Draw the zoomed-up pixels to a different canvas context
    var framesheet = [];
    for (var x=0;x<image.width;++x){
      framesheet[x] = [];
      for (var y=0;y<image.height;++y){
        // Find the starting index in the one-dimensional image data
        var i = (y*image.width + x)*4;
        var r = imgData[i  ];
        var g = imgData[i+1];
        var b = imgData[i+2];
        var a = imgData[i+3];
        if (a < 125) {
          framesheet[x][y] = "TRANSPARENT";
        } else {
          framesheet[x][y] = this.rgbToHex_(r,g,b);
        }
      }
    }
    var confirmationMessage = "You are about to erase your current Piskel. " +
      "A new Piskel will be created from your picture, size : " + w + "x" + h;

    if (window.confirm(confirmationMessage)) {
      var piskel = pskl.utils.Serializer.createPiskel([framesheet]);
      pskl.app.piskelController.setPiskel(piskel);
      pskl.app.animationController.setFPS(12);
    }

    this.reset_();
  };

  ns.ImportController.prototype.rgbToHex_ = function (r, g, b) {
    return "#" + this.componentToHex_(r) + this.componentToHex_(g) + this.componentToHex_(b);
  };

  ns.ImportController.prototype.componentToHex_ = function (c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  };

  ns.ImportController.prototype.isImage_ = function (file) {
    return file.type.indexOf('image') === 0;
  };

})();