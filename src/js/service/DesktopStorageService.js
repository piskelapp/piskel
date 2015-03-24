(function () {
  var ns = $.namespace('pskl.service');

  ns.DesktopStorageService = function(piskelController) {
    this.piskelController = piskelController || pskl.app.piskelController;
    this.hideNotificationTimeoutID = 0;
  };

  ns.DesktopStorageService.prototype.init = function (){
    // activate keyboard shortcuts if this is the desktop version
    if (pskl.utils.Environment.detectNodeWebkit()) {
      pskl.app.shortcutService.addShortcut('ctrl+o', this.openPiskel.bind(this));
      pskl.app.shortcutService.addShortcut('ctrl+s', this.save.bind(this));
      pskl.app.shortcutService.addShortcut('ctrl+shift+s', this.savePiskelAs.bind(this));
    }
  };

  ns.DesktopStorageService.prototype.save = function () {
    var savePath = this.piskelController.getSavePath();
    // if we already have a filename, just save the file (using nodejs 'fs' api)
    if (savePath) {
      this.savePiskel(savePath);
    } else {
      this.savePiskelAs(savePath);
    }
  };

  ns.DesktopStorageService.prototype.savePiskel = function (savePath) {
    var serialized = this.piskelController.serialize();
    pskl.utils.FileUtilsDesktop.saveToFile(serialized, savePath, function () {
      this.onSaveSuccess_();
    }.bind(this));
  };

  ns.DesktopStorageService.prototype.openPiskel = function () {
    pskl.utils.FileUtilsDesktop.chooseFileDialog(function(filename){
      var savePath = filename;
      pskl.utils.FileUtilsDesktop.readFile(savePath, function(content){
        pskl.utils.PiskelFileUtils.decodePiskelFile(content, function (piskel, descriptor, fps) {
          piskel.setDescriptor(descriptor);
          // store save path so we can re-save without opening the save dialog
          piskel.savePath = savePath;
          pskl.app.piskelController.setPiskel(piskel);
          pskl.app.animationController.setFPS(fps);
        });
      });
    });
  };

  ns.DesktopStorageService.prototype.savePiskelAs = function (savePath) {
    var serialized = this.piskelController.serialize();
    // TODO: if there is already a file path, use it for the dialog's
    // working directory and filename
    pskl.utils.FileUtilsDesktop.saveAs(serialized, null, 'piskel', function (selectedSavePath) {
      this.onSaveSuccess_();
      this.piskelController.setSavePath(selectedSavePath);
    }.bind(this));
  };

  ns.DesktopStorageService.prototype.onSaveSuccess_ = function () {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
    $.publish(Events.SHOW_NOTIFICATION, [{"content": "Successfully saved !"}]);
    $.publish(Events.PISKEL_SAVED);
    // clear the old time out, if any.
    window.clearTimeout(this.hideNotificationTimeoutID);
    this.hideNotificationTimeoutID =
      window.setTimeout($.publish.bind($, Events.HIDE_NOTIFICATION), 2000);
  };

})();
