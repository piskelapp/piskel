(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.SaveController = function (piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(ns.SaveController, pskl.controller.settings.AbstractSettingController);

  /**
   * @public
   */
  ns.SaveController.prototype.init = function () {
    var saveForm = document.querySelector('.save-form');
    this.getPartials_().forEach(function (partial) {
      pskl.utils.Template.insert(saveForm, 'beforeend', partial);
    });

    this.piskelName = document.querySelector('.piskel-name');
    this.saveFileStatus = document.querySelector('#save-file-status');
    this.descriptionInput = document.querySelector('#save-description');
    this.nameInput =  document.querySelector('#save-name');

    this.saveFileButton = document.querySelector('#save-file-button');
    this.saveBrowserButton = document.querySelector('#save-browser-button');

    var descriptor = this.piskelController.getPiskel().getDescriptor();
    this.descriptionInput.value = descriptor.description;
    this.nameInput.value = descriptor.name;

    this.addEventListener(this.saveFileButton, 'click', this.saveFile_);
    this.addEventListener(this.saveBrowserButton, 'click', this.saveBrowser_);
    this.addEventListener('form[name=save-form]', 'submit', this.onSaveFormSubmit_);

    if (pskl.app.isLoggedIn()) {
      this.authenticatedUserInit_();
    }

    if (pskl.utils.Environment.detectNodeWebkit()) {
      this.desktopApplicationInit_();
    }

    $.subscribe(Events.BEFORE_SAVING_PISKEL, this.disableSaveButtons_.bind(this));
    $.subscribe(Events.AFTER_SAVING_PISKEL, this.enableSaveButtons_.bind(this));

    if (pskl.app.storageService.isSaving()) {
      this.disableSaveButtons_();
    }
  };

  ns.SaveController.prototype.authenticatedUserInit_ = function () {
    var descriptor = this.piskelController.getPiskel().getDescriptor();
    this.isPublicCheckbox = document.querySelector('input[name=save-public-checkbox]');
    if (descriptor.isPublic) {
      this.isPublicCheckbox.setAttribute('checked', true);
    }
    this.saveOnlineButton = document.querySelector('#save-online-button');
    this.addEventListener(this.saveOnlineButton, 'click', this.saveOnline_);
  };

  ns.SaveController.prototype.desktopApplicationInit_ = function () {
    this.saveAsNewButton = document.querySelector('#save-as-button');
    this.addEventListener('#save-as-button', 'click', this.saveAs_);
  };

  ns.SaveController.prototype.getPartials_ = function () {
    var partials = [];
    if (pskl.utils.Environment.detectNodeWebkit()) {
      partials = [
        'save-file-nw-partial',
        'save-localstorage-partial',
        'save-online-unavailable-partial'
      ];
    } else if (pskl.app.isLoggedIn()) {
      partials = [
        'save-online-partial',
        'save-localstorage-partial',
        'save-file-partial'
      ];
    } else {
      partials = [
        'save-file-partial',
        'save-localstorage-partial',
        'save-online-unavailable-partial'
      ];
    }

    return partials;
  };

  ns.SaveController.prototype.onSaveFormSubmit_ = function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (pskl.app.isLoggedIn()) {
      this.saveOnline_();
    } else {
      this.saveLocal_();
    }
  };

  ns.SaveController.prototype.saveOnline_ = function () {
    this.beforeSaving_();
    var piskel = this.piskelController.getPiskel();
    pskl.app.storageService.saveToGallery(piskel).then(this.onSaveSuccess_);
  };

  ns.SaveController.prototype.saveBrowser_ = function () {
    this.beforeSaving_();
    var piskel = this.piskelController.getPiskel();
    pskl.app.storageService.saveToLocalStorage(piskel).then(this.onSaveSuccess_);
  };

  ns.SaveController.prototype.saveFile_ = function () {
    if (pskl.utils.Environment.detectNodeWebkit()) {
      this.saveFileDesktop_();
    } else {
      this.saveFileBrowser_();
    }
  };

  ns.SaveController.prototype.saveFileBrowser_ = function () {
    this.beforeSaving_();
    var piskel = this.piskelController.getPiskel();
    pskl.app.storageService.saveToFileBrowser(piskel).then(this.onSaveSuccess_);
  };

  ns.SaveController.prototype.saveFileDesktop_ = function () {
    this.beforeSaving_();
    var piskel = this.piskelController.getPiskel();
    pskl.app.storageService.saveToFileNodeWebkit(piskel).then(this.onSaveSuccess_);
  };

  ns.SaveController.prototype.saveAs_ = function () {
    this.beforeSaving_();
    var piskel = this.piskelController.getPiskel();
    pskl.app.storageService.saveToFileNodeWebkit(piskel, true).then(this.onSaveSuccess_);
  };

  ns.SaveController.prototype.getDescriptor_ = function () {
    var name = this.getName_();
    var description = this.getDescription_();
    var isPublic = this.isPublic_();
    return new pskl.model.piskel.Descriptor(name, description, isPublic);
  };

  ns.SaveController.prototype.getName_ = function () {
    return this.nameInput.value;
  };

  ns.SaveController.prototype.getDescription_ = function () {
    return this.descriptionInput.value;
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

  ns.SaveController.prototype.beforeSaving_ = function () {
    this.piskelController.getPiskel().setDescriptor(this.getDescriptor_());
  };

  ns.SaveController.prototype.disableSaveButtons_ = function () {
    this.setDisabled_(this.saveFileButton, true);
    this.setDisabled_(this.saveBrowserButton, true);
    this.setDisabled_(this.saveOnlineButton, true);
    this.setDisabled_(this.saveAsNewButton, true);
  };

  ns.SaveController.prototype.enableSaveButtons_ = function () {
    this.setDisabled_(this.saveFileButton, false);
    this.setDisabled_(this.saveBrowserButton, false);
    this.setDisabled_(this.saveOnlineButton, false);
    this.setDisabled_(this.saveAsNewButton, false);
  };

  /**
   * Safely update the disabled attribute on a HTML element.
   * Noop if the element is falsy
   */
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

})();
