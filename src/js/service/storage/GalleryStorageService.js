(function () {
  var ns = $.namespace('pskl.service.storage');

  ns.GalleryStorageService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.GalleryStorageService.prototype.init = function () {};

  ns.GalleryStorageService.prototype.store = function (piskel, onSuccess, onError) {
    var descriptor = piskel.getDescriptor();

    var data = {
      framesheet : this.piskelController.serialize(),
      fps : this.piskelController.getFPS(),
      name : descriptor.name,
      description : descriptor.description,
      frames : this.piskelController.getFrameCount(),
      first_frame_as_png : pskl.app.getFirstFrameAsPng(),
      framesheet_as_png : pskl.app.getFramesheetAsPng()
    };

    if (descriptor.isPublic) {
      data.public = true;
    }

    var errorCallback = function (response) {
      onError(response.status);
    };

    pskl.utils.Xhr.post(Constants.APPENGINE_SAVE_URL, data, onSuccess, errorCallback);
  };
})();
