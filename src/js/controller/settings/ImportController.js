(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.ImportController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(ns.ImportController, pskl.controller.settings.AbstractSettingController);

  ns.ImportController.prototype.init = function () {
    this.hiddenFileInput = document.querySelector('[name="file-upload-input"]');
    this.addEventListener(this.hiddenFileInput, 'change', this.onFileUploadChange_);

    this.hiddenOpenPiskelInput = document.querySelector('[name="open-piskel-input"]');

    this.addEventListener('.browse-local-button', 'click', this.onBrowseLocalClick_);
    this.addEventListener('.file-input-button', 'click', this.onFileInputClick_);

    // different handlers, depending on the Environment
    if (pskl.utils.Environment.detectNodeWebkit()) {
      this.addEventListener('.open-piskel-button', 'click', this.openPiskelDesktop_);
    } else {
      this.addEventListener(this.hiddenOpenPiskelInput, 'change', this.onOpenPiskelChange_);
      this.addEventListener('.open-piskel-button', 'click', this.onOpenPiskelClick_);
    }

    this.initRestoreSession_();
  };

  ns.ImportController.prototype.initRestoreSession_ = function () {
    var previousSessionContainer = document.querySelector('.previous-session');
    var previousInfo = pskl.app.backupService.getPreviousPiskelInfo();
    if (previousInfo) {
      var previousSessionTemplate_ = pskl.utils.Template.get('previous-session-info-template');
      var date = pskl.utils.DateUtils.format(previousInfo.date, '{{H}}:{{m}} - {{Y}}/{{M}}/{{D}}');
      previousSessionContainer.innerHTML = pskl.utils.Template.replace(previousSessionTemplate_, {
        name : previousInfo.name,
        date : date
      });
      this.addEventListener('.restore-session-button', 'click', this.onRestorePreviousSessionClick_);
    } else {
      previousSessionContainer.innerHTML = 'No piskel backup was found on this browser.';
    }
  };

  ns.ImportController.prototype.closeDrawer_ = function () {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };
  ns.ImportController.prototype.onFileUploadChange_ = function (evt) {
    this.importPictureFromFile_();
  };

  ns.ImportController.prototype.onFileInputClick_ = function (evt) {
    this.hiddenFileInput.click();
  };

  ns.ImportController.prototype.onOpenPiskelChange_ = function (evt) {
    var files = this.hiddenOpenPiskelInput.files;
    if (files.length == 1) {
      this.openPiskelFile_(files[0]);
    }
  };

  ns.ImportController.prototype.openPiskelDesktop_ = function (evt) {
    this.closeDrawer_();
    pskl.app.desktopStorageService.openPiskel();
  };

  ns.ImportController.prototype.onOpenPiskelClick_ = function (evt) {
    this.hiddenOpenPiskelInput.click();
  };

  ns.ImportController.prototype.onBrowseLocalClick_ = function (evt) {
    $.publish(Events.DIALOG_DISPLAY, {
      dialogId : 'browse-local'
    });
    this.closeDrawer_();
  };

  ns.ImportController.prototype.openPiskelFile_ = function (file) {
    if (this.isPiskel_(file)) {
      pskl.utils.PiskelFileUtils.loadFromFile(file,
        // onSuccess
        function (piskel) {
          pskl.app.piskelController.setPiskel(piskel);
        },
        // onError
        function (reason) {
          $.publish(Events.PISKEL_FILE_IMPORT_FAILED, [reason]);
        });
      this.closeDrawer_();
    }
  };

  ns.ImportController.prototype.importPictureFromFile_ = function () {
    var files = this.hiddenFileInput.files;
    if (files.length == 1) {
      var file = files[0];
      if (this.isImage_(file)) {
        $.publish(Events.DIALOG_DISPLAY, {
          dialogId : 'import-image',
          initArgs : file
        });
        this.closeDrawer_();
      } else {
        this.closeDrawer_();
        console.error('File is not an image : ' + file.type);
      }
    }
  };

  ns.ImportController.prototype.isImage_ = function (file) {
    return file.type.indexOf('image') === 0;
  };

  ns.ImportController.prototype.isPiskel_ = function (file) {
    return (/\.piskel$/).test(file.name);
  };

  ns.ImportController.prototype.onRestorePreviousSessionClick_ = function () {
    if (window.confirm('This will erase your current workspace. Continue ?')) {
      pskl.app.backupService.load();
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
    }
  };
})();
