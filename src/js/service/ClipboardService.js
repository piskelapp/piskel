(function () {
  var ns = $.namespace('pskl.service');

  ns.ClipboardService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.ClipboardService.prototype.init = function () {
    window.addEventListener('copy', this._onCopy.bind(this), true);
    window.addEventListener('cut', this._onCut.bind(this), true);
    window.addEventListener('paste', this._onPaste.bind(this), true);
  };

  ns.ClipboardService.prototype._onCut = function (event) {
    $.publish(Events.CLIPBOARD_CUT, event);
  };

  ns.ClipboardService.prototype._onCopy = function (event) {
    $.publish(Events.CLIPBOARD_COPY, event);
  };

  ns.ClipboardService.prototype._onPaste = function (event) {
    $.publish(Events.CLIPBOARD_PASTE, event);
  };
})();
