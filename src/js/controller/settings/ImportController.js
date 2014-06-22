(function () {
  var ns = $.namespace('pskl.controller.settings');
  var DEFAULT_FILE_STATUS = '';
  var PREVIEW_HEIGHT  = 60;

  ns.ImportController = function (piskelController) {
    this.piskelController = piskelController;
    this.importedImage_ = null;
  };

  ns.ImportController.prototype.init = function () {
    this.hiddenOpenPiskelInput = $('[name=open-piskel-input]');
    this.openPiskelInputButton = $('.open-piskel-button');

    this.importForm = $('[name=import-form]');
    this.hiddenFileInput = $('[name=file-upload-input]');
    this.fileInputButton = $('.file-input-button');
    this.fileInputStatus = $('.file-input-status');
    this.fileInputStatus.html(DEFAULT_FILE_STATUS);

    this.importPreview = $('.import-section-preview');

    this.resizeWidth = $('[name=resize-width]');
    this.resizeHeight = $('[name=resize-height]');
    this.smoothResize =  $('[name=smooth-resize-checkbox]');

    $('.import-options').hide();

    this.importForm.submit(this.onImportFormSubmit_.bind(this));
    this.hiddenFileInput.change(this.onFileUploadChange_.bind(this));
    this.fileInputButton.click(this.onFileInputClick_.bind(this));

    this.hiddenOpenPiskelInput.change(this.onOpenPiskelChange_.bind(this));
    this.openPiskelInputButton.click(this.onOpenPiskelClick_.bind(this));

    this.resizeWidth.keyup(this.onResizeInputKeyUp_.bind(this, 'width'));
    this.resizeHeight.keyup(this.onResizeInputKeyUp_.bind(this, 'height'));
  };

  ns.ImportController.prototype.reset_ = function () {
    this.importForm.get(0).reset();
    this.fileInputStatus.html(DEFAULT_FILE_STATUS);
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.ImportController.prototype.onResizeInputKeyUp_ = function (from, evt) {
    if (this.importedImage_) {
      this.synchronizeResizeFields_(evt.target.value, from);
    }
  };

  ns.ImportController.prototype.synchronizeResizeFields_ = function (value, from) {
    value = parseInt(value, 10);
    if (isNaN(value)) {
      value = 0;
    }
    var height = this.importedImage_.height, width = this.importedImage_.width;
    if (from === 'width') {
      this.resizeHeight.val(Math.round(value * height / width));
    } else {
      this.resizeWidth.val(Math.round(value * width / height));
    }
  };

  ns.ImportController.prototype.onImportFormSubmit_ = function (evt) {
    evt.originalEvent.preventDefault();
    this.importImageToPiskel_();
  };

  ns.ImportController.prototype.onFileUploadChange_ = function (evt) {
    this.importPictureFromFile_();
  };

  ns.ImportController.prototype.onFileInputClick_ = function (evt) {
    this.hiddenFileInput.click();
  };

  ns.ImportController.prototype.onOpenPiskelChange_ = function (evt) {
    this.openPiskelFile_();
  };

  ns.ImportController.prototype.onOpenPiskelClick_ = function (evt) {
    this.hiddenOpenPiskelInput.click();
  };

  ns.ImportController.prototype.openPiskelFile_ = function () {
    var files = this.hiddenOpenPiskelInput.get(0).files;
    if (files.length == 1) {

      var file = files[0];
      if (this.isPiskel_(file)){
        pskl.utils.FileUtils.readFile(file, function (content) {
          var rawPiskel = window.atob(content.replace('data:;base64,',''));
          var serializedPiskel = JSON.parse(rawPiskel);
          var name = serializedPiskel.piskel.name;
          var description = serializedPiskel.piskel.description;
          var fps = serializedPiskel.piskel.fps;

          pskl.utils.serialization.Deserializer.deserialize(serializedPiskel, function (piskel) {
            piskel.setDescriptor(new pskl.model.piskel.Descriptor(name, description, true));
            pskl.app.piskelController.setPiskel(piskel);
            pskl.app.animationController.setFPS(fps);
          });
        });
        this.reset_();
      }
    }
  };


  ns.ImportController.prototype.importPictureFromFile_ = function () {
    var files = this.hiddenFileInput.get(0).files;
    if (files.length == 1) {
      var file = files[0];
      if (this.isImage_(file)) {
        this.readImageFile_(file);
        this.enableDisabledSections_();
      } else {
        this.reset_();
        throw 'File is not an image : ' + file.type;
      }
    }
  };

  ns.ImportController.prototype.enableDisabledSections_ = function () {
    this.fileInputButton.removeClass('button-primary');
    this.fileInputButton.blur();
    $('.import-options').show();
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

    // FIXME : We remove the onload callback here because JsGif will insert
    // the image again and we want to avoid retriggering the image onload
    this.importedImage_.onload = function () {};

    var filePath = this.hiddenFileInput.val();
    var fileName = this.extractFileNameFromPath_(filePath);
    this.fileInputStatus.html(fileName);

    this.resizeWidth.val(w);
    this.resizeHeight.val(h);

    this.importPreview.width('auto');
    this.importPreview.html('');
    this.importPreview.append(this.createImagePreview_());
  };

  ns.ImportController.prototype.createImagePreview_ = function () {
    var image = document.createElement('IMG');
    image.src = this.importedImage_.src;
    image.setAttribute('height', PREVIEW_HEIGHT);
    return image;
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
    var image = this.importedImage_;
    if (image) {
      if (window.confirm('You are about to create a new Piskel, unsaved changes will be lost.')) {
        var gifLoader = new window.SuperGif({
          gif : image
        });

        gifLoader.load({
          success : function(){
            var images = gifLoader.getFrames().map(function (frame) {
              return pskl.CanvasUtils.createFromImageData(frame.data);
            });
            this.createPiskelFromImages_(images);
          }.bind(this),
          error : function () {
            this.createPiskelFromImages_([image]);
          }.bind(this)
        });

      }
    }
  };

  ns.ImportController.prototype.createFramesFromImages_ = function (images) {
    var w = this.resizeWidth.val();
    var h = this.resizeHeight.val();
    var smoothing = !!this.smoothResize.prop('checked');

    var frames = images.map(function (image) {
      var resizedImage = pskl.utils.ImageResizer.resize(image, w, h, smoothing);
      return pskl.utils.FrameUtils.createFromImage(resizedImage);
    });
    return frames;
  };

  ns.ImportController.prototype.createPiskelFromImages_ = function (images) {
    var frames = this.createFramesFromImages_(images);
    var layer = pskl.model.Layer.fromFrames('Layer 1', frames);
    var descriptor = new pskl.model.piskel.Descriptor('Imported piskel', '');
    var piskel = pskl.model.Piskel.fromLayers([layer], descriptor);

    pskl.app.piskelController.setPiskel(piskel);
    pskl.app.animationController.setFPS(Constants.DEFAULT.FPS);

    this.reset_();
  };

  ns.ImportController.prototype.isImage_ = function (file) {
    return file.type.indexOf('image') === 0;
  };

  ns.ImportController.prototype.isPiskel_ = function (file) {
    return (/\.piskel$/).test(file.name);
  };

})();