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
    this.saveButton = $('#save-button');
    this.status = $('#save-status');

    var descriptor = this.piskelController.piskel.getDescriptor();
    this.nameInput.val(descriptor.name);
    this.descriptionInput.val(descriptor.description);

    this.isPublicCheckbox.prop('checked', descriptor.isPublic);

    if (!pskl.app.isAppEngineVersion) {
      this.nameInput.attr('disabled', 'disabled');
      this.descriptionInput.attr('disabled', 'disabled');
      this.isPublicCheckbox.attr('disabled', 'disabled');
    }

    this.saveForm.submit(this.onSaveFormSubmit_.bind(this));
  };

  ns.SaveController.prototype.onSaveFormSubmit_ = function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var name = this.nameInput.val();
    var description = this.descriptionInput.val();
    var isPublic = !!this.isPublicCheckbox.prop('checked');

    var descriptor = new pskl.model.piskel.Descriptor(name, description, isPublic);
    this.piskelController.piskel.setDescriptor(descriptor);

    this.beforeSaving_();
    pskl.app.store({
      success : this.onSaveSuccess_.bind(this),
      error : this.onSaveError_.bind(this),
      after : this.afterSaving_.bind(this)
    });
  };

  ns.SaveController.prototype.beforeSaving_ = function () {
    this.saveButton.attr('disabled', true);
    this.status.html('Saving ...');
    $('.piskel-name').get(0).classList.add('piskel-name-saving');
  };

  ns.SaveController.prototype.onSaveSuccess_ = function () {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
    $.publish(Events.SHOW_NOTIFICATION, [{"content": "Successfully saved !"}]);
  };

  ns.SaveController.prototype.onSaveError_ = function (status) {
    $.publish(Events.SHOW_NOTIFICATION, [{"content": "Saving failed ("+status+")"}]);
  };

  ns.SaveController.prototype.afterSaving_ = function () {
    this.saveButton.attr('disabled', false);
    this.status.html('');
    $('.piskel-name').get(0).classList.remove('piskel-name-saving');

    window.setTimeout($.publish.bind($, Events.HIDE_NOTIFICATION), 2000);
  };
})();