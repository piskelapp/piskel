(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.SaveController = function (piskelController) {
    this.piskelController = piskelController;
  };

  /**
   * @public
   */
  ns.SaveController.prototype.init = function () {
    this.saveForm = $('form[name=save-form]');
    this.nameInput =  $('#save-name');
    this.descriptionInput = $('#save-description');
    this.isPublicCheckbox = $('input[name=save-public-checkbox]');
    this.saveOnlineButton = $('#save-online-button');
    this.saveFileButton = $('#save-file-button');

    // Only available in app-engine mode ...
    this.piskelName = $('.piskel-name').get(0);

    this.saveOnlineStatus = $('#save-online-status');

    this.saveFileStatus = $('#save-file-status');
    this.timestamp = new Date();

    var descriptor = this.piskelController.getPiskel().getDescriptor();
    this.nameInput.val(descriptor.name);
    this.descriptionInput.val(descriptor.description);

    this.isPublicCheckbox.prop('checked', descriptor.isPublic);

    this.saveFileButton.click(this.onSaveLocalClick_.bind(this));
    this.nameInput.keyup(this.updateLocalStatusFilename_.bind(this));

    if (pskl.app.isLoggedIn()) {
      this.saveForm.submit(this.onSaveFormSubmit_.bind(this));
    } else {
      this.saveOnlineButton.hide();
      $('.save-public-section').hide();
      this.saveOnlineStatus.html(pskl.utils.Template.get('save-please-login-partial'));
      this.saveFileButton.get(0).classList.add('button-primary');
      this.saveForm.submit(this.onSaveLocalClick_.bind(this));
    }

    this.updateLocalStatusFilename_();
  };

  ns.SaveController.prototype.updateLocalStatusFilename_ = function () {
    this.saveFileStatus.html(pskl.utils.Template.getAndReplace('save-file-status-template', {
      name : this.getLocalFilename_()
    }));
  };

  ns.SaveController.prototype.getLocalFilename_ = function () {
    var piskelName = this.getName();
    var timestamp = pskl.utils.DateUtils.format(this.timestamp, "{{Y}}{{M}}{{D}}-{{H}}{{m}}{{s}}");
    return piskelName + "-" + timestamp + ".piskel";
  };

  ns.SaveController.prototype.onSaveFormSubmit_ = function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var name = this.getName();

    if (!name) {
      name = window.prompt('Please specify a name', 'New piskel');
    }

    if (name) {
      var description = this.getDescription();
      var isPublic = !!this.isPublicCheckbox.prop('checked');

      var descriptor = new pskl.model.piskel.Descriptor(name, description, isPublic);
      this.piskelController.getPiskel().setDescriptor(descriptor);

      this.beforeSaving_();
      pskl.app.storageService.store({
        success : this.onSaveSuccess_.bind(this),
        error : this.onSaveError_.bind(this),
        after : this.afterSaving_.bind(this)
      });
    }
  };

  ns.SaveController.prototype.onSaveLocalClick_ = function (evt) {
    this.beforeSaving_();

    pskl.utils.BlobUtils.stringToBlob(pskl.app.piskelController.serialize(), function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, this.getLocalFilename_());
      this.onSaveSuccess_();
      this.afterSaving_();
    }.bind(this), "application/piskel+json");
  };

  ns.SaveController.prototype.getName = function () {
    return this.nameInput.val();
  };

  ns.SaveController.prototype.getDescription = function () {
    return this.descriptionInput.val();
  };

  ns.SaveController.prototype.beforeSaving_ = function () {
    this.updatePiskelDescriptor_();

    this.saveOnlineButton.attr('disabled', true);
    this.saveOnlineStatus.html('Saving ...');

    if (this.piskelName) {
      this.piskelName.classList.add('piskel-name-saving');
    }
  };

  ns.SaveController.prototype.updatePiskelDescriptor_ = function () {
    var name = this.getName();
    var description = this.getDescription();
    var isPublic = !!this.isPublicCheckbox.prop('checked');

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

  ns.SaveController.prototype.afterSaving_ = function () {
    this.saveOnlineButton.attr('disabled', false);
    this.submitButton.html('');

    if (this.piskelName) {
      this.piskelName.classList.remove('piskel-name-saving');
    }

    window.setTimeout($.publish.bind($, Events.HIDE_NOTIFICATION), 2000);
  };
})();