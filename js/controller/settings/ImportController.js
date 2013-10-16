(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.ImportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.ImportController.prototype.init = function () {
    this.fileUploadInput = $("[name=file-upload-input]");

    this.importForm = $("[name=import-form]");
    this.importForm.submit(this.onImportFormSubmit_.bind(this));
  };

  ns.ImportController.prototype.onImportFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();
    var files = this.fileUploadInput.get(0).files;
    if (files.length == 1) {
      var file = files[0];
      if (this.isImage_(file)) {
        this.readImageFile_(file);
      } else {
        throw "File is not an image : " + file.type;
      }
    }
  };

  ns.ImportController.prototype.readImageFile_ = function (imageFile) {
    pskl.utils.FileUtils.readFile(imageFile, this.processImageData_.bind(this));
  };

  ns.ImportController.prototype.processImageData_ = function (imageData) {
    var image = new Image();
    image.onload = this.onImageLoaded_.bind(this);
    image.src = imageData;
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
      console.log(framesheet);
    } else {
      console.log("ABORT ABORT");
    }
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