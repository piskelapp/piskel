(function () {
  var ns = $.namespace('pskl.service.storage');

  ns.StorageService = function (piskelController) {
    this.piskelController = piskelController;
    this.savingFlag_ = false;

    this.onSaveSuccess_ = this.onSaveSuccess_.bind(this);
    this.onSaveError_ = this.onSaveError_.bind(this);
  };

  ns.StorageService.prototype.init = function () {
    var shortcuts = pskl.service.keyboard.Shortcuts;
    pskl.app.shortcutService.registerShortcut(shortcuts.STORAGE.OPEN, this.onOpenKey_.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.STORAGE.SAVE, this.onSaveKey_.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.STORAGE.SAVE_AS, this.onSaveAsKey_.bind(this));

    $.subscribe(Events.BEFORE_SAVING_PISKEL, this.setSavingFlag_.bind(this, true));
    $.subscribe(Events.AFTER_SAVING_PISKEL, this.setSavingFlag_.bind(this, false));
  };

  ns.StorageService.prototype.isSaving = function () {
    return this.savingFlag_;
  };

  ns.StorageService.prototype.saveToGallery = function (piskel) {
    return this.delegateSave_(pskl.app.galleryStorageService, piskel);
  };

  // @deprecated, use saveToIndexedDb unless indexedDb is not available.
  ns.StorageService.prototype.saveToLocalStorage = function (piskel) {
    return this.delegateSave_(pskl.app.localStorageService, piskel);
  };

  ns.StorageService.prototype.saveToIndexedDb = function (piskel) {
    return this.delegateSave_(pskl.app.indexedDbStorageService, piskel);
  };

  ns.StorageService.prototype.saveToFileDownload = function (piskel) {
    return this.delegateSave_(pskl.app.fileDownloadStorageService, piskel);
  };

  ns.StorageService.prototype.saveToDesktop = function (piskel, saveAsNew) {
    return this.delegateSave_(pskl.app.desktopStorageService, piskel, saveAsNew);
  };

  ns.StorageService.prototype.delegateSave_ = function(delegatedService, piskel, saveAsNew) {
    if (this.savingFlag_) {
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

  ns.StorageService.prototype.onSaveKey_ = function (charkey) {
    var piskel = this.piskelController.getPiskel();
    if (pskl.app.isLoggedIn()) {
      this.saveToGallery(this.piskelController.getPiskel());
    } else if (pskl.utils.Environment.detectNodeWebkit()) {
      this.saveToDesktop(this.piskelController.getPiskel());
    } else {
      // saveToLocalStorage might display a native confirm dialog
      // on Firefox, the native 'save' window will then be displayed
      // wrap in timeout in order to start saving only after event.preventDefault
      // has been done
      window.setTimeout(function () {
        this.saveToIndexedDb(this.piskelController.getPiskel());
      }.bind(this), 0);
    }
  };

  ns.StorageService.prototype.onSaveAsKey_ = function () {
    if (pskl.utils.Environment.detectNodeWebkit()) {
      this.saveToDesktop(this.piskelController.getPiskel(), true);
    }
    // no other implementation for now
  };

  ns.StorageService.prototype.onSaveSuccess_ = function () {
    $.publish(Events.SHOW_NOTIFICATION, [{
      content : 'Successfully saved !',
      hideDelay : 3000
    }]);
    $.publish(Events.PISKEL_SAVED);
    this.afterSaving_();
  };

  ns.StorageService.prototype.onSaveError_ = function (errorMessage) {
    var errorText = 'Saving failed';
    if (errorMessage) {
      errorText += ' : ' + errorMessage;
    }
    $.publish(Events.SHOW_NOTIFICATION, [{
      content : errorText,
      hideDelay : 10000
    }]);
    this.afterSaving_();
    return Q.reject(errorMessage);
  };

  ns.StorageService.prototype.afterSaving_ = function () {
    $.publish(Events.AFTER_SAVING_PISKEL);
  };

  ns.StorageService.prototype.setSavingFlag_ = function (savingFlag) {
    this.savingFlag_ = savingFlag;
  };
})();
