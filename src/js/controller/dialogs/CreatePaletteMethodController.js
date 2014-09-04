(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.CreatePaletteMethodController = function (piskelController) {
  };

  pskl.utils.inherit(ns.CreatePaletteMethodController, ns.AbstractDialogController);

  ns.CreatePaletteMethodController.prototype.init = function () {
    this.superclass.init.call(this);

    this.createButton = document.querySelector('.create-palette-method-continue');
    this.cancelButton = document.querySelector('.create-palette-method-cancel');

    this.createButton.addEventListener('click', this.onCreateButtonClick_.bind(this));

    this.cancelButton.addEventListener('click', function () {
      $.publish(Events.DIALOG_HIDE);
    });
  };

  ns.CreatePaletteMethodController.prototype.onCreateButtonClick_ = function (evt) {
    var method = this.getSelectedMethod_();

    var initArgs = {
      method : method
    };

    if (method === 'palette') {
      initArgs.paletteId = this.getSelectedPaletteId_();
    }

    this.closeDialog();

    window.setTimeout(function () {
      $.publish(Events.DIALOG_DISPLAY, {
        dialogId : 'create-palette',
        initArgs : initArgs
      });
    },500);
  };

  ns.CreatePaletteMethodController.prototype.getSelectedMethod_ = function (evt) {
    var options = document.querySelectorAll('.create-palette-method-list input[type="radio"]');

    var method;
    for (var i = 0 ; i < options.length ; i++) {
      console.log(options[i]);
      if (options[i].checked) {
        method = options[i].value;
      }
    }

    return method;
  };

  ns.CreatePaletteMethodController.prototype.getSelectedPaletteId_ = function (evt) {
    var select = document.querySelector('.palettes-list-select');
    return select.value;
  };


})();