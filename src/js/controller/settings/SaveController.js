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

    this.insertPartials_();

    // Only available in app-engine mode
    this.piskelName = document.querySelector('.piskel-name');
    this.saveOnlineStatus = document.querySelector('#save-online-status');
    this.saveFileStatus = document.querySelector('#save-file-status');
    this.descriptionInput = document.querySelector('#save-description');
    this.nameInput =  document.querySelector('#save-name');
    this.saveOnlineButton = document.querySelector('#save-online-button');
    this.isPublicCheckbox = document.querySelector('input[name=save-public-checkbox]');

    var descriptor = this.piskelController.getPiskel().getDescriptor();
    this.descriptionInput.value = descriptor.description;
    this.nameInput.value = descriptor.name;
    if (descriptor.isPublic) {
      this.isPublicCheckbox.setAttribute('checked', true);
    }

    if (pskl.utils.Environment.detectNodeWebkit()) {
      this.addEventListener('#save-as-button', 'click', this.saveAs_);
    }

    this.addEventListener('#save-file-button', 'click', this.saveFile_);
    this.addEventListener('#save-browser-button', 'click', this.saveLocal_);
    this.addEventListener(this.saveOnlineButton, 'click', this.saveOnline_);
    this.addEventListener('form[name=save-form]', 'submit', this.onSaveFormSubmit_);

    if (pskl.app.isLoggedIn()) {
      pskl.utils.Template.insert(this.saveOnlineStatus, 'beforeend', 'save-online-status-partial');
    } else {
      pskl.utils.Template.insert(this.saveOnlineStatus, 'beforeend', 'save-please-login-partial');
      var container = document.querySelector('.setting-save-section');
      container.classList.add('anonymous');
    }
  };

  ns.SaveController.prototype.insertPartials_ = function () {
    var partials = [];
    if (pskl.utils.Environment.detectNodeWebkit()) {
      partials = [
        'save-file-nw-partial',
        'save-localstorage-partial',
        'save-online-partial'
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
        'save-online-partial'
      ];
    }

    var container = document.querySelector('.save-form');
    partials.forEach(function (partial) {
      pskl.utils.Template.insert(container, 'beforeend', partial);
    });

  };

  ns.SaveController.prototype.getLocalFilename_ = function () {
    var piskelName = this.getName();
    var timestamp = pskl.utils.DateUtils.format(this.timestamp, '{{Y}}{{M}}{{D}}-{{H}}{{m}}{{s}}');
    return piskelName + '-' + timestamp + '.piskel';
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

      this.saveOnlineButton.setAttribute('disabled', true);
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
    // detect if this is running in NodeWebkit
    if (pskl.utils.Environment.detectNodeWebkit()) {
      pskl.app.desktopStorageService.save();
    } else {
      this.saveFileBrowser_();
    }
  };

  ns.SaveController.prototype.saveAs_ = function () {
    pskl.app.desktopStorageService.savePiskelAs();
  };

  ns.SaveController.prototype.saveFileBrowser_ = function () {
    this.beforeSaving_();
    pskl.utils.BlobUtils.stringToBlob(pskl.app.piskelController.serialize(), function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, this.getLocalFilename_());
      this.onSaveSuccess_();
      this.afterSaving_();
    }.bind(this), 'application/piskel+json');
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
    $.publish(Events.SHOW_NOTIFICATION, [{'content': 'Successfully saved !'}]);
    $.publish(Events.PISKEL_SAVED);
  };

  ns.SaveController.prototype.onSaveError_ = function (status) {
    $.publish(Events.SHOW_NOTIFICATION, [{'content': 'Saving failed (' + status + ')'}]);
  };

  ns.SaveController.prototype.afterOnlineSaving_ = function () {
    this.saveOnlineButton.setAttribute('disabled', false);
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
