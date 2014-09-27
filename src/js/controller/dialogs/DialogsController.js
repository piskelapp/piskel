(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  var dialogs = {
    'create-palette' : {
      template : 'templates/dialogs/create-palette.html',
      controller : ns.CreatePaletteController
    },
    'browse-local' : {
      template : 'templates/dialogs/browse-local.html',
      controller : ns.BrowseLocalController
    },
    'import-image' : {
      template : 'templates/dialogs/import-image.html',
      controller : ns.ImportImageController
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

    pskl.app.shortcutService.addShortcut('alt+P', this.onDialogDisplayEvent_.bind(this, null, 'create-palette'));

    this.dialogWrapper_.classList.add('animated');
  };

  ns.DialogsController.prototype.onDialogDisplayEvent_ = function (evt, args) {
    var dialogId, initArgs;
    if (typeof args === 'string') {
      dialogId = args;
    } else {
      dialogId = args.dialogId;
      initArgs = args.initArgs;
    }
    if (!this.isDisplayed()) {
      var config = dialogs[dialogId];
      if (config) {
        this.dialogContainer_.classList.add(dialogId);
        this.dialogContainer_.innerHTML = pskl.utils.Template.get(config.template);

        var controller = new config.controller(this.piskelController);
        controller.init(initArgs);

        this.showDialogWrapper_();
        this.currentDialog_ = {
          id : dialogId,
          controller : controller
        };
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
    this.dialogWrapper_.classList.add('show');
  };

  ns.DialogsController.prototype.hideDialog = function () {
    var currentDialog = this.currentDialog_;
    if (currentDialog) {
      currentDialog.controller.destroy();
      var dialogId = this.currentDialog_.id;
      window.setTimeout(function () {
        this.dialogContainer_.classList.remove(dialogId);
      }.bind(this), 800);
    }

    this.hideDialogWrapper_();
    this.currentDialog_ = null;
  };

  ns.DialogsController.prototype.hideDialogWrapper_ = function () {
    pskl.app.shortcutService.removeShortcut('ESC');
    this.dialogWrapper_.classList.remove('show');
  };

  ns.DialogsController.prototype.isDisplayed = function () {
    return this.currentDialog_ !== null;
  };

})();