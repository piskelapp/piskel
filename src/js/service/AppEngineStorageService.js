(function () {
  var ns = $.namespace('pskl.service');

  ns.AppEngineStorageService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.AppEngineStorageService.prototype.init = function () {};

  ns.AppEngineStorageService.prototype.store = function (callbacks) {
    var formData = this.prepareFormData_();

    var xhr = new XMLHttpRequest();
    xhr.open('POST', Constants.APPENGINE.URL.SAVE, true);

    xhr.onload = function(e) {
      if (this.status == 200) {
        callbacks.success();
        callbacks.after();
      } else {
        this.onerror(e);
      }
    };
    xhr.onerror = function(e) {
      callbacks.error(this.status);
      callbacks.after();
    };
    xhr.send(formData);
  };

  ns.AppEngineStorageService.prototype.prepareFormData_ = function () {
    var piskel = this.piskelController.getPiskel();
    var descriptor = piskel.getDescriptor();

    var formData = new FormData();
    formData.append('framesheet', this.piskelController.serialize());
    formData.append('fps', this.piskelController.getFPS());
    formData.append('name', descriptor.name);
    formData.append('description', descriptor.description);
    if (descriptor.isPublic) {
      formData.append('public', true);
    }
    formData.append('frames', this.piskelController.getFrameCount());
    formData.append('first_frame_as_png', pskl.app.getFirstFrameAsPng());
    formData.append('framesheet_as_png', pskl.app.getFramesheetAsPng());

    return formData;
  };
})();