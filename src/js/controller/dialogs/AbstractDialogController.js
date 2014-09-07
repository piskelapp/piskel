(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.AbstractDialogController = function () {};


  ns.AbstractDialogController.prototype.init = function () {
    this.closeButton = document.querySelector('.dialog-close');
    this.closeButton.addEventListener('click', this.closeDialog.bind(this));
  };

  ns.AbstractDialogController.prototype.destroy = function () {};

  ns.AbstractDialogController.prototype.closeDialog = function () {
    this.destroy();
    $.publish(Events.DIALOG_HIDE);
  };

})();