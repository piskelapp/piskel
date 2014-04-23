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
    this.saveCloudButton = $('#save-cloud-button');
    this.saveLocalButton = $('#save-local-button');

    // Only available in app-engine mode ...
    this.piskelName = $('.piskel-name').get(0);

    this.status = $('#save-status');

    var descriptor = this.piskelController.getPiskel().getDescriptor();
    this.nameInput.val(descriptor.name);
    this.descriptionInput.val(descriptor.description);

    this.isPublicCheckbox.prop('checked', descriptor.isPublic);

    if (!pskl.app.isLoggedIn()) {
      this.saveCloudButton.attr('disabled', 'disabled');
      this.status.html('You are not logged in. Only Local Save is available.');
    } else {
      this.saveForm.submit(this.onSaveFormSubmit_.bind(this));
    }

    this.saveLocalButton.click(this.onSaveLocalClick_.bind(this));
  };

  ns.SaveController.prototype.onSaveFormSubmit_ = function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var name = this.getName();
    var description = this.getDescription();
    var isPublic = !!this.isPublicCheckbox.prop('checked');

    var descriptor = new pskl.model.piskel.Descriptor(name, description, isPublic);
    this.piskelController.getPiskel().setDescriptor(descriptor);

    this.beforeSaving_();
    pskl.app.store({
      success : this.onSaveSuccess_.bind(this),
      error : this.onSaveError_.bind(this),
      after : this.afterSaving_.bind(this)
    });
  };

  ns.SaveController.prototype.onSaveLocalClick_ = function (evt) {
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
      }.bind(this), 1000);
    }
  };

  ns.SaveController.prototype.getName = function () {
    return this.nameInput.val();
  };

  ns.SaveController.prototype.getDescription = function () {
    return this.descriptionInput.val();
  };

  ns.SaveController.prototype.beforeSaving_ = function () {
    this.saveCloudButton.attr('disabled', true);
    this.status.html('Saving ...');

    if (this.piskelName) {
      this.piskelName.classList.add('piskel-name-saving');
    }
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
    this.saveCloudButton.attr('disabled', false);
    this.status.html('');

    if (this.piskelName) {
      this.piskelName.classList.remove('piskel-name-saving');
    }

    window.setTimeout($.publish.bind($, Events.HIDE_NOTIFICATION), 2000);
  };
})();