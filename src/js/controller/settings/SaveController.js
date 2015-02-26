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
    // timestamp used to generate unique name when saving as .piskel
    this.timestamp = new Date();

    // Only available in app-engine mode
    this.piskelName = document.querySelector('.piskel-name');

    this.saveOnlineStatus = document.querySelector('#save-online-status');
    this.saveFileStatus = document.querySelector('#save-file-status');

    var descriptor = this.piskelController.getPiskel().getDescriptor();
    this.descriptionInput = document.querySelector('#save-description');
    this.descriptionInput.value = descriptor.description;

    this.isPublicCheckbox = document.querySelector('input[name=save-public-checkbox]');
    if (descriptor.isPublic) {
      this.isPublicCheckbox.setAttribute('checked', true);
    }

    this.addEventListener('#save-file-button', 'click', this.saveFile_);
    this.addEventListener('#save-browser-button', 'click', this.saveLocal_);

    this.saveOnlineButton = document.querySelector('#save-online-button');
    this.addEventListener(this.saveOnlineButton, 'click', this.saveOnline_);

    this.addEventListener('form[name=save-form]', 'submit', this.onSaveFormSubmit_);

    this.nameInput =  document.querySelector('#save-name');
    this.nameInput.value = descriptor.name;
    this.addEventListener(this.nameInput, 'keyup', this.updateLocalStatusFilename_);

    if (pskl.app.isLoggedIn()) {
      this.saveOnlineStatus.innerHTML = pskl.utils.Template.get('save-online-status-partial');
    } else {
      this.saveOnlineStatus.innerHTML = pskl.utils.Template.get('save-please-login-partial');
      var container = document.querySelector('.setting-save-section');
      container.classList.add('anonymous');
    }

    this.updateLocalStatusFilename_();
  };

  ns.SaveController.prototype.updateLocalStatusFilename_ = function () {
    this.saveFileStatus.innerHTML = pskl.utils.Template.getAndReplace('save-file-status-template', {
      name : this.getLocalFilename_()
    });
  };

  ns.SaveController.prototype.getLocalFilename_ = function () {
    var piskelName = this.getName();
    var timestamp = pskl.utils.DateUtils.format(this.timestamp, "{{Y}}{{M}}{{D}}-{{H}}{{m}}{{s}}");
    return piskelName + "-" + timestamp + ".piskel";
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
    var name = this.getName();

    if (!name) {
      name = window.prompt('Please specify a name', 'New piskel');
    }

    if (name) {
      var description = this.getDescription();
      var isPublic = this.isPublic_();

      var descriptor = new pskl.model.piskel.Descriptor(name, description, isPublic);
      this.piskelController.getPiskel().setDescriptor(descriptor);

      this.beforeSaving_();

      this.saveOnlineButton.attr('disabled', true);
      this.saveOnlineStatus.innerHTML = 'Saving ...';

      pskl.app.storageService.store({
        success : this.onSaveSuccess_.bind(this),
        error : this.onSaveError_.bind(this),
        after : this.afterOnlineSaving_.bind(this)
      });
    }
  };

  ns.SaveController.prototype.saveLocal_ = function () {
    var localStorageService = pskl.app.localStorageService;
    var isOk = true;
    var name = this.getName();
    var description = this.getDescription();
    if (localStorageService.getPiskel(name)) {
      isOk = window.confirm('There is already a piskel saved as ' + name + '. Override ?');
    }

    if (isOk) {
      this.beforeSaving_();
      localStorageService.save(name, description, pskl.app.piskelController.serialize());
      window.setTimeout(function () {
        this.onSaveSuccess_();
        this.afterSaving_();
      }.bind(this), 500);
    }
  };

  ns.SaveController.prototype.saveFile_ = function () {
    this.beforeSaving_();
    pskl.utils.BlobUtils.stringToBlob(pskl.app.piskelController.serialize(), function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, this.getLocalFilename_());
      this.onSaveSuccess_();
      this.afterSaving_();
    }.bind(this), "application/piskel+json");
  };

  ns.SaveController.prototype.getName = function () {
    return this.nameInput.value;
  };

  ns.SaveController.prototype.getDescription = function () {
    return this.descriptionInput.value;
  };

  ns.SaveController.prototype.isPublic_ = function () {
    return !!this.isPublicCheckbox.checked;
  };

  ns.SaveController.prototype.beforeSaving_ = function () {
    this.updatePiskelDescriptor_();

    if (this.piskelName) {
      this.piskelName.classList.add('piskel-name-saving');
    }
  };

  ns.SaveController.prototype.updatePiskelDescriptor_ = function () {
    var name = this.getName();
    var description = this.getDescription();
    var isPublic = this.isPublic_();

    var descriptor = new pskl.model.piskel.Descriptor(name, description, isPublic);
    this.piskelController.getPiskel().setDescriptor(descriptor);
  };

  ns.SaveController.prototype.onSaveSuccess_ = function () {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
    $.publish(Events.SHOW_NOTIFICATION, [{"content": "Successfully saved !"}]);
    $.publish(Events.PISKEL_SAVED);
  };

  ns.SaveController.prototype.onSaveError_ = function (status) {
    $.publish(Events.SHOW_NOTIFICATION, [{"content": "Saving failed ("+status+")"}]);
  };

  ns.SaveController.prototype.afterOnlineSaving_ = function () {
    this.saveOnlineButton.attr('disabled', false);
    this.saveOnlineStatus.innerHTML = '';
    this.afterSaving_();
  };

  ns.SaveController.prototype.afterSaving_ = function () {
    if (this.piskelName) {
      this.piskelName.classList.remove('piskel-name-saving');
    }

    window.setTimeout($.publish.bind($, Events.HIDE_NOTIFICATION), 5000);
  };
})();