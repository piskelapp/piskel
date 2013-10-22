(function () {
  var ns = $.namespace('pskl.controller.settings');
  var DEFAULT_FILE_STATUS = 'No file selected ...';
  ns.ImportController = function (piskelController) {
    this.piskelController = piskelController;
    this.importedImage_ = null;
  };

  ns.ImportController.prototype.init = function () {
    this.importForm = $("[name=import-form]");
    this.hiddenFileInput = $("[name=file-upload-input]");
    this.fileInputButton = $(".file-input-button");
    this.fileInputStatus=$(".file-input-status");
    this.fileInputStatus.html(DEFAULT_FILE_STATUS);

    this.resizeWidth = $("[name=resize-width]");
    this.resizeHeight = $("[name=resize-height]");

    this.importForm.submit(this.onImportFormSubmit_.bind(this));
    this.hiddenFileInput.change(this.onFileUploadChange_.bind(this));
    this.fileInputButton.click(this.onFileInputClick_.bind(this));
  };

  ns.ImportController.prototype.reset_ = function () {
    this.importForm.get(0).reset();
    this.fileInputStatus.html(DEFAULT_FILE_STATUS);

  };

  ns.ImportController.prototype.onImportFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();
    this.importImageToPiskel_();
  };

  ns.ImportController.prototype.onFileUploadChange_ = function (evt) {
    this.importFromFile_();
  };

  ns.ImportController.prototype.onFileInputClick_ = function (evt) {
    this.hiddenFileInput.click();
  };

  ns.ImportController.prototype.importFromFile_ = function () {
    var files = this.hiddenFileInput.get(0).files;
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

  ns.ImportController.prototype.readImageFile_ = function (imageFile) {
    pskl.utils.FileUtils.readFile(imageFile, this.processImageSource_.bind(this));
  };

  /**
   * Create an image from the given source (url or data-url), and onload forward to onImageLoaded
   * TODO : should be a generic utility method, should take a callback
   * @param  {String} imageSource url or data-url, will be used as src for the image
   */
  ns.ImportController.prototype.processImageSource_ = function (imageSource) {
    this.importedImage_ = new Image();
    this.importedImage_.onload = this.onImageLoaded_.bind(this);
    this.importedImage_.src = imageSource;
  };

  ns.ImportController.prototype.onImageLoaded_ = function (evt) {
    var w = this.importedImage_.width,
        h = this.importedImage_.height;
    this.resizeWidth.val(w);
    this.resizeHeight.val(h);

    var filePath = this.hiddenFileInput.val();
    var fileName = this.extractFileNameFromPath_(filePath);
    this.fileInputStatus.html(fileName);
  };

  ns.ImportController.prototype.extractFileNameFromPath_ = function (path) {
    var parts = [];
    if (path.indexOf('/') !== -1) {
      parts = path.split('/');
    } else if (path.indexOf('\\') !== -1) {
      parts = path.split('\\');
    } else {
      parts = [path];
    }
    return parts[parts.length-1];
  };

  ns.ImportController.prototype.importImageToPiskel_ = function () {
    if (this.importedImage_) {
      var image = this.importedImage_;
      var frames = this.createFramesFromImage(image);
      var confirmationMessage = "You are about to erase your current Piskel. " +
        "A new Piskel will be created from your picture, size : " + image.width + "x" + image.height;

      if (window.confirm(confirmationMessage)) {
        var piskel = pskl.utils.Serializer.createPiskel([frames]);
        pskl.app.piskelController.setPiskel(piskel);
        pskl.app.animationController.setFPS(12);
      }

      this.reset_();
    }
  };

  ns.ImportController.prototype.createFramesFromImage = function (image) {
    var w = image.width,
      h = image.height;
    var canvas = pskl.CanvasUtils.createCanvas(w, h);
    var context = canvas.getContext('2d');

    context.drawImage(image, 0,0,w,h,0,0,w,h);
    var imgData = context.getImageData(0,0,w,h).data;
    // Draw the zoomed-up pixels to a different canvas context
    var frames = [];
    for (var x=0;x<image.width;++x){
      frames[x] = [];
      for (var y=0;y<image.height;++y){
        // Find the starting index in the one-dimensional image data
        var i = (y*image.width + x)*4;
        var r = imgData[i  ];
        var g = imgData[i+1];
        var b = imgData[i+2];
        var a = imgData[i+3];
        if (a < 125) {
          frames[x][y] = "TRANSPARENT";
        } else {
          frames[x][y] = this.rgbToHex_(r,g,b);
        }
      }
    }
    return frames;
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