(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  var dialogs = {
    'cheatsheet' : {
      template : 'templates/dialogs/cheatsheet.html',
      controller : ns.CheatsheetController
    },
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
    },
    'performance-info' : {
      template : 'templates/dialogs/performance-info.html',
      controller : ns.PerformanceInfoController
    },
    'unsupported-browser' : {
      template : 'templates/dialogs/unsupported-browser.html',
      controller : ns.UnsupportedBrowserController
    }
  };

  ns.DialogsController = function (piskelController) {
    this.piskelController = piskelController;
    this.closePopupShortcut = pskl.service.keyboard.Shortcuts.MISC.CLOSE_POPUP;
    this.currentDialog_ = null;
  };

  ns.DialogsController.prototype.init = function () {
    this.dialogContainer_ = document.getElementById('dialog-container');
    this.dialogWrapper_ = document.getElementById('dialog-container-wrapper');

    $.subscribe(Events.DIALOG_DISPLAY, this.onDialogDisplayEvent_.bind(this));
    $.subscribe(Events.DIALOG_HIDE, this.hideDialog.bind(this));

    var createPaletteShortcut = pskl.service.keyboard.Shortcuts.COLOR.CREATE_PALETTE;
    pskl.app.shortcutService.registerShortcut(createPaletteShortcut, this.onCreatePaletteShortcut_.bind(this));

    var cheatsheetShortcut = pskl.service.keyboard.Shortcuts.MISC.CHEATSHEET;
    pskl.app.shortcutService.registerShortcut(cheatsheetShortcut, this.onCheatsheetShortcut_.bind(this));
    pskl.utils.Event.addEventListener('.cheatsheet-link', 'click', this.onCheatsheetShortcut_, this);

    // adding the .animated class here instead of in the markup to avoid an animation during app startup
    this.dialogWrapper_.classList.add('animated');
    pskl.utils.Event.addEventListener(this.dialogWrapper_, 'click', this.onWrapperClicked_, this);

  };

  ns.DialogsController.prototype.onCreatePaletteShortcut_ = function () {
    this.toggleDialog_('create-palette');
  };

  ns.DialogsController.prototype.onCheatsheetShortcut_ = function () {
    this.toggleDialog_('cheatsheet');
  };

  /**
   * If no dialog is currently displayed, the dialog with the provided id will be displayed.
   * If a dialog is displayed and has the same id as the provided id, hide it.
   * Otherwise, no-op.
   */
  ns.DialogsController.prototype.toggleDialog_ = function (dialogId) {
    if (!this.isDisplayingDialog_()) {
      this.showDialog(dialogId);
    } else if (this.getCurrentDialogId_() === dialogId) {
      this.hideDialog();
    }
  };

  ns.DialogsController.prototype.onDialogDisplayEvent_ = function (evt, args) {
    this.showDialog(args.dialogId, args.initArgs);
  };

  ns.DialogsController.prototype.onWrapperClicked_ = function (evt) {
    if (evt.target === this.dialogWrapper_) {
      this.hideDialog();
    }
  };

  ns.DialogsController.prototype.showDialog = function (dialogId, initArgs) {
    if (this.isDisplayingDialog_()) {
      return;
    }

    var config = dialogs[dialogId];
    if (!config) {
      console.error('Could not find dialog configuration for dialogId : ' + dialogId);
      return;
    }

    this.dialogContainer_.classList.add(dialogId);

    this.dialogContainer_.innerHTML = pskl.utils.Template.get(config.template);
    var controller = new config.controller(this.piskelController);
    controller.init(initArgs);

    this.currentDialog_ = {
      id : dialogId,
      controller : controller
    };

    pskl.app.shortcutService.registerShortcut(this.closePopupShortcut, this.hideDialog.bind(this));
    this.dialogWrapper_.classList.add('show');
  };

  ns.DialogsController.prototype.hideDialog = function () {
    if (this.isHiding_ || !this.isDisplayingDialog_()) {
      return;
    }

    pskl.app.shortcutService.unregisterShortcut(this.closePopupShortcut);
    this.dialogWrapper_.classList.remove('show');
    window.setTimeout(this.cleanupDialogContainer_.bind(this), 500);
    this.isHiding_ = true;
  };

  ns.DialogsController.prototype.cleanupDialogContainer_ = function () {
    this.dialogContainer_.classList.remove(this.currentDialog_.id);
    this.currentDialog_.controller.destroy();
    this.currentDialog_ = null;

    this.dialogContainer_.innerHTML = '';
    this.isHiding_ = false;
  };

  ns.DialogsController.prototype.isDisplayingDialog_ = function () {
    return this.currentDialog_ !== null;
  };

  ns.DialogsController.prototype.getCurrentDialogId_ = function () {
    if (this.currentDialog_) {
      return this.currentDialog_.id;
    }
    return null;
  };

})();
