(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.ImportController = function (piskelController) {
    this.piskelController = piskelController;
    this.importedImage_ = null;
  };

  ns.ImportController.prototype.init = function () {
    this.browseLocalButton = document.querySelector('.browse-local-button');
    this.browseLocalButton.addEventListener('click', this.onBrowseLocalClick_.bind(this));

    this.hiddenFileInput = $('[name=file-upload-input]');
    this.hiddenFileInput.change(this.onFileUploadChange_.bind(this));

    this.fileInputButton = $('.file-input-button');
    this.fileInputButton.click(this.onFileInputClick_.bind(this));

    this.hiddenOpenPiskelInput = $('[name=open-piskel-input]');
    this.hiddenOpenPiskelInput.change(this.onOpenPiskelChange_.bind(this));

    this.openPiskelInputButton = $('.open-piskel-button');
    this.openPiskelInputButton.click(this.onOpenPiskelClick_.bind(this));

    this.prevSessionContainer = $('.previous-session');
    this.previousSessionTemplate_ = pskl.utils.Template.get("previous-session-info-template");
    this.fillRestoreSession_();
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
    var files = this.hiddenOpenPiskelInput.get(0).files;
    if (files.length == 1) {
      this.openPiskelFile_(files[0]);
    }
  };

  ns.ImportController.prototype.onOpenPiskelClick_ = function (evt) {
    this.hiddenOpenPiskelInput.click();
  };

  ns.ImportController.prototype.onBrowseLocalClick_ = function (evt) {
    $.publish(Events.DIALOG_DISPLAY, 'browse-local');
    this.closeDrawer_();
  };

  ns.ImportController.prototype.openPiskelFile_ = function (file) {
    if (this.isPiskel_(file)){
      pskl.utils.PiskelFileUtils.loadFromFile(file, function (piskel, descriptor, fps) {
        piskel.setDescriptor(descriptor);
        pskl.app.piskelController.setPiskel(piskel);
        pskl.app.animationController.setFPS(fps);
      });
      this.closeDrawer_();
    }
  };

  ns.ImportController.prototype.importPictureFromFile_ = function () {
    var files = this.hiddenFileInput.get(0).files;
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
        throw 'File is not an image : ' + file.type;
      }
    }
  };

  ns.ImportController.prototype.isImage_ = function (file) {
    return file.type.indexOf('image') === 0;
  };

  ns.ImportController.prototype.isPiskel_ = function (file) {
    return (/\.piskel$/).test(file.name);
  };

  ns.ImportController.prototype.fillRestoreSession_ = function () {
    var previousInfo = pskl.app.backupService.getPreviousPiskelInfo();
    if (previousInfo) {
      var info = {
        name : previousInfo.name,
        date : pskl.utils.DateUtils.format(previousInfo.date, "{{H}}:{{m}} - {{Y}}/{{M}}/{{D}}")
      };

      this.prevSessionContainer.html(pskl.utils.Template.replace(this.previousSessionTemplate_, info));
      $(".restore-session-button").click(this.onRestorePreviousSessionClick_.bind(this));
    } else {
      this.prevSessionContainer.html("No piskel backup was found on this browser.");
    }
  };

  ns.ImportController.prototype.onRestorePreviousSessionClick_ = function () {
    if (window.confirm('This will erase your current workspace. Continue ?')) {
      pskl.app.backupService.load();
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
    }
  };

})();