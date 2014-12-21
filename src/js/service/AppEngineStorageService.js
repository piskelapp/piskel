(function () {
  var ns = $.namespace('pskl.service');

  ns.AppEngineStorageService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.AppEngineStorageService.prototype.init = function () {};

  ns.AppEngineStorageService.prototype.store = function (callbacks) {
    var piskel = this.piskelController.getPiskel();
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
      data['public'] = true;
    }

    var success = function () {
      callbacks.success();
      callbacks.after();
    };

    var error = function (response) {
      callbacks.error(response.status);
      callbacks.after();
    };

    pskl.utils.Xhr.post(Constants.APPENGINE_SAVE_URL, data, success, error);
  };
})();