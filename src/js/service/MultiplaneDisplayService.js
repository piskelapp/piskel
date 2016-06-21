(function () {
  var ns = $.namespace('pskl.service');

  /**
  * This service just updates css rules 'multiplane-only' and 'singleplane-only'
  * when the plane tools should be shown or hidden.
  */
  ns.MultiplaneDisplayService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.MultiplaneDisplayService.prototype.init = function () {
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.update_, this));
    $.subscribe(Events.HISTORY_STATE_LOADED, $.proxy(this.update_, this));
    $.subscribe(Events.OPEN_SETTINGS_MENU, $.proxy(this.update_, this));
    $.subscribe(Events.DIALOG_DISPLAY, $.proxy(this.update_, this));
    this.update_();
  };

  ns.MultiplaneDisplayService.prototype.update_ = function () {
    if (pskl.UserSettings.get(pskl.UserSettings.PLANE_MODE) || this.piskelController.isMultiPlane()) {
      $('.multiplane-only').show();
      $('.singleplane-only').hide();
    } else {
      $('.multiplane-only').hide();
      $('.singleplane-only').show();
    }

    if (this.piskelController.isMultiPlane()) {
      $('.disable-multiplane').prop('disabled', true);
      $('.disable-singleplane').prop('disabled', false);
    } else {
      $('.disable-multiplane').prop('disabled', false);
      $('.disable-singleplane').prop('disabled', true);
    }
  };
})();
