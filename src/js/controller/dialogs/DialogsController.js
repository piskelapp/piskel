(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  var dialogs = {
    'manage-palettes' : {
      template : 'templates/dialogs/manage-palettes.html',
      controller : ns.PaletteManagerController
    }
  };

  ns.DialogsController = function (piskelController) {
    this.piskelController = piskelController;
    this.currentDialog_ = null;
  };

  ns.DialogsController.prototype.init = function () {
    this.dialogContainer_ = document.getElementById('dialog-container');
    this.dialogWrapper_ = document.getElementById('dialog-container-wrapper');
    $.subscribe(Events.DIALOG_DISPLAY, this.onDialogDisplayEvent_.bind(this));
    $.subscribe(Events.DIALOG_HIDE, this.onDialogHideEvent_.bind(this));
    pskl.app.shortcutService.addShortcut('M', this.onDialogDisplayEvent_.bind(this, null, 'manage-palettes'));
  };

  ns.DialogsController.prototype.onDialogDisplayEvent_ = function (evt, dialogId) {
    if (!this.isDisplayed()) {
      var config = dialogs[dialogId];
      if (config) {
        this.dialogContainer_.innerHTML = pskl.utils.Template.get(config.template);
        (new config.controller(this.piskelController)).init();
        this.showDialogWrapper_();
        this.currentDialog_ = dialogId;
      } else {
        console.error('Could not find dialog configuration for dialogId : ' + dialogId);
      }
    }
  };

  ns.DialogsController.prototype.onDialogHideEvent_ = function () {
    this.hideDialog();
  };

  ns.DialogsController.prototype.showDialogWrapper_ = function () {
    pskl.app.shortcutService.addShortcut('ESC', this.hideDialog.bind(this));
    this.dialogWrapper_.style.display = 'block';
  };

  ns.DialogsController.prototype.hideDialog = function () {
    this.hideDialogWrapper_();
    this.currentDialog_ = null;
  };

  ns.DialogsController.prototype.hideDialogWrapper_ = function () {
    pskl.app.shortcutService.removeShortcut('ESC');
    this.dialogWrapper_.style.display = 'none';
  };

  ns.DialogsController.prototype.isDisplayed = function () {
    return this.currentDialog_ !== null;
  };

})();