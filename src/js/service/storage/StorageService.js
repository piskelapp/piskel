(function () {
  var ns = $.namespace('pskl.service.storage');

  ns.StorageService = function (piskelController) {
    this.piskelController = piskelController;
    this.savingFlag_ = false;

    this.onSaveSuccess_ = this.onSaveSuccess_.bind(this);
    this.onSaveError_ = this.onSaveError_.bind(this);
  };

  ns.StorageService.prototype.init = function () {
    pskl.app.shortcutService.addShortcut('ctrl+o', this.onOpenKey_.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+s', this.onSaveKey_.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+shift+s', this.onSaveAsKey_.bind(this));

    $.subscribe(Events.BEFORE_SAVING_PISKEL, this.setSavingFlag_.bind(this, true));
    $.subscribe(Events.AFTER_SAVING_PISKEL, this.setSavingFlag_.bind(this, false));
  };

  ns.StorageService.prototype.isSaving = function () {
    return this.savingFlag_;
  };

  ns.StorageService.prototype.saveToGallery = function (piskel) {
    return this.delegateSave_(pskl.app.galleryStorageService, piskel);
  };

  ns.StorageService.prototype.saveToLocalStorage = function (piskel) {
    return this.delegateSave_(pskl.app.localStorageService, piskel);
  };

  ns.StorageService.prototype.saveToFileBrowser = function (piskel) {
    return this.delegateSave_(pskl.app.fileDownloadStorageService, piskel);
  };

  ns.StorageService.prototype.saveToFileNodeWebkit = function (piskel, saveAsNew) {
    return this.delegateSave_(pskl.app.desktopStorageService, piskel, saveAsNew);
  };

  ns.StorageService.prototype.delegateSave_ = function(delegatedService, piskel, saveAsNew) {
    if (this.isSaving_) {
      return Q.reject('Already saving');
    }

    $.publish(Events.BEFORE_SAVING_PISKEL);
    return delegatedService.save(piskel, saveAsNew).then(this.onSaveSuccess_, this.onSaveError_);
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

  ns.StorageService.prototype.setSavingFlag_ = function (savingFlag) {
    this.savingFlag_ = savingFlag;
  };
})();
