(function () {
  var ns = $.namespace('pskl.service.storage');

  ns.StorageService = function (piskelController) {
    this.piskelController = piskelController;

    this.onSaveSuccess_ = this.onSaveSuccess_.bind(this);
    this.onSaveError_ = this.onSaveError_.bind(this);
  };

  ns.StorageService.prototype.init = function () {
    pskl.app.shortcutService.addShortcut('ctrl+o', this.onOpenKey_.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+s', this.onSaveKey_.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+shift+s', this.onSaveAsKey_.bind(this));
  };

  ns.StorageService.prototype.onOpenKey_ = function () {
    if (pskl.utils.Environment.detectNodeWebkit()) {
      pskl.app.desktopStorageService.openPiskel();
    }
    // no other implementation for now
  };

  ns.StorageService.prototype.onSaveKey_ = function () {
    var piskel = this.piskelController.getPiskel();
    if (pskl.app.isLoggedIn()) {
      this.saveToGallery(this.piskelController.getPiskel());
    } else if (pskl.utils.Environment.detectNodeWebkit()) {
      this.saveToFileNodeWebkit(this.piskelController.getPiskel());
    } else {
      this.saveToLocalStorage(this.piskelController.getPiskel());
    }
  };

  ns.StorageService.prototype.onSaveAsKey_ = function () {
    if (pskl.utils.Environment.detectNodeWebkit()) {
      this.saveToFileNodeWebkit(this.piskelController.getPiskel(), true);
    }
    // no other implementation for now
  };

  ns.StorageService.prototype.saveToGallery = function (piskel) {
    $.publish(Events.BEFORE_SAVING_PISKEL);
    return pskl.app.galleryStorageService.save(piskel).then(this.onSaveSuccess_, this.onSaveError_);
  };

  ns.StorageService.prototype.saveToLocalStorage = function (piskel) {
    $.publish(Events.BEFORE_SAVING_PISKEL);
    return pskl.app.localStorageService.save(piskel).then(this.onSaveSuccess_, this.onSaveError_);
  };

  ns.StorageService.prototype.saveToFileBrowser = function (piskel) {
    $.publish(Events.BEFORE_SAVING_PISKEL);
    return pskl.app.fileDownloadStorageService.save(piskel).then(this.onSaveSuccess_, this.onSaveError_);
  };

  ns.StorageService.prototype.saveToFileNodeWebkit = function (piskel, saveAsNew) {
    $.publish(Events.BEFORE_SAVING_PISKEL);
    return pskl.app.desktopStorageService.save(piskel, saveAsNew).then(this.onSaveSuccess_, this.onSaveError_);
  };

  ns.StorageService.prototype.onSaveSuccess_ = function () {
    $.publish(Events.SHOW_NOTIFICATION, [{'content': 'Successfully saved !'}]);
    $.publish(Events.PISKEL_SAVED);
    this.afterSaving_();
  };

  ns.StorageService.prototype.onSaveError_ = function (errorMessage) {
    var errorText = 'Saving failed';
    if (errorMessage) {
      errorText += ' : ' + errorMessage;
    }
    $.publish(Events.SHOW_NOTIFICATION, [{'content': errorText}]);
    this.afterSaving_();
    return Q.reject(errorMessage);
  };

  ns.StorageService.prototype.afterSaving_ = function () {
    $.publish(Events.AFTER_SAVING_PISKEL);
    window.setTimeout($.publish.bind($, Events.HIDE_NOTIFICATION), 5000);
  };
})();
