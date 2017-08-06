(function () {
  var ns = $.namespace('pskl.service');

  ns.BeforeUnloadService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.BeforeUnloadService.prototype.init = function () {
    if (pskl.utils.Environment.detectNodeWebkit()) {
      // Add a dedicated listener to window 'close' event in nwjs environment.
      var win = require('nw.gui').Window.get();
      win.on('close', this.onNwWindowClose.bind(this, win));
    }

    window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
  };

  /**
   * In nw.js environment "onbeforeunload" is not triggered when closing the window.
   * Polyfill the behavior here.
   */
  ns.BeforeUnloadService.prototype.onNwWindowClose = function (win) {
    var msg = this.onBeforeUnload();
    if (msg) {
      if (!window.confirm(msg)) {
        return false;
      }
    }
    win.close(true);
  };

  ns.BeforeUnloadService.prototype.onBeforeUnload = function (evt) {
    // Attempt one last backup. Some of it may fail due to the asynchronous
    // nature of IndexedDB.
    pskl.app.backupService.backup();
    if (pskl.app.savedStatusService.isDirty()) {
      var confirmationMessage = 'Your current sprite has unsaved changes. Are you sure you want to quit?';

      evt = evt || window.event;
      if (evt) {
        evt.returnValue = confirmationMessage;
      }
      return confirmationMessage;
    }
  };

})();
