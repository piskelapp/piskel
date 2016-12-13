(function () {
  var ns = $.namespace('pskl.service.storage');
  var PISKEL_EXTENSION = '.piskel';

  ns.DesktopStorageService = function(piskelController) {
    this.piskelController = piskelController || pskl.app.piskelController;
    this.hideNotificationTimeoutID = 0;
  };

  ns.DesktopStorageService.prototype.init = function () {};

  ns.DesktopStorageService.prototype.save = function (piskel, saveAsNew) {
    if (piskel.savePath && !saveAsNew) {
      return this.saveAtPath_(piskel, piskel.savePath);
    } else {
      var name = piskel.getDescriptor().name;
      var filenamePromise = pskl.utils.FileUtilsDesktop.chooseFilenameDialog(name, PISKEL_EXTENSION);
      return filenamePromise.then(this.saveAtPath_.bind(this, piskel));
    }
  };

  ns.DesktopStorageService.prototype.saveAtPath_ = function (piskel, savePath) {
    if (!savePath) {
      return Q.reject('Invalid file name');
    }

    var serialized = pskl.utils.serialization.Serializer.serialize(piskel);
    savePath = this.addExtensionIfNeeded_(savePath);
    piskel.savePath = savePath;
    piskel.setName(this.extractFilename_(savePath));
    return pskl.utils.FileUtilsDesktop.saveToFile(serialized, savePath);
  };

  ns.DesktopStorageService.prototype.openPiskel = function () {
    return pskl.utils.FileUtilsDesktop.chooseFilenameDialog().then(this.load);
  };

  ns.DesktopStorageService.prototype.load = function (savePath) {
    pskl.utils.FileUtilsDesktop.readFile(savePath).then(function (content) {
      pskl.utils.PiskelFileUtils.decodePiskelFile(content, function (piskel) {
        // store save path so we can re-save without opening the save dialog
        piskel.savePath = savePath;
        pskl.app.piskelController.setPiskel(piskel);
      });
    });
  };

  ns.DesktopStorageService.prototype.addExtensionIfNeeded_ = function (filename) {
    var hasExtension = filename.substr(-PISKEL_EXTENSION.length) === PISKEL_EXTENSION;
    if (!hasExtension) {
      return filename + PISKEL_EXTENSION;
    }
    return filename;
  };

  ns.DesktopStorageService.prototype.extractFilename_ = function (savePath) {
    var matches = (/[\/\\]([^\/\\]*)\.piskel$/gi).exec(savePath);
    if (matches && matches[1]) {
      return matches[1];
    }
  };
})();
