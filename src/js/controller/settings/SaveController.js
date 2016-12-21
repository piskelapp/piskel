(function () {
  var ns = $.namespace('pskl.controller.settings');

  var PARTIALS = {
    DESKTOP : 'save-desktop-partial',
    GALLERY : 'save-gallery-partial',
    GALLERY_UNAVAILABLE : 'save-gallery-unavailable-partial',
    LOCALSTORAGE : 'save-localstorage-partial',
    FILEDOWNLOAD : 'save-file-download-partial'
  };

  ns.SaveController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(ns.SaveController, pskl.controller.settings.AbstractSettingController);

  /**
   * @public
   */
  ns.SaveController.prototype.init = function () {
    this.getPiskelSize_().then(this.onPiskelSizeCalculated_.bind(this));

    this.saveForm = document.querySelector('.save-form');
    this.insertSavePartials_();

    this.piskelName = document.querySelector('.piskel-name');
    this.descriptionInput = document.querySelector('#save-description');
    this.nameInput =  document.querySelector('#save-name');
    this.isPublicCheckbox = document.querySelector('input[name=save-public-checkbox]');
    this.updateDescriptorInputs_();

    this.saveLocalStorageButton = document.querySelector('#save-localstorage-button');
    this.saveGalleryButton = document.querySelector('#save-gallery-button');
    this.saveDesktopButton = document.querySelector('#save-desktop-button');
    this.saveDesktopAsNewButton = document.querySelector('#save-desktop-as-new-button');
    this.saveFileDownloadButton = document.querySelector('#save-file-download-button');

    this.safeAddEventListener_(this.saveLocalStorageButton, 'click', this.saveToLocalStorage_);
    this.safeAddEventListener_(this.saveGalleryButton, 'click', this.saveToGallery_);
    this.safeAddEventListener_(this.saveDesktopButton, 'click', this.saveToDesktop_);
    this.safeAddEventListener_(this.saveDesktopAsNewButton, 'click', this.saveToDesktopAsNew_);
    this.safeAddEventListener_(this.saveFileDownloadButton, 'click', this.saveToFileDownload_);

    this.addEventListener(this.saveForm, 'submit', this.onSaveFormSubmit_);

    if (pskl.app.storageService.isSaving()) {
      this.disableSaveButtons_();
    }

    $.subscribe(Events.BEFORE_SAVING_PISKEL, this.disableSaveButtons_.bind(this));
    $.subscribe(Events.AFTER_SAVING_PISKEL, this.enableSaveButtons_.bind(this));
  };

  /**
   * Retrieve the size of the spritesheet that will be saved.
   * Not completely accurate, as the size canbe impacted by whatever the user enters
   * in the name and description fields on the save panel, but should give a rough idea.
   *
   * @return {Promise} promise that will resolve the spritesheet size {Number}
   */
  ns.SaveController.prototype.getPiskelSize_ = function () {
    var piskelController = this.piskelController;
    return new Promise(function (resolve, reject) {
      window.setTimeout(function () {
        try {
          var spritesheetSize = JSON.stringify(piskelController.serialize()).length;
          resolve(spritesheetSize);
        } catch (e) {
          reject(e);
        }
      }, 100);
    });
  };

  ns.SaveController.prototype.onPiskelSizeCalculated_ = function (spritesheetSize) {
    if (this.saveGalleryButton && spritesheetSize > Constants.APPENGINE_SAVE_LIMIT) {
      this.saveGalleryButton.setAttribute('disabled', true);
      document.querySelector('.save-online-status').innerHTML =
        '<div class="icon-common-warning-red" style="float:left; margin-top: 10px">&nbsp;</div>' +
        '<div style="overflow: hidden; padding-left: 10px">This sprite is too big to be saved on the gallery. ' +
        'Try saving it as a .piskel file.</div>';
    }
  };

  ns.SaveController.prototype.insertSavePartials_ = function () {
    this.getPartials_().forEach(function (partial) {
      pskl.utils.Template.insert(this.saveForm, 'beforeend', partial);
    }.bind(this));
  };

  ns.SaveController.prototype.getPartials_ = function () {
    if (pskl.utils.Environment.detectNodeWebkit()) {
      return [PARTIALS.DESKTOP, PARTIALS.LOCALSTORAGE, PARTIALS.GALLERY_UNAVAILABLE];
    }

    if (pskl.app.isLoggedIn()) {
      return [PARTIALS.GALLERY, PARTIALS.LOCALSTORAGE, PARTIALS.FILEDOWNLOAD];
    }

    // Uncomment this line to test the online save section locally.
    // return [PARTIALS.FILEDOWNLOAD, PARTIALS.LOCALSTORAGE, PARTIALS.GALLERY];
    return [PARTIALS.FILEDOWNLOAD, PARTIALS.LOCALSTORAGE, PARTIALS.GALLERY_UNAVAILABLE];
  };

  ns.SaveController.prototype.updateDescriptorInputs_ = function (evt) {
    var descriptor = this.piskelController.getPiskel().getDescriptor();
    this.descriptionInput.value = descriptor.description;
    this.nameInput.value = descriptor.name;
    if (descriptor.isPublic) {
      this.isPublicCheckbox.setAttribute('checked', true);
    }

    if (!pskl.app.isLoggedIn()) {
      var isPublicCheckboxContainer = document.querySelector('.save-public-section');
      isPublicCheckboxContainer.style.display = 'none';
    }
  };

  ns.SaveController.prototype.onSaveFormSubmit_ = function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (pskl.app.isLoggedIn()) {
      this.saveToGallery_();
    } else {
      this.saveToLocalStorage_();
    }
  };

  ns.SaveController.prototype.saveToFileDownload_ = function () {
    this.saveTo_('saveToFileDownload', false);
  };

  ns.SaveController.prototype.saveToGallery_ = function () {
    this.saveTo_('saveToGallery', false);
  };

  ns.SaveController.prototype.saveToLocalStorage_ = function () {
    this.saveTo_('saveToLocalStorage', false);
  };

  ns.SaveController.prototype.saveToDesktop_ = function () {
    this.saveTo_('saveToDesktop', false);
  };

  ns.SaveController.prototype.saveToDesktopAsNew_ = function () {
    this.saveTo_('saveToDesktop', true);
  };

  ns.SaveController.prototype.saveTo_ = function (methodName, saveAsNew) {
    var piskel = this.piskelController.getPiskel();
    piskel.setDescriptor(this.getDescriptor_());
    pskl.app.storageService[methodName](piskel, !!saveAsNew).then(this.onSaveSuccess_);
  };

  ns.SaveController.prototype.getDescriptor_ = function () {
    var name = this.nameInput.value;
    var description = this.descriptionInput.value;
    return new pskl.model.piskel.Descriptor(name, description, this.isPublic_());
  };

  ns.SaveController.prototype.isPublic_ = function () {
    if (!this.isPublicCheckbox) {
      return true;
    }

    return !!this.isPublicCheckbox.checked;
  };

  ns.SaveController.prototype.onSaveSuccess_ = function () {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.SaveController.prototype.disableSaveButtons_ = function () {
    this.setDisabled_(this.saveLocalStorageButton, true);
    this.setDisabled_(this.saveGalleryButton, true);
    this.setDisabled_(this.saveDesktopButton, true);
    this.setDisabled_(this.saveDesktopAsNewButton, true);
    this.setDisabled_(this.saveFileDownloadButton, true);
  };

  ns.SaveController.prototype.enableSaveButtons_ = function () {
    this.setDisabled_(this.saveLocalStorageButton, false);
    this.setDisabled_(this.saveGalleryButton, false);
    this.setDisabled_(this.saveDesktopButton, false);
    this.setDisabled_(this.saveDesktopAsNewButton, false);
    this.setDisabled_(this.saveFileDownloadButton, false);
  };

  ns.SaveController.prototype.setDisabled_ = function (element, isDisabled) {
    if (!element) {
      return;
    }

    if (isDisabled) {
      element.setAttribute('disabled', 'disabled');
    } else {
      element.removeAttribute('disabled');
    }
  };

  ns.SaveController.prototype.safeAddEventListener_ = function (element, type, callback) {
    if (element) {
      this.addEventListener(element, type, callback);
    }
  };

})();
