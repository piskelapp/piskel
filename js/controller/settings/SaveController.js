(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.SaveController = function (piskelController) {
    this.piskelController = piskelController;
  };

  /**
   * @public
   */
  ns.SaveController.prototype.init = function () {
    this.titleInput = $('#save-title');
    this.descriptionInput = $('#save-description');
    this.saveForm = $('form[name=save-form]');

    var descriptor = this.piskelController.piskel.getDescriptor();
    this.titleInput.val(descriptor.name);
    this.descriptionInput.val(descriptor.description);
  };
})();